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
              departmentId: true,
              department: true,
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

    // 🔥 group by division + department
    const groupByDivision = (data) => {
      return (
        Object.values(
          data.reduce((acc, item) => {
            const emp = item.creator?.employee;

            const divisionId = emp?.divisionId || "unknown";
            const departmentId = emp?.departmentId || "unknown";

            const division_name = emp?.division?.division_name || "Unknown";

            const department_name =
              emp?.department?.department_name || "Unknown";

            const key = `${divisionId}-${departmentId}`;

            if (!acc[key]) {
              acc[key] = {
                divisionId,
                division_name,
                departmentId,
                department_name,
                count: 0,
              };
            }

            acc[key].count += 1;

            return acc;
          }, {}),
        )
          // 🔥 orderBy departmentId
          .sort((a, b) => (a.departmentId || 0) - (b.departmentId || 0))
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
