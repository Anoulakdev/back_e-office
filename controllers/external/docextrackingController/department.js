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
    if (err) {
      const errorMsg =
        err instanceof multer.MulterError ? "Multer error" : "Unknown error";
      return res.status(500).json({ message: errorMsg, error: err.message });
    }

    try {
      const {
        docexId,
        receiverCode,
        divisionId1 = [],
        divisionId2 = [],
        docstatusId,
        description,
        dateline,
      } = req.body;
      if (!docexId)
        return res.status(400).json({ message: "docexId is required" });

      let logTransactions = [];
      const existingTracking = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
      });

      const docex = await prisma.docExternal.findUnique({
        where: {
          id: Number(docexId),
        },
      });

      if (!receiverCode && !divisionId1.length && !divisionId2.length) {
        const existingLog = await prisma.docexLog.findFirst({
          where: { docexId: Number(docexId), receiverCode: req.user.emp_code },
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
          logTransactions.push(
            prisma.docexLog.deleteMany({
              where: {
                AND: [
                  { id: { not: existingLog.id } },
                  { docexId: Number(docexId) },
                  { departmentId: req.user.departmentId },
                ],
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );
        }
      } else if (receiverCode) {
        const user = await prisma.user.findUnique({
          where: { emp_code: receiverCode },
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        const datelineValue = dateline
          ? new Date(dateline)
          : existingTracking?.dateline
          ? new Date(existingTracking.dateline)
          : null;

        let docexlogfileData = {
          docexlog_file: null,
          docexlog_type: null,
          docexlog_size: null,
        };

        if (req.file) {
          docexlogfileData = {
            docexlog_file: req.file.filename,
            docexlog_type: req.file.mimetype,
            docexlog_size: req.file.size,
          };
        } else if (Number(docstatusId) === 6) {
          if (existingTracking) {
            if (existingTracking.docstatusId === 5) {
              docexlogfileData = {
                docexlog_file: null,
                docexlog_type: null,
                docexlog_size: null,
              };
            } else if (existingTracking.docstatusId === 6) {
              docexlogfileData = {
                docexlog_file: existingTracking.docexlog_file ?? null,
                docexlog_type: existingTracking.docexlog_type ?? null,
                docexlog_size: existingTracking.docexlog_size ?? null,
              };
            }
          }
        } else if (Number(docstatusId) === 7) {
          docexlogfileData = {
            docexlog_file: existingTracking?.docexlog_file ?? null,
            docexlog_type: existingTracking?.docexlog_type ?? null,
            docexlog_size: existingTracking?.docexlog_size ?? null,
          };
        }

        logTransactions.push(
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: user.rankId ?? null,
              roleId: user.roleId ?? null,
              positionId: user.posId ?? null,
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description: description ?? null,
              extype: Number(docex.extype) ?? null,
              departmentId: user.departmentId ?? null,
              divisionId: user.divisionId ?? null,
              departmentactive: existingTracking?.departmentactive ?? null,
              ...docexlogfileData,
            },
          })
        );
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.emp_code,
                receiverCode: user.emp_code,
                docstatusId: Number(docstatusId),
                extype: Number(docex.extype) ?? null,
                dateline: datelineValue,
                description: description ?? null,
                ...docexlogfileData,
              },
            })
          );
        }
      } else {
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

        if (!allDivisions.length)
          return res
            .status(400)
            .json({ message: "At least one divisionId is required" });

        for (const { id: divisionId, divisionactive } of allDivisions) {
          const division = await prisma.division.findUnique({
            where: { id: divisionId },
            include: { users: true },
          });
          if (!division || !division.users.length)
            return res
              .status(404)
              .json({ message: `Division ${divisionId} not found` });

          const depUser = division.users.find(
            (u) => u.rankId === 1 && u.roleId === 7
          );
          if (!depUser)
            return res
              .status(404)
              .json({ message: `No matching user in division ${divisionId}` });

          const datelineValue = dateline
            ? new Date(dateline)
            : existingTracking?.dateline
            ? new Date(existingTracking.dateline)
            : null;
          logTransactions.push(
            prisma.docexLog.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                rankId: depUser.rankId ?? null,
                roleId: depUser.roleId ?? null,
                positionId: depUser.posId ?? null,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentId: depUser.departmentId ?? null,
                departmentactive: existingTracking?.departmentactive ?? null,
                divisionId,
                divisionactive,
                docexlog_file: req.file?.filename ?? null,
                docexlog_type: req.file?.mimetype ?? null,
                docexlog_size: req.file?.size ?? null,
              },
            })
          );
          logTransactions.push(
            prisma.docexTracking.create({
              data: {
                docexId: Number(docexId),
                assignerCode: req.user.emp_code,
                receiverCode: depUser.emp_code,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                extype: Number(docex.extype) ?? null,
                departmentactive: existingTracking?.departmentactive ?? null,
                description: description ?? null,
                docexlog_file: req.file?.filename ?? null,
                docexlog_type: req.file?.mimetype ?? null,
                docexlog_size: req.file?.size ?? null,
              },
            })
          );
        }
        if (existingTracking) {
          logTransactions.push(
            prisma.docexTracking.delete({ where: { id: existingTracking.id } })
          );
        }
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
