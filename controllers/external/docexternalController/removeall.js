const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docexternalIds } = req.body;

    if (!docexternalIds || !Array.isArray(docexternalIds) || docexternalIds.length === 0) {
      return res.status(400).json({
        message: "docexternalIds must be a non-empty array",
      });
    }

    // แปลงค่าเป็นตัวเลขและกรองเฉพาะ ID ที่ถูกต้อง
    const targetIds = docexternalIds
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id > 0);

    if (targetIds.length === 0) {
      return res.status(400).json({
        message: "No valid IDs provided in docexternalIds",
      });
    }

    const deletedFiles = new Set(); // ป้องกันการลบไฟล์ซ้ำ
    let deletedCount = 0;

    // วน Loop ลบแต่ละ docexternalId
    for (const id of targetIds) {
      const docex = await prisma.docExternal.findUnique({
        where: { id },
      });

      if (!docex) {
        continue; // ถ้าไม่พบเอกสารนี้ ให้ข้ามไป
      }

      // 1. ลบไฟล์เอกสารของ docExternal แบบ Non-blocking
      if (docex.docex_file) {
        const filedocPath = path.join(
          __dirname,
          "../../../uploads/document",
          docex.docex_file
        );
        if (!deletedFiles.has(filedocPath) && fsSync.existsSync(filedocPath)) {
          deletedFiles.add(filedocPath);
          await fs.unlink(filedocPath).catch((fileErr) => {
            console.error(`Error deleting file ${filedocPath}:`, fileErr.message);
          });
        }
      }

      // 2. ค้นหาและลบไฟล์แนบของ docexLog ที่เกี่ยวข้อง
      const docexLogs = await prisma.docexLog.findMany({
        where: { docexId: id },
      });

      for (const log of docexLogs) {
        if (log.docexlog_file) {
          const logFilePath = path.join(
            __dirname,
            "../../../uploads/documentlog",
            log.docexlog_file
          );
          if (!deletedFiles.has(logFilePath) && fsSync.existsSync(logFilePath)) {
            deletedFiles.add(logFilePath);
            await fs.unlink(logFilePath).catch((fileErr) => {
              console.error(`Error deleting log file ${logFilePath}:`, fileErr.message);
            });
          }
        }
      }

      // 3. ค้นหาและลบไฟล์แนบของ docExport ที่เกี่ยวข้อง (ถ้ามี)
      const docExports = await prisma.docExport.findMany({
        where: { docexId: id },
      });

      for (const exp of docExports) {
        if (exp.export_file) {
          const expFilePath = path.join(
            __dirname,
            "../../../uploads/docexport",
            exp.export_file
          );
          if (!deletedFiles.has(expFilePath) && fsSync.existsSync(expFilePath)) {
            deletedFiles.add(expFilePath);
            await fs.unlink(expFilePath).catch((fileErr) => {
              console.error(`Error deleting export file ${expFilePath}:`, fileErr.message);
            });
          }
        }
      }

      // 4. ลบข้อมูลในฐานข้อมูล (DocExport, DocexLog, DocexTracking, DocExternal)
      await prisma.$transaction([
        prisma.docExport.deleteMany({
          where: { docexId: id },
        }),
        prisma.docexLog.deleteMany({
          where: { docexId: id },
        }),
        prisma.docexTracking.deleteMany({
          where: { docexId: id },
        }),
        prisma.docExternal.delete({
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
    console.error("Error in removeall (docexternal):", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
