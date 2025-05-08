const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/document");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docex_file");

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
        docex_no,
        docex_date,
        docex_title,
        docex_description,
        outsiderId,
        priorityId,
        doctypeId,
        extype,
      } = req.body;

      if (!docex_no) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newDocExternal = await prisma.docExternal.create({
        data: {
          docex_no,
          docex_date: new Date(docex_date),
          docex_title,
          docex_description,
          outsiderId: Number(outsiderId),
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          extype: Number(extype),
          creatorCode: req.user.username,
          docex_fileoriginal: req.file ? req.file.originalname : null,
          docex_file: req.file ? req.file.filename : null,
          docex_filetype: req.file ? req.file.mimetype : null,
          docex_filesize: req.file ? req.file.size : null,
        },
        include: {
          priority: true,
          doctype: true,
          outsider: true,
          creator: {
            select: {
              username: true,
            },
          },
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
