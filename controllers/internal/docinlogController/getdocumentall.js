const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const username = req.user.username;

    // =========================
    // STEP 1: หา docinId ที่ user เกี่ยวข้อง
    // =========================
    const relatedDocs = await prisma.docinLog.findMany({
      where: {
        OR: [{ assignerCode: username }, { receiverCode: username }],
      },
      select: {
        docinId: true,
      },
    });

    const docinIds = [...new Set(relatedDocs.map((doc) => doc.docinId))];

    // ไม่มีสิทธิ์
    if (docinIds.length === 0) {
      return res.json([]);
    }

    // =========================
    // STEP 2: where
    // =========================
    let where = {
      docinId: { in: docinIds },
      NOT: {
        docinlog_file: null,
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
    const documents = await prisma.docinLog.findMany({
      where,
      select: {
        docinId: true,
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
    });

    // =========================
    // STEP 4: unique file
    // =========================
    const seenFiles = new Set();

    const uniqueDocs = documents
      .filter((doc) => {
        if (seenFiles.has(doc.docinlog_file)) return false;
        seenFiles.add(doc.docinlog_file);
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
