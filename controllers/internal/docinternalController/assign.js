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

const upload = multer({ storage: storage }).single("docin_file");

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
        docinId,
        receiverCode,
        departmentId1 = [],
        departmentId2 = [],
        divisionId1 = [],
        divisionId2 = [],
        officeId1 = [],
        officeId2 = [],
        docstatusId,
        description,
      } = req.body;

      if (!docinId) {
        return res.status(400).json({ message: "docinId is required" });
      }

      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinId),
        },
      });

      if (!docin) {
        return res
          .status(404)
          .json({ message: "Document not found with the provided docinId" });
      }

      let logTransactions = [];

      if (
        receiverCode &&
        !departmentId1.length &&
        !departmentId2.length &&
        !divisionId1.length &&
        !divisionId2.length &&
        !officeId1.length &&
        !officeId2.length
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
            return res.status(404).json({
              message: "User not found with the provided receiverCode",
            });
          }

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                rankId: user.rankId ? Number(user.rankId) : null,
                roleId: user.roleId ? Number(user.roleId) : null,
                positionId: user.employee.posId
                  ? Number(user.employee.posId)
                  : null,
                docstatusId: Number(docstatusId),
                description,
                departmentId: user.employee.departmentId
                  ? Number(user.employee.departmentId)
                  : null,
                divisionId: user.employee.divisionId
                  ? Number(user.employee.divisionId)
                  : null,
                officeId: user.employee.officeId
                  ? Number(user.employee.officeId)
                  : null,
                unitId: user.employee.unitId
                  ? Number(user.employee.unitId)
                  : null,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
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
        !divisionId2.length &&
        !officeId1.length &&
        !officeId2.length
      ) {
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
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                departmentactive,
                divisionId: Number(depUser.divisionId) ?? null,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
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
        !departmentId2.length &&
        !officeId1.length &&
        !officeId2.length
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
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                divisionId: Number(depUser.divisionId) ?? null,
                divisionactive,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
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
        (officeId1.length || officeId2.length) &&
        !receiverCode &&
        !departmentId1.length &&
        !departmentId2.length &&
        !divisionId1.length &&
        !divisionId2.length
      ) {
        const allOffices = [
          ...(Array.isArray(officeId1) && officeId1.length
            ? officeId1.map((id) => ({
                id: Number(id),
                officeactive: 1,
              }))
            : []),
          ...(Array.isArray(officeId2) && officeId2.length
            ? officeId2.map((id) => ({
                id: Number(id),
                officeactive: 2,
              }))
            : []),
        ];

        if (!allOffices.length) {
          return res
            .status(400)
            .json({ message: "At least one officeId is required." });
        }

        for (const { id: officeId, officeactive } of allOffices) {
          const office = await prisma.office.findUnique({
            where: { id: officeId },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 8,
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

          const officeWithUser = {
            ...office,
            employees: office?.employees?.length
              ? office.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!officeWithUser || !officeWithUser.employees.length) {
            return res.status(404).json({
              message: `office ${officeId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = officeWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 8,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in office ${officeId} with specified rank and role`,
            });
          }

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: Number(depUser.user.rankId) ?? null,
                roleId: Number(depUser.user.roleId) ?? null,
                positionId: Number(depUser.posId) ?? null,
                docstatusId: Number(docstatusId) ?? null,
                description,
                departmentId: Number(depUser.departmentId) ?? null,
                divisionId: Number(depUser.divisionId) ?? null,
                officeId: Number(depUser.officeId) ?? null,
                officeactive,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                description,
                officeactive,
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
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
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
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
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
              2,
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
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
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
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId,
              description,
              divisionactive,
            },
          }),
        ];

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
              2,
              divisionactive,
            ),
          );
        }
      } else if (receiverCode && (officeId1.length || officeId2.length)) {
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
          officeId,
          docstatusId,
          officeactive = null,
        ) => [
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              rankId,
              roleId,
              positionId,
              docstatusId,
              description,
              departmentId,
              divisionId,
              officeId,
              officeactive,
            },
          }),
          prisma.docinTracking.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              receiverCode,
              docstatusId,
              description,
              officeactive,
            },
          }),
        ];

        for (const user of users) {
          logTransactions.push(
            ...createLogs(
              user.username,
              user.rankId ?? null,
              user.roleId ?? null,
              user.employee?.posId ?? null,
              user.employee?.departmentId ?? null,
              user.employee?.divisionId ?? null,
              user.employee?.officeId ?? null,
              Number(docstatusId),
              (officeactive = null),
            ),
          );
        }

        const allOffices = [
          ...(Array.isArray(officeId1) && officeId1.length
            ? officeId1.map((id) => ({
                id: Number(id),
                officeactive: 1,
              }))
            : []),
          ...(Array.isArray(officeId2) && officeId2.length
            ? officeId2.map((id) => ({
                id: Number(id),
                officeactive: 2,
              }))
            : []),
        ];

        if (!allOffices.length) {
          return res
            .status(400)
            .json({ message: "At least one officeId is required." });
        }

        for (const { id: officeId, officeactive } of allOffices) {
          const office = await prisma.office.findUnique({
            where: { id: officeId },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 8,
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

          const officeWithUser = {
            ...office,
            employees: office?.employees?.length
              ? office.employees.map((employee) => ({
                  ...employee,
                  user: employee.user[0] || null,
                }))
              : [],
          };

          if (!officeWithUser || !officeWithUser.employees.length) {
            return res.status(404).json({
              message: `office ${officeId} or employees not found`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = officeWithUser.employees.find(
              (u) => u.user?.rankId === rankId && u.user?.roleId === 8,
            );
            if (depUser) break;
          }

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in office ${officeId} with specified rank and role`,
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
              depUser.officeId ?? null,
              2,
              officeactive,
            ),
          );
        }
      }

      // อัปเดตสถานะของ docinternal
      const updateDocInternal = prisma.docInternal.update({
        where: {
          id: Number(docinId),
        },
        data: {
          assignto: 1,
        },
      });

      const transactions = [updateDocInternal, ...logTransactions];

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
