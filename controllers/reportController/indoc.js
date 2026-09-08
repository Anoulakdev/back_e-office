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

    const user = req.user;
    const roleId = user?.roleId ? Number(user.roleId) : null;

    if ([2, 3, 4, 11].includes(roleId)) {
      // แบบเดิม: เห็นทั้งหมด ไม่ต้อง filter เพิ่ม (แสดงทั้ง department, division และ office)
    } else if (roleId === 6) {
      const departmentId = user?.employee?.departmentId || user?.departmentId;
      if (departmentId) {
        where.departmentId = Number(departmentId);
      }
    } else if (roleId === 7) {
      const divisionId = user?.employee?.divisionId || user?.divisionId;
      if (divisionId) {
        where.divisionId = Number(divisionId);
      }
    } else if (roleId === 8) {
      const officeId = user?.employee?.officeId || user?.officeId;
      if (officeId) {
        where.officeId = Number(officeId);
      }
    } else if ([9, 10].includes(roleId)) {
      if (user?.username) {
        where.receiverCode = user.username;
      }
    }

    // 🔥 function หลัก
    const countDivisionFromLogs = (logs, docKey) => {
      const uniqueMap = new Map();

      logs.forEach((log) => {
        if (!log.divisionId && !log.officeId) return;

        const key = `${log[docKey]}-${log.divisionId}-${log.departmentId}-${log.officeId || "no-office"}`;

        // กันซ้ำ doc + division + department + office
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            officeId: log.officeId || null,
            office_name: log.officeId
              ? log.office?.office_name || "Unknown"
              : null,
            divisionId: log.divisionId || null,
            division_name: log.division?.division_name || "Unknown",
            departmentId: log.departmentId || null,
            department_name: log.department?.department_name || "Unknown",
          });
        }
      });

      const result = {};

      uniqueMap.forEach((item) => {
        const {
          officeId,
          office_name,
          divisionId,
          division_name,
          departmentId,
          department_name,
        } = item;

        const groupKey = `${officeId || "no-office"}-${divisionId}-${departmentId}`;

        if (!result[groupKey]) {
          result[groupKey] = {
            officeId,
            office_name,
            divisionId,
            division_name,
            departmentId,
            department_name,
            count: 0,
          };
        }

        result[groupKey].count += 1;
      });

      // ✅ sort ตาม officeId, divisionId, departmentId
      return Object.values(result).sort(
        (a, b) =>
          (a.officeId || 0) - (b.officeId || 0) ||
          (a.divisionId || 0) - (b.divisionId || 0) ||
          (a.departmentId || 0) - (b.departmentId || 0),
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
          officeId: true,
          office: {
            select: { office_name: true },
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
          officeId: true,
          office: {
            select: { office_name: true },
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
          officeId: true,
          office: {
            select: { office_name: true },
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
