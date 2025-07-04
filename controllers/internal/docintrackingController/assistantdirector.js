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
      const { docinId, receiverCode, docstatusId, description, dateline } =
        req.body;

      if (!docinId) {
        return res.status(400).json({ message: "docinId is required" });
      }

      let logTransactions = [];

      const existingTracking = await prisma.docinTracking.findFirst({
        where: { docinId: Number(docinId), receiverCode: req.user.username },
      });

      const docin = await prisma.docInternal.findUnique({
        where: {
          id: Number(docinId),
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
          return res.status(404).json({ message: "User not found" });
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
              "latin1"
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
              officeId: user.employee.officeId
                ? Number(user.employee.officeId)
                : null,
              unitId: user.employee.unitId
                ? Number(user.employee.unitId)
                : null,
              ...docinlogfileData,
            },
          })
        );

        if (existingTracking) {
          logTransactions.push(
            prisma.docinTracking.update({
              where: { id: existingTracking.id },
              data: {
                assignerCode: req.user.username,
                receiverCode: user.username,
                docstatusId: Number(docstatusId),
                dateline: datelineValue,
                description: description ?? null,
                viewed: false,
                ...docinlogfileData,
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
            prisma.docinLog.create({
              data: {
                docinId: Number(docinId),
                assignerCode: req.user.username,
                docstatusId: Number(docstatusId),
                description: description ?? null,
                viewed: true,
                docinlog_original: req.file
                  ? Buffer.from(req.file.originalname, "latin1").toString(
                      "utf8"
                    )
                  : null,
                docinlog_file: req.file ? req.file.filename : null,
                docinlog_type: req.file ? req.file.mimetype : null,
                docinlog_size: req.file ? req.file.size : null,
              },
            })
          );

          logTransactions.push(
            prisma.docinTracking.delete({
              where: { id: existingTracking.id },
            })
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
