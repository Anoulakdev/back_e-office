const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/documentlog");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docinlog_file");

module.exports = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      const errorMsg =
        err instanceof multer.MulterError ? "Multer error" : "Unknown error";
      return res.status(500).json({ message: errorMsg, error: err.message });
    }

    try {
      const {
        docinId,
        receiverCode,
        departmentId1 = [],
        departmentId2 = [],
        divisionId1 = [],
        divisionId2 = [],
        docstatusId,
        description,
        dateline,
      } = req.body;

      if (!docinId)
        return res.status(400).json({ message: "docinId is required" });

      let logTransactions = [];

      const existingTracking = await prisma.docinTracking.findFirst({
        where: { docinId: Number(docinId), receiverCode: req.user.username },
      });

      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinId),
        },
      });

      if (
        !receiverCode &&
        !departmentId1.length &&
        !departmentId2.length &&
        !divisionId1.length &&
        !divisionId2.length
      ) {
        if (Number(docstatusId) === 4) {
          logTransactions.push(
            prisma.docinLog.deleteMany({
              where: {
                AND: [
                  { docinId: Number(docinId) },
                  { departmentId: req.user.employee.departmentId },
                ],
              },
            }),
          );
        }

        logTransactions.push(
          prisma.docinLog.create({
            data: {
              docinId: Number(docinId),
              assignerCode: req.user.username,
              docstatusId: Number(docstatusId),
              description: description ?? null,
              viewed: true,
              docinlog_original: req.file
                ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
                : null,
              docinlog_file: req.file ? req.file.filename : null,
              docinlog_type: req.file ? req.file.mimetype : null,
              docinlog_size: req.file ? req.file.size : null,
            },
          }),
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      } else if (
        receiverCode &&
        !departmentId1.length &&
        !departmentId2.length &&
        !divisionId1.length &&
        !divisionId2.length
      ) {
        for (const receiverC of receiverCode) {
          const user = await prisma.user.findUnique({
            where: { username: receiverC },
            include: {
              employee: true,
            },
          });

          if (!user) {
            return res.status(404).json({
              message: `User not found: ${receiverC}`,
            });
          }

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
              ? new Date(existingTracking.dateline)
              : null;

          let docinlogfileData = {
            docinlog_original: null,
            docinlog_file: null,
            docinlog_type: null,
            docinlog_size: null,
          };

          if (req.file) {
            docinlogfileData = {
              docinlog_original: Buffer.from(
                req.file.originalname,
                "latin1",
              ).toString("utf8"),
              docinlog_file: req.file.filename,
              docinlog_type: req.file.mimetype,
              docinlog_size: req.file.size,
            };
          } else if (Number(docstatusId) === 6) {
            if (existingTracking) {
              if (existingTracking.docstatusId === 5) {
                docinlogfileData = {
                  docinlog_original: null,
                  docinlog_file: null,
                  docinlog_type: null,
                  docinlog_size: null,
                };
              } else if (existingTracking.docstatusId === 6) {
                docinlogfileData = {
                  docinlog_original: existingTracking.docinlog_original ?? null,
                  docinlog_file: existingTracking.docinlog_file ?? null,
                  docinlog_type: existingTracking.docinlog_type ?? null,
                  docinlog_size: existingTracking.docinlog_size ?? null,
                };
              }
            }
          } else if (Number(docstatusId) === 7) {
            docinlogfileData = {
              docinlog_original: existingTracking?.docinlog_original ?? null,
              docinlog_file: existingTracking?.docinlog_file ?? null,
              docinlog_type: existingTracking?.docinlog_type ?? null,
              docinlog_size: existingTracking?.docinlog_size ?? null,
            };
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
                dateline: datelineValue,
                description: description ?? null,
                departmentId: user.employee.departmentId
                  ? Number(user.employee.departmentId)
                  : null,
                divisionId: user.employee.divisionId
                  ? Number(user.employee.divisionId)
                  : null,
                ...docinlogfileData,
                departmentactive: existingTracking?.departmentactive,
                divisionactive: existingTracking?.divisionactive,
              },
            }),
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                ...docinlogfileData,
                departmentactive: existingTracking.departmentactive,
                divisionactive: existingTracking.divisionactive,
              },
            }),
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({
              where: { id: existingTracking.id },
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

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
              ? new Date(existingTracking.dateline)
              : null;

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: depUser.user?.rankId
                  ? Number(depUser.user?.rankId)
                  : null,
                roleId: depUser.user?.roleId
                  ? Number(depUser.user?.roleId)
                  : null,
                positionId: depUser.posId ? Number(depUser.posId) : null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentId: depUser.departmentId
                  ? Number(depUser.departmentId)
                  : null,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8",
                    )
                  : null,
                docinlog_file: req.file?.filename ?? null,
                docinlog_type: req.file?.mimetype ?? null,
                docinlog_size: req.file?.size ?? null,
                departmentactive: existingTracking?.departmentactive,
                divisionactive,
              },
            }),
          );
          logTransactions.push(
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8",
                    )
                  : null,
                docinlog_file: req.file?.filename ?? null,
                docinlog_type: req.file?.mimetype ?? null,
                docinlog_size: req.file?.size ?? null,
                departmentactive: existingTracking?.departmentactive,
                divisionactive,
              },
            }),
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      } else if (
        (departmentId1.length || departmentId2.length) &&
        !receiverCode &&
        !divisionId1.length &&
        !divisionId2.length
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

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
              ? new Date(existingTracking.dateline)
              : null;

          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                rankId: depUser.user?.rankId
                  ? Number(depUser.user?.rankId)
                  : null,
                roleId: depUser.user?.roleId
                  ? Number(depUser.user?.roleId)
                  : null,
                positionId: depUser.posId ? Number(depUser.posId) : null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                departmentId: depUser.departmentId
                  ? Number(depUser.departmentId)
                  : null,
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8",
                    )
                  : null,
                docinlog_file: req.file?.filename ?? null,
                docinlog_type: req.file?.mimetype ?? null,
                docinlog_size: req.file?.size ?? null,
                departmentactive,
              },
            }),
          );
          logTransactions.push(
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8",
                    )
                  : null,
                docinlog_file: req.file?.filename ?? null,
                docinlog_type: req.file?.mimetype ?? null,
                docinlog_size: req.file?.size ?? null,
                departmentactive,
              },
            }),
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } }),
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

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

        const fileData = req.file
          ? {
              docinlog_original: Buffer.from(
                req.file.originalname,
                "latin1",
              ).toString("utf8"),
              docinlog_file: req.file.filename,
              docinlog_type: req.file.mimetype,
              docinlog_size: req.file.size,
            }
          : {};

        const createLogAndTrack = (
          receiverCode,
          rankId,
          roleId,
          posId,
          deptId,
          divId,
          docstatusId,
          departmentactive = null,
        ) => {
          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode,
                rankId,
                roleId,
                positionId: posId,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                departmentId: deptId,
                divisionId: divId,
                ...fileData,
                departmentactive,
              },
            }),
          );
          logTransactions.push(
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                ...fileData,
                departmentactive,
              },
            }),
          );
        };

        // บันทึกของผู้รับโดยตรง
        for (const user of users) {
          createLogAndTrack(
            user.username,
            user.rankId ?? null,
            user.roleId ?? null,
            user.employee?.posId ?? null,
            user.employee?.departmentId ?? null,
            user.employee?.divisionId ?? null,
            Number(docstatusId),
            existingTracking?.departmentactive,
          );
        }

        // บันทึกของแผนก
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

        if (!allDepartments.length)
          return res
            .status(400)
            .json({ message: "At least one departmentId is required." });

        for (const { id: departmentId, departmentactive } of allDepartments) {
          const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
              employees: {
                include: {
                  user: {
                    where: { roleId: 6 },
                    select: { rankId: true, roleId: true },
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

          if (!depUser)
            return res.status(404).json({
              message: `No matching user found in department ${departmentId} with specified rank and role`,
            });

          createLogAndTrack(
            depUser.emp_code,
            depUser.user?.rankId ?? null,
            depUser.user?.roleId ?? null,
            depUser.posId ?? null,
            depUser.departmentId ?? null,
            depUser.divisionId ?? null,
            Number(docstatusId),
            departmentactive,
          );
        }

        // ลบ tracking เก่า (ถ้ามี)
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } }),
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

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;

        const fileData = req.file
          ? {
              docinlog_original: Buffer.from(
                req.file.originalname,
                "latin1",
              ).toString("utf8"),
              docinlog_file: req.file.filename,
              docinlog_type: req.file.mimetype,
              docinlog_size: req.file.size,
            }
          : {};

        const createLogAndTrack = (
          receiverCode,
          rankId,
          roleId,
          posId,
          deptId,
          divId,
          docstatusId,
          departmentactive = null,
          divisionactive = null,
        ) => {
          logTransactions.push(
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode,
                rankId,
                roleId,
                positionId: posId,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                departmentId: deptId,
                divisionId: divId,
                ...fileData,
                departmentactive,
                divisionactive,
              },
            }),
          );
          logTransactions.push(
            prisma.docinTracking.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                receiverCode,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                ...fileData,
                departmentactive,
                divisionactive,
              },
            }),
          );
        };

        // บันทึกของผู้รับโดยตรง
        for (const user of users) {
          createLogAndTrack(
            user.username,
            user.rankId ?? null,
            user.roleId ?? null,
            user.employee?.posId ?? null,
            user.employee?.departmentId ?? null,
            user.employee?.divisionId ?? null,
            Number(docstatusId),
            existingTracking?.departmentactive,
            existingTracking?.divisionactive,
          );
        }

        // บันทึกของแผนก
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
                    where: { roleId: 7 },
                    select: { rankId: true, roleId: true },
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
              message: `ພະແນກ ${divisionId} ຫຼື ຜູ້ຊີ້ນຳບໍ່ພົບ`,
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

          if (!depUser)
            return res.status(404).json({
              message: `ບໍ່ພົບຜູ້ໃຊ້ໃນພະແນກ ${divisionId} ກັບຕໍ່ລຳດັບແລະສິດທີ່ກໍານົດ`,
            });

          createLogAndTrack(
            depUser.emp_code,
            depUser.user?.rankId ?? null,
            depUser.user?.roleId ?? null,
            depUser.posId ?? null,
            depUser.departmentId ?? null,
            depUser.divisionId ?? null,
            Number(docstatusId),
            existingTracking?.departmentactive,
            divisionactive,
          );
        }

        // ลบ tracking เก่า (ถ้ามี)
        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      } else {
        return res.status(400).json({
          message: "ຂໍ້ມູນມີການຜິດພາດ",
          error: "Invalid payload: no matching assignment condition found",
        });
      }

      const results = await prisma.$transaction(logTransactions);
      res
        .status(201)
        .json({ message: "Document assigned successfully", data: results });
    } catch (error) {
      console.error("Error assigning document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
