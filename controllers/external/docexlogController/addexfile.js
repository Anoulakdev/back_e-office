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
      const { docexId, description } = req.body;

      if (!docexId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newDocExternal = await prisma.docexLog.create({
        data: {
          docexId: Number(docexId),
          description: description,
          docstatusId: 13,
          assignerCode: req.user.username,
          docexlog_original: req.file
            ? Buffer.from(req.file.originalname, "latin1").toString("utf8")
            : null,
          docexlog_file: req.file ? req.file.filename : null,
          docexlog_type: req.file ? req.file.mimetype : null,
          docexlog_size: req.file ? req.file.size : null,
        },
      });

      res.status(201).json({
        message: "Document created successfully",
        data: newDocExternal,
      });
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
