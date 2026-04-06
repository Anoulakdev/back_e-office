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

const upload = multer({ storage: storage }).single("docdtlog_file");

module.exports = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(500)
        .json({ message: "Multer error", error: err.message });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Unknown error", error: err.message });
    }
    try {
      const {
        docdtId,
        receiverCode,
        unitId,
        docstatusId,
        description,
        dateline,
      } = req.body;

      if (!docdtId) {
        return res.status(400).json({ message: "docdtId is required" });
      }

      let logTransactions = [];

      const existingTracking = await prisma.docdtTracking.findFirst({
        where: { docdtId: Number(docdtId), receiverCode: req.user.username },
      });

      const docdt = await prisma.docDirector.findUnique({
        where: {
          id: Number(docdtId),
        },
      });

      if (!receiverCode && !unitId) {
        logTransactions.push(
          prisma.docdtLog.create({
            data: {
              docdtId: Number(docdtId),
              assignerCode: req.user.username,
              docstatusId: Number(docstatusId),
              description: description ?? null,
              viewed: true,
              docdtlog_original: req.file
                ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
                : null,
              docdtlog_file: req.file ? req.file.filename : null,
              docdtlog_type: req.file ? req.file.mimetype : null,
              docdtlog_size: req.file ? req.file.size : null,
            },
          }),
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      } else if (receiverCode && !unitId) {
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

          let docdtlogfileData = {
            docdtlog_original: null,
            docdtlog_file: null,
            docdtlog_type: null,
            docdtlog_size: null,
          };

          if (req.file) {
            docdtlogfileData = {
              docdtlog_original: Buffer.from(
                req.file.originalname,
                "latin1",
              ).toString("utf8"),
              docdtlog_file: req.file.filename,
              docdtlog_type: req.file.mimetype,
              docdtlog_size: req.file.size,
            };
          } else if (Number(docstatusId) === 6) {
            if (existingTracking) {
              if (existingTracking.docstatusId === 5) {
                docdtlogfileData = {
                  docdtlog_original: null,
                  docdtlog_file: null,
                  docdtlog_type: null,
                  docdtlog_size: null,
                };
              } else if (existingTracking.docstatusId === 6) {
                docdtlogfileData = {
                  docdtlog_original: existingTracking.docdtlog_original ?? null,
                  docdtlog_file: existingTracking.docdtlog_file ?? null,
                  docdtlog_type: existingTracking.docdtlog_type ?? null,
                  docdtlog_size: existingTracking.docdtlog_size ?? null,
                };
              }
            }
          } else if (Number(docstatusId) === 7) {
            docdtlogfileData = {
              docdtlog_original: existingTracking.docdtlog_original ?? null,
              docdtlog_file: existingTracking?.docdtlog_file ?? null,
              docdtlog_type: existingTracking?.docdtlog_type ?? null,
              docdtlog_size: existingTracking?.docdtlog_size ?? null,
            };
          }

          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
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
                officeId: user.employee.officeId
                  ? Number(user.employee.officeId)
                  : null,
                unitId: user.employee.unitId
                  ? Number(user.employee.unitId)
                  : null,
                ...docdtlogfileData,
                departmentactive: Number(existingTracking.departmentactive),
                divisionactive: Number(existingTracking.divisionactive),
                officeactive: Number(existingTracking.officeactive),
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                ...docdtlogfileData,
                departmentactive: existingTracking.departmentactive,
                divisionactive: existingTracking.divisionactive,
                officeactive: existingTracking.officeactive,
              },
            }),
          );
        }

        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({
              where: { id: existingTracking.id },
            }),
          );
        }
      } else if (unitId && !receiverCode) {
        const allUnits = Array.isArray(unitId)
          ? unitId.map((id) => Number(id))
          : [Number(unitId)];

        if (!allUnits.length) {
          return res
            .status(400)
            .json({ message: "At least one unitId is required." });
        }
        for (const unitId of allUnits) {
          const unit = await prisma.unit.findUnique({
            where: { id: Number(unitId) },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 9,
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

          if (!unit) {
            return res.status(404).json({
              message: `unit ${unitId} not found`,
            });
          }

          // ✅ กรองเฉพาะ employee ที่มี user จริง
          const employeesWithUser = unit.employees
            .map((emp) => ({
              ...emp,
              user: emp.user[0] || null,
            }))
            .filter((emp) => emp.user !== null);

          // ❌ ถ้าไม่มี user เลย → block ทันที
          if (!employeesWithUser.length) {
            return res.status(400).json({
              message: `unit ${unitId} has no user with roleId = 9`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = employeesWithUser.find((u) => u.user?.rankId === rankId);
            if (depUser) break;
          }

          // ❌ ถ้ามี user แต่ rank ไม่ตรง
          if (!depUser) {
            return res.status(400).json({
              message: `unit ${unitId} has users but none match required rank`,
            });
          }

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
              ? new Date(existingTracking.dateline)
              : null;

          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
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
                officeId: depUser.officeId ? Number(depUser.officeId) : null,
                unitId: depUser.unitId ? Number(depUser.unitId) : null,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8",
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
                departmentactive: existingTracking?.departmentactive,
                divisionactive: existingTracking?.divisionactive,
                officeactive: existingTracking?.officeactive,
              },
            }),
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8",
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
                departmentactive: existingTracking?.departmentactive,
                divisionactive: existingTracking?.divisionactive,
                officeactive: existingTracking?.officeactive,
              },
            }),
          );
        }

        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({
              where: { id: existingTracking.id },
            }),
          );
        }
      } else if (receiverCode && unitId) {
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
              docdtlog_original: Buffer.from(
                req.file.originalname,
                "latin1",
              ).toString("utf8"),
              docdtlog_file: req.file.filename,
              docdtlog_type: req.file.mimetype,
              docdtlog_size: req.file.size,
            }
          : {};

        const createLogAndTrack = (
          receiverCode,
          rankId,
          roleId,
          posId,
          deptId,
          divId,
          officeId,
          docstatusId,
          departmentactive = null,
          divisionactive = null,
          officeactive = null,
        ) => {
          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
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
                officeId: officeId,
                ...fileData,
                departmentactive,
                divisionactive,
                officeactive,
              },
            }),
          );
          logTransactions.push(
            prisma.docdtTracking.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                receiverCode,
                docstatusId,
                dateline: datelineValue,
                description: description ?? null,
                ...fileData,
                departmentactive,
                divisionactive,
                officeactive,
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
            user.employee?.officeId ?? null,
            Number(docstatusId),
            existingTracking?.departmentactive,
            existingTracking?.divisionactive,
            existingTracking?.officeactive,
          );
        }

        const allUnits = Array.isArray(unitId)
          ? unitId.map((id) => Number(id))
          : [Number(unitId)];

        if (!allUnits.length) {
          return res
            .status(400)
            .json({ message: "At least one unitId is required." });
        }

        for (const unitId of allUnits) {
          const unit = await prisma.unit.findUnique({
            where: { id: Number(unitId) },
            include: {
              employees: {
                include: {
                  user: {
                    where: {
                      roleId: 9,
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

          if (!unit) {
            return res.status(404).json({
              message: `unit ${unitId} not found`,
            });
          }

          const employeesWithUser = unit.employees
            .map((emp) => ({
              ...emp,
              user: emp.user[0] || null,
            }))
            .filter((emp) => emp.user !== null);

          // ❌ ถ้าไม่มี user เลย → block ทันที
          if (!employeesWithUser.length) {
            return res.status(400).json({
              message: `unit ${unitId} has no user with roleId = 9`,
            });
          }

          let depUser = null;
          const rankPriority = [1, 2, 3, 4, 5, 6, 7]; // ปรับลำดับความสำคัญตามต้องการ

          for (const rankId of rankPriority) {
            depUser = employeesWithUser.find((u) => u.user?.rankId === rankId);
            if (depUser) break;
          }

          // ❌ ถ้ามี user แต่ rank ไม่ตรง
          if (!depUser) {
            return res.status(400).json({
              message: `unit ${unitId} has users but none match required rank`,
            });
          }

          createLogAndTrack(
            depUser.emp_code,
            depUser.user?.rankId ?? null,
            depUser.user?.roleId ?? null,
            depUser.posId ?? null,
            depUser.departmentId ?? null,
            depUser.divisionId ?? null,
            depUser.officeId ?? null,
            Number(docstatusId),
            existingTracking?.departmentactive,
            existingTracking?.divisionactive,
            existingTracking?.officeactive,
          );
        }

        // ลบ tracking เก่า (ถ้ามี)
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({ where: { id: existingTracking.id } }),
          );
        }
      }

      const results = await prisma.$transaction(logTransactions);

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
