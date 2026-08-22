const fs = require("fs").promises;
const fsSync = require("fs");
const prisma = require("../../../prisma/prisma");
const path = require("path");

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

    // ลบไฟล์ของ docDirector แบบ Non-blocking Async
    if (docdt.docdt_file) {
      const filedocPath = path.join(
        __dirname,
        "../../../uploads/document",
        docdt.docdt_file
      );
      if (fsSync.existsSync(filedocPath)) {
        await fs.unlink(filedocPath).catch((err) => console.error("Error deleting doc file:", err.message));
      }
    }

    // ค้นหา logs ที่เกี่ยวข้อง
    const docdtLogs = await prisma.docdtLog.findMany({
      where: { docdtId: Number(docdirectorId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้บล็อก Event Loop
    const deletedFiles = new Set();
    for (const log of docdtLogs) {
      if (log.docdtlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../../uploads/documentlog",
          log.docdtlog_file
        );

        if (!deletedFiles.has(log.docdtlog_file) && fsSync.existsSync(logFilePath)) {
          deletedFiles.add(log.docdtlog_file);
          await fs.unlink(logFilePath).catch((err) => console.error("Error deleting log file:", err.message));
        }
      }
    }

    await prisma.$transaction([
      prisma.docdtLog.deleteMany({
        where: { docdtId: Number(docdirectorId) },
      }),
      prisma.docdtTracking.deleteMany({
        where: { docdtId: Number(docdirectorId) },
      }),
      prisma.docDirector.delete({
        where: {
          id: Number(docdirectorId),
        },
      }),
    ]);

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
