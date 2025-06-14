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
      const { docdtId, receiverCode, docstatusId, description, dateline } =
        req.body;

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
              departmentactive: existingTracking?.departmentactive ?? null,
              divisionactive: existingTracking?.divisionactive ?? null,
              officeactive: existingTracking?.officeactive ?? null,
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

        const results = await prisma.$transaction(logTransactions);

        res.status(201).json({
          message: "Document assigned successfully",
          data: results,
        });
      } else {
        if (existingTracking) {
          logTransactions.push(
            prisma.docdtLog.create({
              data: {
                docdtId: Number(docdtId),
                assignerCode: req.user.username,
                docstatusId: Number(docstatusId),
                description: description ?? null,
                viewed: true,
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

          logTransactions.push(
            prisma.docdtTracking.delete({ where: { id: existingTracking.id } })
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
