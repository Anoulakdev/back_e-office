const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

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
        docdtlogs: {
          select: {
            docdtlog_original: true,
            docdtlog_file: true,
            docdtlog_type: true,
            docdtlog_size: true,
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

    if (!docdt) {
      return res.status(404).json({ message: "document not found" });
    }

    // กรอง log ที่อย่างน้อย 1 ช่องไม่ null
    const filteredLogs = docdt.docdtlogs.filter((log) => {
      return (
        log.docdtlog_original !== null ||
        log.docdtlog_file !== null ||
        log.docdtlog_type !== null ||
        log.docdtlog_size !== null
      );
    });

    // ลบ log ซ้ำกันตาม 4 field แรกเท่านั้น
    const uniqueMap = new Map();
    filteredLogs.forEach((log) => {
      const key = JSON.stringify({
        docdtlog_original: log.docdtlog_original,
        docdtlog_file: log.docdtlog_file,
        docdtlog_type: log.docdtlog_type,
        docdtlog_size: log.docdtlog_size,
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
      docdt_fileoriginal: docdt.docdt_fileoriginal,
      docdt_file: docdt.docdt_file,
      docdt_filetype: docdt.docdt_filetype,
      docdt_filesize: docdt.docdt_filesize,
      createdAt: moment(docdt.createdAt).tz("Asia/Vientiane").format(),
      creator: docdt.creator,
      docdtlogs: uniqueLogs,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
