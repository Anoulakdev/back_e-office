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
      const { docexId, receiverCode, docstatusId, description, dateline } =
        req.body;

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

      if (receiverCode) {
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
            docexlog_original: Buffer.from(
              req.file.originalname,
              "latin1"
            ).toString("utf8"),
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
              departmentactive: existingTracking?.departmentactive ?? null,
              divisionactive: existingTracking?.divisionactive ?? null,
              officeactive: existingTracking?.officeactive ?? null,
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
                viewed: false,
                extype: Number(docex.extype) ?? null,
                ...docexlogfileData,
              },
            })
          );
        }

        const results = await prisma.$transaction(logTransactions);

        res.status(201).json({
          message: "Document assigned successfully",
          data: results,
        });
      } else {
        if (existingTracking) {
          const existingLog = await prisma.docexLog.findFirst({
            where: {
              docexId: Number(docexId),
              receiverCode: req.user.username,
            },
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

          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );

          const results = await prisma.$transaction(logTransactions);
          return res.status(201).json({
            message: "updated docstatus success",
            data: results,
          });
        }
      }
    } catch (error) {
      console.error("Error assigning document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
