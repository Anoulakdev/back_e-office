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

    // ลบไฟล์ของ docExternal แบบ Non-blocking Async
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

    // ค้นหา logs ที่เกี่ยวข้อง
    const docexLogs = await prisma.docexLog.findMany({
      where: { docexId: Number(docexternalId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้บล็อก Event Loop
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

    await prisma.$transaction([
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
