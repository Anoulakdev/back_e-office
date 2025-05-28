const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

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
        docinlogs: {
          select: {
            docinlog_original: true,
            docinlog_file: true,
            docinlog_type: true,
            docinlog_size: true,
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

    // ลบ log ซ้ำกันตาม 4 field แรกเท่านั้น
    const uniqueMap = new Map();
    filteredLogs.forEach((log) => {
      const key = JSON.stringify({
        docinlog_original: log.docinlog_original,
        docinlog_file: log.docinlog_file,
        docinlog_type: log.docinlog_type,
        docinlog_size: log.docinlog_size,
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
      docin_fileoriginal: docin.docin_fileoriginal,
      docin_file: docin.docin_file,
      docin_filetype: docin.docin_filetype,
      docin_filesize: docin.docin_filesize,
      createdAt: moment(docin.createdAt).tz("Asia/Vientiane").format(),
      creator: docin.creator,
      docinlogs: uniqueLogs,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
