const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const username = req.user.username;

    // =========================
    // STEP 1: หา docexId ที่ user เกี่ยวข้อง
    // =========================
    const relatedDocs = await prisma.docexLog.findMany({
      where: {
        OR: [{ assignerCode: username }, { receiverCode: username }],
      },
      select: {
        docexId: true,
      },
    });

    const docexIds = [...new Set(relatedDocs.map((doc) => doc.docexId))];

    // ถ้าไม่มีสิทธิ์เลย
    if (docexIds.length === 0) {
      return res.json([]);
    }

    // =========================
    // STEP 2: สร้าง where
    // =========================
    let where = {
      docexId: { in: docexIds },
      NOT: {
        docexlog_file: null,
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

    // =========================
    // STEP 3: query
    // =========================
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

    // =========================
    // STEP 4: กรอง file ไม่ซ้ำ
    // =========================
    const seenFiles = new Set();

    const uniqueDocs = documents
      .filter((doc) => {
        if (seenFiles.has(doc.docexlog_file)) return false;
        seenFiles.add(doc.docexlog_file);
        return true;
      })
      .map((doc) => ({
        ...doc,
        createdAt: moment(doc.createdAt)
          .tz("Asia/Vientiane")
          .format("YYYY-MM-DD HH:mm:ss"),
      }));

    res.json(uniqueDocs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
