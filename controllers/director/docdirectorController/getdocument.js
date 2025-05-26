const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docdirectorId } = req.params;

    const docdt = await prisma.docDirector.findUnique({
      where: {
        id: Number(docdirectorId),
      },
      select: {
        docdt_fileoriginal: true,
        docdt_file: true,
        docdt_filetype: true,
        docdt_filesize: true,
        creator: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
          },
        },
        docdtlogs: {
          select: {
            docdtlog_original: true,
            docdtlog_file: true,
            docdtlog_type: true,
            docdtlog_size: true,
            assigner: {
              select: {
                username: true,
                employee: {
                  select: {
                    first_name: true,
                    last_name: true,
                    gender: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!docdt) {
      return res.status(404).json({ message: "document not found" });
    }

    // กรอง log ที่มีข้อมูลอย่างน้อย 1 ช่องไม่เป็น null
    const filteredLogs = docdt.docdtlogs.filter((log) => {
      return (
        log.docdtlog_original !== null ||
        log.docdtlog_file !== null ||
        log.docdtlog_type !== null ||
        log.docdtlog_size !== null
      );
    });

    // ลบ log ที่ข้อมูลซ้ำกันออก (เปรียบเทียบทั้ง object)
    const uniqueLogsMap = new Map();
    filteredLogs.forEach((log) => {
      const key = JSON.stringify(log); // ใช้ stringify เพื่อเช็คว่าเหมือนกันทุกช่อง
      if (!uniqueLogsMap.has(key)) {
        uniqueLogsMap.set(key, log);
      }
    });

    const uniqueLogs = Array.from(uniqueLogsMap.values());

    // สร้างผลลัพธ์ใหม่
    const result = {
      ...docdt,
      docdtlogs: uniqueLogs,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
