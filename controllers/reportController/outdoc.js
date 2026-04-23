const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;

    let where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);
      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    const select = {
      id: true,
      creator: {
        select: {
          employee: {
            select: {
              divisionId: true,
              division: true,
            },
          },
        },
      },
    };

    const [docexternals, docinternals, docdirectors] = await Promise.all([
      prisma.docExternal.findMany({ where, select }),
      prisma.docInternal.findMany({ where, select }),
      prisma.docDirector.findMany({ where, select }),
    ]);

    // ✅ function group + count
    const groupByDivision = (data) => {
      return Object.values(
        data.reduce((acc, item) => {
          const divisionId = item.creator?.employee?.divisionId || "unknown";

          const division = item.creator?.employee?.division || null;

          if (!acc[divisionId]) {
            acc[divisionId] = {
              divisionId,
              division_name: division?.division_name || "Unknown",
              count: 0,
            };
          }

          acc[divisionId].count += 1;

          return acc;
        }, {}),
      );
    };

    res.json({
      Externals: groupByDivision(docexternals),
      Internals: groupByDivision(docinternals),
      Directors: groupByDivision(docdirectors),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
