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

        const key = `${log[docKey]}-${log.divisionId}-${log.departmentId}`;

        // กันซ้ำ doc + division + department
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            divisionId: log.divisionId,
            division_name: log.division?.division_name || "Unknown",
            departmentId: log.departmentId || null,
            department_name: log.department?.department_name || "Unknown",
          });
        }
      });

      const result = {};

      uniqueMap.forEach((item) => {
        const { divisionId, division_name, departmentId, department_name } =
          item;

        const groupKey = `${divisionId}-${departmentId}`;

        if (!result[groupKey]) {
          result[groupKey] = {
            divisionId,
            division_name,
            departmentId,
            department_name,
            count: 0,
          };
        }

        result[groupKey].count += 1;
      });

      // ✅ sort ตาม departmentId
      return Object.values(result).sort(
        (a, b) => (a.departmentId || 0) - (b.departmentId || 0),
      );
    };

    const [exLogs, inLogs, dtLogs] = await Promise.all([
      prisma.docexLog.findMany({
        where,
        select: {
          docexId: true,
          departmentId: true,
          department: {
            select: { department_name: true },
          },
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
          departmentId: true,
          department: {
            select: { department_name: true },
          },
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
          departmentId: true,
          department: {
            select: { department_name: true },
          },
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
