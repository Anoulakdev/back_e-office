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

const upload = multer({ storage: storage }).single("docin_file");

module.exports = async (req, res) => {
  try {
    const { docinternalId } = req.params;

    const docin = await prisma.docInternal.findUnique({
      where: {
        id: Number(docinternalId),
      },
    });

    if (!docin) {
      return res.status(404).json({ message: "Document not found" });
    }

    // ลบไฟล์ของ docInternal
    if (docin.docin_file) {
      const filedocPath = path.join(
        __dirname,
        "../../../uploads/document",
        docin.docin_file
      );
      if (fs.existsSync(filedocPath)) {
        fs.unlinkSync(filedocPath);
      }
    }

    // ค้นหา logs ที่เกี่ยวข้อง
    const docinLogs = await prisma.docinLog.findMany({
      where: { docinId: Number(docinternalId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้เกิด error ถ้าไฟล์ถูกลบไปแล้ว
    const deletedFiles = new Set(); // ใช้ Set เพื่อตรวจสอบชื่อไฟล์ที่เคยลบไปแล้ว
    for (const log of docinLogs) {
      if (log.docinlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../../uploads/documentlog",
          log.docinlog_file
        );

        if (
          !deletedFiles.has(log.docinlog_file) &&
          fs.existsSync(logFilePath)
        ) {
          fs.unlinkSync(logFilePath);
          deletedFiles.add(log.docinlog_file);
        }
      }
    }

    await prisma.docinLog.deleteMany({
      where: { docinId: Number(docinternalId) },
    });

    await prisma.docinTracking.deleteMany({
      where: { docinId: Number(docinternalId) },
    });

    await prisma.docInternal.delete({
      where: {
        id: Number(docinternalId),
      },
    });

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
