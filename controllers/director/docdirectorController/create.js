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

const upload = multer({ storage: storage }).single("docdt_file");

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
        docdt_no,
        docdt_date,
        docdt_title,
        docdt_description,
        priorityId,
        doctypeId,
      } = req.body;

      if (!docdt_no) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newDirector = await prisma.docDirector.create({
        data: {
          docdt_no,
          docdt_date: new Date(docdt_date),
          docdt_title,
          docdt_description,
          priorityId: Number(priorityId),
          doctypeId: Number(doctypeId),
          creatorCode: req.user.username,
          docdt_fileoriginal: req.file
            ? Buffer.from(req.file.originalname).toString("utf8")
            : null,
          docdt_file: req.file ? req.file.filename : null,
          docdt_filetype: req.file ? req.file.mimetype : null,
          docdt_filesize: req.file ? req.file.size : null,
        },
        include: {
          priority: true,
          doctype: true,
          creator: {
            select: {
              username: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Document created successfully",
        data: newDirector,
      });
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};
