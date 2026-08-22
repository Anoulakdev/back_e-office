const fs = require("fs").promises;
const fsSync = require("fs");
const prisma = require("../../../prisma/prisma");
const path = require("path");

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

    // ลบไฟล์ของ docInternal แบบ Non-blocking Async
    if (docin.docin_file) {
      const filedocPath = path.join(
        __dirname,
        "../../../uploads/document",
        docin.docin_file
      );
      if (fsSync.existsSync(filedocPath)) {
        await fs.unlink(filedocPath).catch((err) => console.error("Error deleting doc file:", err.message));
      }
    }

    // ค้นหา logs ที่เกี่ยวข้อง
    const docinLogs = await prisma.docinLog.findMany({
      where: { docinId: Number(docinternalId) },
    });

    // ลบไฟล์ของแต่ละ log โดยไม่ให้บล็อก Event Loop
    const deletedFiles = new Set();
    for (const log of docinLogs) {
      if (log.docinlog_file) {
        const logFilePath = path.join(
          __dirname,
          "../../../uploads/documentlog",
          log.docinlog_file
        );

        if (!deletedFiles.has(log.docinlog_file) && fsSync.existsSync(logFilePath)) {
          deletedFiles.add(log.docinlog_file);
          await fs.unlink(logFilePath).catch((err) => console.error("Error deleting log file:", err.message));
        }
      }
    }

    await prisma.$transaction([
      prisma.docinLog.deleteMany({
        where: { docinId: Number(docinternalId) },
      }),
      prisma.docinTracking.deleteMany({
        where: { docinId: Number(docinternalId) },
      }),
      prisma.docInternal.delete({
        where: {
          id: Number(docinternalId),
        },
      }),
    ]);

    res.status(200).json({ message: "Document deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
