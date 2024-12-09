const fs = require("fs");
const prisma = require("../prisma/prisma");
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

const upload = multer({ storage: storage }).single("fileDoc");

exports.listhead = async (req, res) => {
  try {
    const headdepartment = await prisma.docexDepartment.findMany({
      where: {
        departmentId: req.user.departmentId,
        positionId: req.user.positionId,
        levelId: req.user.levelId,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        docexternal: true,
        // department: true,
        // position: true,
        // level: true,
        DocexDetail: true,
      },
    });

    res.json(headdepartment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.create = (req, res) => {
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
        timeline,
        accept,
        description,
        statusDoc,
      } = req.body;

      if (!docexId || !receiverCode) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newDocExternal = await prisma.docexDetail.create({
        data: {
          docexId: Number(docexId),
          assignerCode: req.user.code,
          receiverCode,
          timeline: Number(timeline),
          accept: Number(accept),
          description,
          statusDoc: Number(statusDoc),
          fileDoc: req.file ? req.file.filename : null,
        },
      });

      res.status(201).json({
        message: "Document detail created successfully",
        data: newDocExternal,
      });
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
};

exports.listemployee = async (req, res) => {
  try {
    const employee = await prisma.docexDetail.findMany({
      where: {
        receiverCode: req.user.code,
      },
      orderBy: {
        id: "desc",
      },
      include: {
        docex: {
          select: {
            docexternal: true,
          },
        },
        assigner: {
          select: {
            firstname: true,
            lastname: true,
            code: true,
            position: true,
          },
        },
      },
    });

    res.json(employee);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
