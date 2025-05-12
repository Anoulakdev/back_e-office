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

const upload = multer({ storage: storage }).single("docexlog_file");

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
        docexId,
        receiverCode,
        unitId,
        docstatusId,
        description,
        dateline,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "docexId is required" });
      }

      let logTransactions = [];

      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.username },
      });

      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (!receiverCode && !unitId) {
        const existingLog = await prisma.docexLog.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.username },
          orderBy: { id: "desc" },
          take: 1,
        });

        if (existingLog) {
          logTransactions.push(
            prisma.docexLog.update({
              where: { id: existingLog.id },
              data: { docstatusId: Number(docstatusId), description },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
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
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
        }

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        let docexlogfileData = {
          docexlog_original: null,
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_original: Buffer.from(req.file.originalname).toString(
              "utf8"
            ),
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_original: null,
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_original: existingTracking.docexlog_original ?? null,
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_original: existingTracking?.docexlog_original ?? null,
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
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
              extype: Number(docex.extype) ?? null,
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
              officeactive: Number(existingTracking.officeactive),
              ...docexlogfileData,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
      } else {
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
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
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
              extype: Number(docex.extype) ?? null,
              departmentId: depUser.departmentId
                ? Number(depUser.departmentId)
                : null,
              divisionId: depUser.divisionId
                ? Number(depUser.divisionId)
                : null,
              officeId: depUser.officeId ? Number(depUser.officeId) : null,
              unitId: depUser.unitId ? Number(depUser.unitId) : null,
              departmentactive: Number(existingTracking.departmentactive),
              divisionactive: Number(existingTracking.divisionactive),
              officeactive: Number(existingTracking.officeactive),
              docexlog_original: req.file
                ? Buffer.from(req.file.originalname).toString("utf8")
                : null,
              docexlog_file: req.file ? req.file.filename : null,
              docexlog_type: req.file ? req.file.mimetype : null,
              docexlog_size: req.file ? req.file.size : null,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                docexlog_original: req.file
                  ? Buffer.from(req.file.originalname).toString("utf8")
                  : null,
                docexlog_file: req.file ? req.file.filename : null,
                docexlog_type: req.file ? req.file.mimetype : null,
                docexlog_size: req.file ? req.file.size : null,
              },
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
