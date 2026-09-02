const fs = require("fs").promises;
const fsSync = require("fs");
const prisma = require("../../../prisma/prisma");
const path = require("path");

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

    // 1. ลบไฟล์ของ docExternal แบบ Non-blocking Async
    if (docex.docex_file) {
      const filedocPath = path.join(
        __dirname,
        "../../../uploads/document",
        docex.docex_file
      );
      if (fsSync.existsSync(filedocPath)) {
        await fs.unlink(filedocPath).catch((err) => console.error("Error deleting doc file:", err.message));
      }
    }

    // 2. ค้นหาและลบไฟล์ของ logs ที่เกี่ยวข้อง
    const docexLogs = await prisma.docexLog.findMany({
      where: { docexId: Number(docexternalId) },
    });

    const deletedFiles = new Set();
    for (const log of docexLogs) {
      if (log.docexlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../../uploads/documentlog",
          log.docexlog_file
        );

        if (!deletedFiles.has(log.docexlog_file) && fsSync.existsSync(logFilePath)) {
          deletedFiles.add(log.docexlog_file);
          await fs.unlink(logFilePath).catch((err) => console.error("Error deleting log file:", err.message));
        }
      }
    }

    // 3. ค้นหาและลบไฟล์ของ docExport ที่เกี่ยวข้อง (ถ้ามี)
    const docExports = await prisma.docExport.findMany({
      where: { docexId: Number(docexternalId) },
    });

    for (const exp of docExports) {
      if (exp.export_file) {
        const expFilePath = path.join(
          __dirname,
          "../../../uploads/docexport",
          exp.export_file
        );
        if (!deletedFiles.has(exp.export_file) && fsSync.existsSync(expFilePath)) {
          deletedFiles.add(exp.export_file);
          await fs.unlink(expFilePath).catch((err) => console.error("Error deleting export file:", err.message));
        }
      }
    }

    // 4. ลบข้อมูลในฐานข้อมูล (DocExport, DocexLog, DocexTracking, DocExternal)
    await prisma.$transaction([
      prisma.docExport.deleteMany({
        where: { docexId: Number(docexternalId) },
      }),
      prisma.docexLog.deleteMany({
        where: { docexId: Number(docexternalId) },
      }),
      prisma.docexTracking.deleteMany({
        where: { docexId: Number(docexternalId) },
      }),
      prisma.docExternal.delete({
        where: {
          id: Number(docexternalId),
        },
      }),
    ]);

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
