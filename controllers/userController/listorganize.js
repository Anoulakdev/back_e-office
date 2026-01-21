const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const {
      extype,
      docstatusId,
      roleId,
      rankId,
      departmentId,
      divisionId,
      officeId,
      unitId,
    } = req.query;

    // สร้าง filter สำหรับการกรองข้อมูลตาม query params
    const filter = {
      where: {},
      orderBy: [{ roleId: "asc" }, { rankId: "asc" }],
      include: {
        rank: true,
        role: true,
        employee: {
          include: {
            position: true,
            department: true,
            division: true,
            office: true,
            unit: true,
          },
        },
      },
    };

    switch (Number(docstatusId)) {
      case 1:
        switch (Number(roleId)) {
          case 2:
          case 4:
            filter.where.roleId = 4;
            filter.where.status = { not: "C" };
            break;
          case 7:
            filter.where.roleId = 6;
            filter.where.status = { not: "C" };
            filter.where.employee = {
              departmentId: Number(departmentId),
            };
            break;
        }
        break;
      case 10:
        switch (Number(roleId)) {
          case 2:
            filter.where.roleId = 4;
            filter.where.status = { not: "C" };
            break;
          case 6:
            filter.where.roleId = 2;
            filter.where.status = { not: "C" };
            break;
        }
        break;
      case 11:
        switch (Number(roleId)) {
          case 4:
            filter.where.roleId = Number(roleId);
            filter.where.status = { not: "C" };
            filter.where.rankId = { lt: Number(rankId) };
            break;
          case 6:
            filter.where.roleId = 4;
            filter.where.status = { not: "C" };
            break;
        }
        break;
      case 12:
        switch (Number(roleId)) {
          case 4:
            filter.where.roleId = Number(roleId);
            filter.where.status = { not: "C" };
            filter.where.rankId = { gt: Number(rankId) };
            break;
        }
        break;
      case 2:
        switch (Number(roleId)) {
          case 4:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { gt: Number(rankId) },
                },
                {
                  roleId: 11,
                  status: { not: "C" },
                },
              ],
            };
            break;
          case 11:
            filter.where.roleId = 6;
            filter.where.status = { not: "C" };
            break;
          case 6:
            // filter.where.roleId = Number(roleId);
            filter.where.status = { not: "C" };
            filter.where.employee = {
              departmentId: Number(departmentId),
            };

            if (
              extype === undefined ||
              extype === null ||
              extype === "" ||
              Number(extype) === 1
            ) {
              filter.where.roleId = Number(roleId);
              filter.where.rankId = { gt: Number(rankId) };
            } else {
              filter.where.OR = [
                {
                  roleId: 2, // 👈 roleId 2 ไม่ต้องมี rank
                },
                {
                  roleId: Number(roleId),
                  rankId: { lt: Number(rankId) }, // 👈 เช็ค rank เฉพาะ role ปกติ
                },
              ];
            }
            break;
          case 7:
            if (Number(rankId) === 1 && Number(extype) === 2) {
              filter.where.roleId = 6;
              filter.where.status = { not: "C" };
              filter.where.employee = {
                departmentId: Number(departmentId),
              };
            } else {
              filter.where.roleId = Number(roleId);
              filter.where.status = { not: "C" };
              filter.where.rankId =
                Number(extype) === 2
                  ? { lt: Number(rankId) }
                  : { gt: Number(rankId) };
              filter.where.employee = {
                divisionId: Number(divisionId),
              };
            }
            break;
          case 8:
            if (Number(rankId) === 1 && Number(extype) === 2) {
              filter.where.roleId = 7;
              filter.where.status = { not: "C" };
              filter.where.employee = {
                divisionId: Number(divisionId),
              };
            } else {
              filter.where.roleId = Number(roleId);
              filter.where.status = { not: "C" };
              filter.where.rankId = { gt: Number(rankId) };
              filter.where.employee = {
                officeId: Number(officeId),
              };
            }
            break;
          case 9:
            if (!rankId) {
              filter.where = {
                OR: [
                  {
                    roleId: 9,
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                  {
                    roleId: 10,
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                ],
              };
            } else {
              filter.where = {
                OR: [
                  {
                    roleId: 9,
                    rankId: { gt: Number(rankId) },
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                  {
                    roleId: 10,
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                ],
              };
            }
            break;
        }
        break;
      case 5:
      case 7:
        switch (Number(roleId)) {
          case 4:
            filter.where.roleId = Number(roleId);
            filter.where.status = { not: "C" };
            filter.where.rankId = { lt: Number(rankId) };
            break;
          case 11:
            filter.where.roleId = 4;
            filter.where.status = { not: "C" };
            break;
          case 6:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { lt: Number(rankId) },
                  employee: {
                    departmentId: Number(departmentId),
                  },
                },
                {
                  roleId: 4,
                  status: { not: "C" },
                },
                {
                  roleId: 11,
                  status: { not: "C" },
                },
              ],
            };

            filter.orderBy = [
              { role: { role_code: "asc" } },
              { rankId: "asc" },
            ];
            break;
          case 7:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { lt: Number(rankId) },
                  employee: {
                    divisionId: Number(divisionId),
                  },
                },
                {
                  roleId: { lt: Number(roleId) },
                  status: { not: "C" },
                  employee: {
                    departmentId: Number(departmentId),
                  },
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 8:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { lt: Number(rankId) },
                  employee: {
                    officeId: Number(officeId),
                  },
                },
                {
                  roleId: 7,
                  status: { not: "C" },
                  employee: {
                    divisionId: Number(divisionId),
                  },
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 9:
            const conditions = [
              {
                roleId: Number(roleId),
                status: { not: "C" },
                rankId: { lt: Number(rankId) },
                employee: {
                  unitId: Number(unitId),
                },
              },
            ];

            if (divisionId) {
              conditions.push({
                roleId: 7,
                status: { not: "C" },
                employee: {
                  divisionId: Number(divisionId),
                },
              });
            } else if (officeId) {
              conditions.push({
                roleId: 8,
                status: { not: "C" },
                employee: {
                  officeId: Number(officeId),
                },
              });
            }

            filter.where = {
              OR: conditions,
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];

            break;
          case 10:
            filter.where.roleId = { lt: Number(roleId) };
            filter.where.status = { not: "C" };
            filter.where.employee = {
              unitId: Number(unitId),
            };
            break;
        }
        break;
      case 3:
      case 6:
        switch (Number(roleId)) {
          case 4:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { gt: Number(rankId) },
                },
                {
                  roleId: 6,
                  status: { not: "C" },
                  employee: {
                    departmentId: Number(departmentId),
                  },
                },
                {
                  roleId: 11,
                  status: { not: "C" },
                },
              ],
            };
            filter.orderBy = [
              { role: { role_code: "asc" } },
              { rankId: "asc" },
            ];
            break;
          case 11:
            filter.where.roleId = 6;
            filter.where.status = { not: "C" };
            break;
          case 6:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { gt: Number(rankId) },
                  employee: {
                    departmentId: Number(departmentId),
                  },
                },
                {
                  roleId: 7,
                  status: { not: "C" },
                  employee: {
                    departmentId: Number(departmentId),
                  },
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 7:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { gt: Number(rankId) },
                  employee: {
                    divisionId: Number(divisionId),
                  },
                },
                {
                  roleId: { in: [8, 9] },
                  status: { not: "C" },
                  employee: {
                    divisionId: Number(divisionId),
                  },
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 8:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: { not: "C" },
                  rankId: { gt: Number(rankId) },
                  employee: {
                    officeId: Number(officeId),
                  },
                },
                {
                  roleId: 9,
                  status: { not: "C" },
                  employee: {
                    officeId: Number(officeId),
                  },
                },
              ],
            };
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 9:
            if (!rankId) {
              filter.where = {
                OR: [
                  {
                    roleId: 9,
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                  {
                    roleId: 10,
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                ],
              };
            } else {
              filter.where = {
                OR: [
                  {
                    roleId: Number(roleId),
                    status: { not: "C" },
                    rankId: { gt: Number(rankId) },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                  {
                    roleId: 10,
                    status: { not: "C" },
                    employee: {
                      unitId: Number(unitId),
                    },
                  },
                ],
              };
            }
            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
        }
        break;
      default:
        break;
    }

    // ดึงข้อมูลจาก Prisma
    const users =
      Object.keys(filter.where || {}).length > 0
        ? await prisma.user.findMany(filter)
        : [];

    // การฟอร์แมตวันที่
    const formattedUsers = users.map(({ password, ...user }) => ({
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
