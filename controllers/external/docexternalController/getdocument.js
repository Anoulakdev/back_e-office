const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

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
        createdAt: true,
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
        docexlogs: {
          select: {
            docexlog_original: true,
            docexlog_file: true,
            docexlog_type: true,
            docexlog_size: true,
            docstatus: true,
            createdAt: true,
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
            receiver: {
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

    if (!docex) {
      return res.status(404).json({ message: "document not found" });
    }

    // กรอง log ที่มีข้อมูลอย่างน้อย 1 ช่องไม่เป็น null
    const filteredLogs = docex.docexlogs.filter((log) => {
      return (
        log.docexlog_original !== null ||
        log.docexlog_file !== null ||
        log.docexlog_type !== null ||
        log.docexlog_size !== null
      );
    });

    // ลบ log ซ้ำกันตาม 4 field แรกเท่านั้น
    const uniqueMap = new Map();
    filteredLogs.forEach((log) => {
      const key = JSON.stringify({
        docexlog_original: log.docexlog_original,
        docexlog_file: log.docexlog_file,
        docexlog_type: log.docexlog_type,
        docexlog_size: log.docexlog_size,
      });
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, log);
      }
    });

    // แปลงวันที่ createdAt ทีละ log เป็น timezone Asia/Vientiane
    const uniqueLogs = Array.from(uniqueMap.values()).map((log) => ({
      ...log,
      createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
    }));

    // สร้างผลลัพธ์สุดท้าย
    const result = {
      docex_fileoriginal: docex.docex_fileoriginal,
      docex_file: docex.docex_file,
      docex_filetype: docex.docex_filetype,
      docex_filesize: docex.docex_filesize,
      createdAt: moment(docex.createdAt).tz("Asia/Vientiane").format(),
      creator: docex.creator,
      docexlogs: uniqueLogs,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
