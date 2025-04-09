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
  try {
    const { docexternalId } = req.params;

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexternalId),
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ลบไฟล์ของ docExternal
    if (docex.docex_file) {
      const filedocPath = path.join(
        __dirname,
        "../../../uploads/document",
        docex.docex_file
      );
      if (fs.existsSync(filedocPath)) {
        fs.unlinkSync(filedocPath);
      }
    }

    // ค้นหา logs ที่เกี่ยวข้อง
    const docexLogs = await prisma.docexLog.findMany({
      where: { docexId: Number(docexternalId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้เกิด error ถ้าไฟล์ถูกลบไปแล้ว
    const deletedFiles = new Set(); // ใช้ Set เพื่อตรวจสอบชื่อไฟล์ที่เคยลบไปแล้ว
    for (const log of docexLogs) {
      if (log.docexlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../../uploads/documentlog",
          log.docexlog_file
        );

        if (
          !deletedFiles.has(log.docexlog_file) &&
          fs.existsSync(logFilePath)
        ) {
          fs.unlinkSync(logFilePath);
          deletedFiles.add(log.docexlog_file);
        }
      }
    }

    await prisma.docexLog.deleteMany({
      where: { docexId: Number(docexternalId) },
    });

    await prisma.docexTracking.deleteMany({
      where: { docexId: Number(docexternalId) },
    });

    await prisma.docExternal.delete({
      where: {
        id: Number(docexternalId),
      },
    });

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
