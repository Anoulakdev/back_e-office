const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;

    let where = {
      assignerCode: req.user.username,
      // docstatusId: { notIn: [7] },
      NOT: {
        docexlog_file: null, // กรอง null ตั้งแต่ใน query
      },
    };

    if (selectDateStart && selectDateEnd) {
      const startDate = moment
        .tz(`${selectDateStart} 00:00:00`, "Asia/Vientiane")
        .toDate();
      const endDate = moment
        .tz(`${selectDateEnd} 23:59:59`, "Asia/Vientiane")
        .toDate();

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const documents = await prisma.docexLog.findMany({
      where,
      select: {
        docexId: true,
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
    });

    // กรองให้เหลือเฉพาะ docexlog_file ไม่ซ้ำ
    const seenFiles = new Set();
    const uniqueDocs = [];

    for (const doc of documents) {
      if (!seenFiles.has(doc.docexlog_file)) {
        seenFiles.add(doc.docexlog_file);
        uniqueDocs.push({
          ...doc,
          createdAt: moment(doc.createdAt)
            .tz("Asia/Vientiane")
            .format("YYYY-MM-DD HH:mm:ss"),
        });
      }
    }

    res.json(uniqueDocs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
