const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docinternalId } = req.params;

    const docin = await prisma.docInternal.findUnique({
      where: {
        id: Number(docinternalId),
      },
      select: {
        docin_fileoriginal: true,
        docin_file: true,
        docin_filetype: true,
        docin_filesize: true,
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
        docinlogs: {
          select: {
            docinlog_original: true,
            docinlog_file: true,
            docinlog_type: true,
            docinlog_size: true,
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

    if (!docin) {
      return res.status(404).json({ message: "document not found" });
    }

    // กรอง log ที่มีข้อมูลอย่างน้อย 1 ช่องไม่เป็น null
    const filteredLogs = docin.docinlogs.filter((log) => {
      return (
        log.docinlog_original !== null ||
        log.docinlog_file !== null ||
        log.docinlog_type !== null ||
        log.docinlog_size !== null
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
      ...docin,
      docinlogs: uniqueLogs,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
