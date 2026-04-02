const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/document");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docdt_file");

module.exports = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({
        message: "Multer error occurred during upload.",
        error: err,
      });
    } else if (err) {
      return res.status(500).json({
        message: "Unknown error occurred during upload.",
        error: err,
      });
    }
    try {
      const {
        docdtId,
        receiverCode,
        departmentId1 = [],
        departmentId2 = [],
        divisionId1 = [],
        divisionId2 = [],
        docstatusId,
        description,
      } = req.body;

      if (!docdtId) {
        return res.status(400).json({ message: "docdtId is required" });
      }

      let logTransactions = [];
      const docdt = await prisma.docDirector.findUnique({
        where: {
          id: Number(docdtId),
        },
      });

      if (
        receiverCode &&
        !departmentId1.length &&
        !departmentId2.length &&
        !divisionId1.length &&
        !divisionId2.length
      ) {
        if (!Array.isArray(receiverCode) || receiverCode.length === 0) {
          return res
            .status(400)
            .json({ message: "receiverCode must be a non-empty array" });
        }

        for (const receiverC of receiverCode) {
          const user = await prisma.user.findUnique({
            where: { username: receiverC },
            include: {
              employee: true,
            },
          });

          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }

          if (!docdt) {
            return res.status(404).json({ message: "Document not found" });
          }

          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                rankId: user.rankId ? Number(user.rankId) : null,
                roleId: user.roleId ? Number(user.roleId) : null,
                positionId: Number(user.employee.posId) ?? null,
                docstatusId: Number(docstatusId),
                description,
                departmentId: user.employee.departmentId ?? null,
                divisionId: user.employee.divisionId ?? null,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                description,
              },
            }),
          );
        }
      } else if (
        (departmentId1.length || departmentId2.length) &&
        !receiverCode &&
        !divisionId1.length &&
        !divisionId2.length
      ) {
        // 🔹 ถ้าไม่มี receiverCode ใช้ departmentId1 และ departmentId2 (ถ้ามี)
        const allDepartments = [
          ...(Array.isArray(departmentId1) && departmentId1.length
            ? departmentId1.map((id) => ({
                id: Number(id),
                departmentactive: 1,
              }))
            : []),
          ...(Array.isArray(departmentId2) && departmentId2.length
            ? departmentId2.map((id) => ({
                id: Number(id),
                departmentactive: 2,
              }))
            : []),
        ];

        if (!allDepartments.length) {
          return res
            .status(400)
            .json({ message: "At least one departmentId is required" });
        }

        for (const { id: departmentId, departmentactive } of allDepartments) {
          const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 6,
                    },
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          const departmentWithUser = {
            ...department,
            employees: department?.employees?.length
              ? department.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!departmentWithUser || !departmentWithUser.employees.length) {
            return res.status(404).json({
              message: `Department ${departmentId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = departmentWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 6,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in department ${departmentId} with specified rank and role`,
            });
          }

          const docdt = await prisma.docDirector.findUnique({
            where: {
              id: Number(docdtId),
            },
          });

          if (!docdt) {
            return res.status(404).json({
              message: "Document not found with the provided docdtId",
            });
          }

          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId,
                divisionId: Number(depUser.divisionId) ?? null,
                departmentactive,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
                departmentactive,
              },
            }),
          );
        }
      } else if (
        (divisionId1.length || divisionId2.length) &&
        !receiverCode &&
        !departmentId1.length &&
        !departmentId2.length
      ) {
        const allDivisions = [
          ...(Array.isArray(divisionId1) && divisionId1.length
            ? divisionId1.map((id) => ({
                id: Number(id),
                divisionactive: 1,
              }))
            : []),
          ...(Array.isArray(divisionId2) && divisionId2.length
            ? divisionId2.map((id) => ({
                id: Number(id),
                divisionactive: 2,
              }))
            : []),
        ];

        if (!allDivisions.length) {
          return res
            .status(400)
            .json({ message: "At least one divisionId is required" });
        }

        for (const { id: divisionId, divisionactive } of allDivisions) {
          const division = await prisma.division.findUnique({
            where: { id: divisionId },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 7,
                    },
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          const divisionWithUser = {
            ...division,
            employees: division?.employees?.length
              ? division.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!divisionWithUser || !divisionWithUser.employees.length) {
            return res.status(404).json({
              message: `Division ${divisionId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = divisionWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 7,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in division ${divisionId} with specified rank and role`,
            });
          }

          const docdt = await prisma.docDirector.findUnique({
            where: {
              id: Number(docdtId),
            },
          });

          if (!docdt) {
            return res.status(404).json({
              message: "Document not found with the provided docdtId",
            });
          }

          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                divisionId,
                divisionactive,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
                divisionactive,
              },
            }),
          );
        }
      } else if (
        receiverCode &&
        (departmentId1.length || departmentId2.length)
      ) {
        const users = [];

        for (const receiverC of receiverCode) {
          const user = await prisma.user.findUnique({
            where: { username: receiverC },
            include: { employee: true },
          });

          if (!user) {
            return res.status(404).json({
              message: `User not found: ${receiverC}`,
            });
          }

          users.push(user);
        }

        const createLogs = (
          receiverCode,
          rankId,
          roleId,
          positionId,
          departmentId,
          divisionId,
          docstatusId,
          departmentactive = null,
        ) => [
          prisma.docdtLog.create({
            data: {
              docdtId: Number(docdtId),
              assignerCode: req.user.username,
              receiverCode,
              rankId,
              roleId,
              positionId,
              docstatusId,
              description,
              departmentId,
              divisionId,
              departmentactive,
            },
          }),
          prisma.docdtTracking.create({
            data: {
              docdtId: Number(docdtId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId,
              description,
              departmentactive,
            },
          }),
        ];

        // ✅ create logs for receiverCode
        for (const user of users) {
          logTransactions.push(
            ...createLogs(
              user.username,
              user.rankId ?? null,
              user.roleId ?? null,
              user.employee?.posId ?? null,
              user.employee?.departmentId ?? null,
              user.employee?.divisionId ?? null,
              Number(docstatusId),
              (departmentactive = null),
            ),
          );
        }

        const allDepartments = [
          ...(Array.isArray(departmentId1) && departmentId1.length
            ? departmentId1.map((id) => ({
                id: Number(id),
                departmentactive: 1,
              }))
            : []),
          ...(Array.isArray(departmentId2) && departmentId2.length
            ? departmentId2.map((id) => ({
                id: Number(id),
                departmentactive: 2,
              }))
            : []),
        ];

        if (!allDepartments.length) {
          return res
            .status(400)
            .json({ message: "At least one departmentId is required." });
        }

        for (const { id: departmentId, departmentactive } of allDepartments) {
          const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 6,
                    },
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          const departmentWithUser = {
            ...department,
            employees: department?.employees?.length
              ? department.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!departmentWithUser || !departmentWithUser.employees.length) {
            return res.status(404).json({
              message: `department ${departmentId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = departmentWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 6,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in department ${departmentId} with specified rank and role`,
            });
          }

          logTransactions.push(
            ...createLogs(
              depUser.emp_code,
              depUser.user?.rankId ?? null,
              depUser.user?.roleId ?? null,
              depUser.posId ?? null,
              depUser.departmentId ?? null,
              depUser.divisionId ?? null,
              Number(docstatusId),
              departmentactive,
            ),
          );
        }
      } else if (receiverCode && (divisionId1.length || divisionId2.length)) {
        const users = [];

        for (const receiverC of receiverCode) {
          const user = await prisma.user.findUnique({
            where: { username: receiverC },
            include: { employee: true },
          });

          if (!user) {
            return res.status(404).json({
              message: `User not found: ${receiverC}`,
            });
          }

          users.push(user);
        }

        const createLogs = (
          receiverCode,
          rankId,
          roleId,
          positionId,
          departmentId,
          divisionId,
          docstatusId,
          divisionactive = null,
        ) => [
          prisma.docdtLog.create({
            data: {
              docdtId: Number(docdtId),
              assignerCode: req.user.username,
              receiverCode,
              rankId,
              roleId,
              positionId,
              docstatusId,
              description,
              departmentId,
              divisionId,
              divisionactive,
            },
          }),
          prisma.docdtTracking.create({
            data: {
              docdtId: Number(docdtId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId,
              description,
              divisionactive,
            },
          }),
        ];

        // ✅ create logs for receiverCode
        for (const user of users) {
          logTransactions.push(
            ...createLogs(
              user.username,
              user.rankId ?? null,
              user.roleId ?? null,
              user.employee?.posId ?? null,
              user.employee?.departmentId ?? null,
              user.employee?.divisionId ?? null,
              Number(docstatusId),
              (divisionactive = null),
            ),
          );
        }

        const allDivisions = [
          ...(Array.isArray(divisionId1) && divisionId1.length
            ? divisionId1.map((id) => ({
                id: Number(id),
                divisionactive: 1,
              }))
            : []),
          ...(Array.isArray(divisionId2) && divisionId2.length
            ? divisionId2.map((id) => ({
                id: Number(id),
                divisionactive: 2,
              }))
            : []),
        ];

        if (!allDivisions.length) {
          return res
            .status(400)
            .json({ message: "At least one divisionId is required." });
        }

        for (const { id: divisionId, divisionactive } of allDivisions) {
          const division = await prisma.division.findUnique({
            where: { id: divisionId },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 7,
                    },
                    select: {
                      rankId: true,
                      roleId: true,
                    },
                  },
                },
              },
            },
          });

          const divisionWithUser = {
            ...division,
            employees: division?.employees?.length
              ? division.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!divisionWithUser || !divisionWithUser.employees.length) {
            return res.status(404).json({
              message: `division ${divisionId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = divisionWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 7,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in division ${divisionId} with specified rank and role`,
            });
          }

          logTransactions.push(
            ...createLogs(
              depUser.emp_code,
              depUser.user?.rankId ?? null,
              depUser.user?.roleId ?? null,
              depUser.posId ?? null,
              depUser.departmentId ?? null,
              depUser.divisionId ?? null,
              Number(docstatusId),
              divisionactive,
            ),
          );
        }
      }

      // อัปเดตสถานะของ docDirector
      const updateDocDirectordocDirector = prisma.docDirector.update({
        where: {
          id: Number(docdtId),
        },
        data: {
          assignto: 1,
        },
      });

      const transactions = [updateDocDirectordocDirector, ...logTransactions];

      const results = await prisma.$transaction(transactions);

      res.status(201).json({
        message: "Document assigned successfully",
        data: results,
      });
    } catch (error) {
      console.error("Error assigning document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
