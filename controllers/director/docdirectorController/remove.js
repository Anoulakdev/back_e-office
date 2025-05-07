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
  try {
    const { docdirectorId } = req.params;

    const docdt = await prisma.docDirector.findUnique({
      where: {
        id: Number(docdirectorId),
      },
    });

    if (!docdt) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ลบไฟล์ของ docDirector
    if (docdt.docdt_file) {
      const filedocPath = path.join(
        __dirname,
        "../../../uploads/document",
        docdt.docdt_file
      );
      if (fs.existsSync(filedocPath)) {
        fs.unlinkSync(filedocPath);
      }
    }

    // ค้นหา logs ที่เกี่ยวข้อง
    const docdtLogs = await prisma.docdtLog.findMany({
      where: { docdtId: Number(docdirectorId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้เกิด error ถ้าไฟล์ถูกลบไปแล้ว
    const deletedFiles = new Set(); // ใช้ Set เพื่อตรวจสอบชื่อไฟล์ที่เคยลบไปแล้ว
    for (const log of docdtLogs) {
      if (log.docdtlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../../uploads/documentlog",
          log.docdtlog_file
        );

        if (
          !deletedFiles.has(log.docdtlog_file) &&
          fs.existsSync(logFilePath)
        ) {
          fs.unlinkSync(logFilePath);
          deletedFiles.add(log.docdtlog_file);
        }
      }
    }

    await prisma.docdtLog.deleteMany({
      where: { docdtId: Number(docdirectorId) },
    });

    await prisma.docdtTracking.deleteMany({
      where: { docdtId: Number(docdirectorId) },
    });

    await prisma.docDirector.delete({
      where: {
        id: Number(docdirectorId),
      },
    });

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
