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
        divisionId,
        officeId,
        unitId,
        priorityId,
        docstatusId,
        dateline,
        description,
        active,
      } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      let user = null;

      if (divisionId && !isNaN(Number(divisionId))) {
        const division = await prisma.division.findUnique({
          where: { id: Number(divisionId) },
          include: { users: true },
        });

        if (!division || !division.users.length) {
          return res
            .status(404)
            .json({ message: "division or users not found" });
        }

        user = division.users.find((u) => u.rankId === 1 && u.roleId === 7);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }
      } else if (officeId && !isNaN(Number(officeId))) {
        const office = await prisma.office.findUnique({
          where: { id: Number(officeId) },
          include: { users: true },
        });

        if (!office || !office.users.length) {
          return res.status(404).json({ message: "office or users not found" });
        }

        user = office.users.find((u) => u.rankId === 1 && u.roleId === 8);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }
      } else if (unitId && !isNaN(Number(unitId))) {
        const unit = await prisma.unit.findUnique({
          where: { id: Number(unitId) },
          include: { users: true },
        });

        if (!unit || !unit.users.length) {
          return res.status(404).json({ message: "unit or users not found" });
        }

        user = unit.users.find((u) => u.rankId === 1 && u.roleId === 9);

        if (!user) {
          return res.status(404).json({
            message:
              "No matching user found with specified rank, role, and position",
          });
        }
      } else if (receiverCode) {
        user = await prisma.user.findUnique({
          where: { emp_code: receiverCode },
        });

        if (!user) {
          return res
            .status(404)
            .json({ message: "User not found with the provided receiverCode" });
        }
      } else {
        return res.status(400).json({
          message: "Either departmentId or receiverCode is required",
        });
      }

      const datel = await prisma.docexTracking.findFirst({
        where: { docexId: Number(docexId) },
      });

      const datelineValue = dateline
        ? new Date(dateline)
        : datel?.dateline
        ? new Date(datel.dateline)
        : null;

      const updateData = {};
      if (priorityId) {
        updateData.priorityId = Number(priorityId);
      }

      const [docexternals, docexlogs, existingTracking] =
        await prisma.$transaction([
          prisma.docExternal.update({
            where: {
              id: Number(docexId),
            },
            data: updateData,
          }),
          prisma.docexLog.create({
            data: {
              docexId: Number(docexId),
              assignerCode: req.user.emp_code,
              receiverCode: user.emp_code,
              rankId: user.rankId,
              roleId: user.roleId,
              positionId: user.posId,
              departmentId: user.departmentId,
              divisionId: user.divisionId,
              officeId: user.officeId,
              unitId: user.unitId,
              docstatusId: Number(docstatusId),
              dateline: datelineValue,
              description,
              active,
              docexlog_file: req.file ? req.file.filename : null,
              docexlog_type: req.file ? req.file.mimetype : null,
              docexlog_size: req.file ? req.file.size : null,
            },
          }),
          prisma.docexTracking.findFirst({
            where: {
              docexId: Number(docexId),
              receiverCode: req.user.emp_code,
            },
          }),
        ]);

      const docextrackings = await prisma.docexTracking.update({
        where: {
          id: existingTracking.id,
        },
        data: {
          assignerCode: req.user.emp_code,
          receiverCode: user.emp_code,
          docstatusId: Number(docstatusId),
          dateline: datelineValue,
          description,
          active,
          docexlog_file: req.file ? req.file.filename : null,
          docexlog_type: req.file ? req.file.mimetype : null,
          docexlog_size: req.file ? req.file.size : null,
        },
      });

      res.status(201).json({
        message: "Document created successfully",
        data: { docexternals, docexlogs, docextrackings },
      });
    } catch (error) {
      console.error("Error creating document :", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
