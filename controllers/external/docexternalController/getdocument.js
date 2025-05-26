const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docexternalId } = req.params;

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexternalId),
      },
      select: {
        docex_fileoriginal: true,
        docex_file: true,
        docex_filetype: true,
        docex_filesize: true,
        docexlogs: {
          select: {
            docexlog_original: true,
            docexlog_file: true,
            docexlog_type: true,
            docexlog_size: true,
          },
        },
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "document not found" });
    }

    // กรอง log ที่มีข้อมูลอย่างน้อย 1 ช่องไม่เป็น null
    const filteredLogs = docex.docexlogs.filter(log => {
      return (
        log.docexlog_original !== null ||
        log.docexlog_file !== null ||
        log.docexlog_type !== null ||
        log.docexlog_size !== null
      );
    });

    // ลบ log ที่ข้อมูลซ้ำกันออก (เปรียบเทียบทั้ง object)
    const uniqueLogsMap = new Map();
    filteredLogs.forEach(log => {
      const key = JSON.stringify(log); // ใช้ stringify เพื่อเช็คว่าเหมือนกันทุกช่อง
      if (!uniqueLogsMap.has(key)) {
        uniqueLogsMap.set(key, log);
      }
    });

    const uniqueLogs = Array.from(uniqueLogsMap.values());

    // สร้างผลลัพธ์ใหม่
    const result = {
      ...docex,
      docexlogs: uniqueLogs,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
