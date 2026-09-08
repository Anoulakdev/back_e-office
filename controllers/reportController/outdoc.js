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
        where.creator = {
          employee: {
            departmentId: Number(departmentId),
          },
        };
      }
    } else if (roleId === 7) {
      const divisionId = user?.employee?.divisionId || user?.divisionId;
      if (divisionId) {
        where.creator = {
          employee: {
            divisionId: Number(divisionId),
          },
        };
      }
    } else if (roleId === 8) {
      const officeId = user?.employee?.officeId || user?.officeId;
      if (officeId) {
        where.creator = {
          employee: {
            officeId: Number(officeId),
          },
        };
      }
    } else if ([9, 10].includes(roleId)) {
      if (user?.username) {
        where.creatorCode = user.username;
      }
    }

    const select = {
      id: true,
      creator: {
        select: {
          employee: {
            select: {
              officeId: true,
              office: {
                select: { office_name: true },
              },
              divisionId: true,
              division: {
                select: { division_name: true },
              },
              departmentId: true,
              department: {
                select: { department_name: true },
              },
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

    // 🔥 group by office + division + department
    const groupByDivision = (data) => {
      const result = {};

      data.forEach((item) => {
        const emp = item.creator?.employee;
        if (!emp?.divisionId && !emp?.officeId) return;

        const officeId = emp?.officeId || null;
        const office_name = officeId
          ? emp?.office?.office_name || "Unknown"
          : null;
        const divisionId = emp?.divisionId || null;
        const division_name = emp?.division?.division_name || "Unknown";
        const departmentId = emp?.departmentId || null;
        const department_name = emp?.department?.department_name || "Unknown";

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
