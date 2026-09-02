const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docdirectorIds } = req.body;

    if (!docdirectorIds || !Array.isArray(docdirectorIds) || docdirectorIds.length === 0) {
      return res.status(400).json({
        message: "docdirectorIds must be a non-empty array",
      });
    }

    // แปลงค่าเป็นตัวเลขและกรองเฉพาะ ID ที่ถูกต้อง
    const targetIds = docdirectorIds
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (targetIds.length === 0) {
      return res.status(400).json({
        message: "No valid IDs provided in docdirectorIds",
      });
    }

    const deletedFiles = new Set(); // ป้องกันการลบไฟล์ซ้ำ
    let deletedCount = 0;

    // วน Loop ลบแต่ละ docinternalId
    for (const id of targetIds) {
      const docdt = await prisma.docDirector.findUnique({
        where: { id },
      });

      if (!docdt) {
        continue; // ถ้าไม่พบเอกสารนี้ ให้ข้ามไป
      }

      // 1. ลบไฟล์เอกสารของ docInternal แบบ Non-blocking
      if (docdt.docdt_file) {
        const filedocPath = path.join(
          __dirname,
          "../../../uploads/document",
          docdt.docdt_file
        );
        if (!deletedFiles.has(filedocPath) && fsSync.existsSync(filedocPath)) {
          deletedFiles.add(filedocPath);
          await fs.unlink(filedocPath).catch((fileErr) => {
            console.error(`Error deleting file ${filedocPath}:`, fileErr.message);
          });
        }
      }

      // 2. ค้นหาและลบไฟล์แนบของ docinLog ที่เกี่ยวข้อง
      const docdtLogs = await prisma.docdtLog.findMany({
        where: { docdtId: id },
      });

      for (const log of docdtLogs) {
        if (log.docdtlog_file) {
          const logFilePath = path.join(
            __dirname,
            "../../../uploads/documentlog",
            log.docdtlog_file
          );
          if (!deletedFiles.has(logFilePath) && fsSync.existsSync(logFilePath)) {
            deletedFiles.add(logFilePath);
            await fs.unlink(logFilePath).catch((fileErr) => {
              console.error(`Error deleting log file ${logFilePath}:`, fileErr.message);
            });
          }
        }
      }

      // 3. ลบข้อมูลในฐานข้อมูล (Logs, Tracking, DocInternal)
      await prisma.$transaction([
        prisma.docdtLog.deleteMany({
          where: { docdtId: id },
        }),
        prisma.docdtTracking.deleteMany({
          where: { docdtId: id },
        }),
        prisma.docDirector.delete({
          where: { id },
        }),
      ]);

      deletedCount++;
    }

    res.status(200).json({
      message: `Deleted ${deletedCount} documents successfully!`,
      deletedCount,
    });
  } catch (err) {
    console.error("Error in removeall:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
