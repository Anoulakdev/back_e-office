const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;

    let where = {};

    if (selectDateStart && selectDateEnd) {
      where.createdAt = {
        gte: new Date(`${selectDateStart}T00:00:00+07:00`),
        lte: new Date(`${selectDateEnd}T23:59:59+07:00`),
      };
    }

    // 🔥 function หลัก
    const countDivisionFromLogs = (logs, docKey) => {
      const uniqueMap = new Map();

      logs.forEach((log) => {
        if (!log.divisionId) return;

        const key = `${log[docKey]}-${log.divisionId}`;

        // กันซ้ำ doc + division
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            divisionId: log.divisionId,
            division_name: log.division?.division_name || "Unknown",
          });
        }
      });

      const result = {};

      uniqueMap.forEach((item) => {
        const { divisionId, division_name } = item;

        if (!result[divisionId]) {
          result[divisionId] = {
            divisionId,
            division_name,
            count: 0,
          };
        }

        result[divisionId].count += 1;
      });

      return Object.values(result);
    };

    const [exLogs, inLogs, dtLogs] = await Promise.all([
      prisma.docexLog.findMany({
        where,
        select: {
          docexId: true,
          divisionId: true,
          division: {
            select: { division_name: true },
          },
        },
      }),
      prisma.docinLog.findMany({
        where,
        select: {
          docinId: true,
          divisionId: true,
          division: {
            select: { division_name: true },
          },
        },
      }),
      prisma.docdtLog.findMany({
        where,
        select: {
          docdtId: true,
          divisionId: true,
          division: {
            select: { division_name: true },
          },
        },
      }),
    ]);

    res.json({
      Externals: countDivisionFromLogs(exLogs, "docexId"),
      Internals: countDivisionFromLogs(inLogs, "docinId"),
      Directors: countDivisionFromLogs(dtLogs, "docdtId"),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
