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
        officeId1 = [],
        officeId2 = [],
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

      if (!receiverCode && !unitId && !officeId1.length && !officeId2.length) {
        const existingLog = await prisma.docdtLog.findFirst({
          where: { docdtId: Number(docdtId), receiverCode: req.user.username },
          orderBy: { id: "desc" },
          take: 1,
        });

        if (existingLog) {
          logTransactions.push(
            prisma.docdtLog.update({
              where: { id: existingLog.id },
              data: { docstatusId: Number(docstatusId), description },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
        const user = await prisma.user.findUnique({
          where: { username: receiverCode },
          include: {
            employee: true,
          },
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
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
              "latin1"
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
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              ...docdtlogfileData,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                ...docdtlogfileData,
              },
            })
          );
        }
      } else if (unitId) {
        // 🔹 ถ้ามี receiverCode ใช้ข้อมูลนี้เท่านั้น
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

        const unitWithUser = {
          ...unit,
          employees: unit?.employees?.length
            ? unit.employees.map((employee) => ({
                ...employee,
                user: employee.user[0] || null,
              }))
            : [],
        };

        if (!unitWithUser || !unitWithUser.employees.length) {
          return res.status(404).json({
            message: `unit ${unitId} or employees not found`,
          });
        }

        const depUser = unitWithUser.employees.find(
          (u) => u.user?.rankId === 1 && u.user?.roleId === 9
        );

        if (!depUser) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
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
              unitId: depUser.unitId ? Number(depUser.unitId) : null,
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              docdtlog_original: req.file
                ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
                : null,
              docdtlog_file: req.file ? req.file.filename : null,
              docdtlog_type: req.file ? req.file.mimetype : null,
              docdtlog_size: req.file ? req.file.size : null,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }
      } else {
        const allOffices = [
          ...(Array.isArray(officeId1) && officeId1.length
            ? officeId1.map((id) => ({ id: Number(id), officeactive: 1 }))
            : []),
          ...(Array.isArray(officeId2) && officeId2.length
            ? officeId2.map((id) => ({ id: Number(id), officeactive: 2 }))
            : []),
        ];

        if (!allOffices.length) {
          return res
            .status(400)
            .json({ message: "At least one divisionId is required" });
        }

        // 🔹 วนลูปเพื่อเพิ่มข้อมูลก่อน
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

          const depUser = officeWithUser.employees.find(
            (u) => u.user?.rankId === 1 && u.user?.roleId === 8
          );

          if (!depUser) {
            return res.status(404).json({
              message: `No matching user found in office ${officeId} with specified rank and role`,
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
                departmentactive: Number(existingTracking.departmentactive),
                divisionId: depUser.divisionId
                  ? Number(depUser.divisionId)
                  : null,
                divisionactive: Number(existingTracking.divisionactive),
                officeId,
                officeactive,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
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
                departmentactive: Number(existingTracking.departmentactive),
                divisionactive: Number(existingTracking.divisionactive),
                officeactive,
                docdtlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docdtlog_file: req.file ? req.file.filename : null,
                docdtlog_type: req.file ? req.file.mimetype : null,
                docdtlog_size: req.file ? req.file.size : null,
              },
            })
          );
        }

        // 🔹 ลบ existingTracking **หลังจากเพิ่มข้อมูลเสร็จ**
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtTracking.delete({
              where: { id: existingTracking.id },
            })
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
