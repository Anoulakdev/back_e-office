const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const {
      status,
      search,
      roleId,
      departmentId,
      divisionId,
      officeId,
      unitId,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        {
          username: { contains: search, mode: "insensitive" },
        },
        {
          employee: {
            first_name: { contains: search, mode: "insensitive" },
          },
        },
        {
          employee: {
            last_name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    if (roleId) where.roleId = Number(roleId);
    if (departmentId) {
      where.employee = {
        departmentId: Number(departmentId),
      };
    }
    if (divisionId) {
      where.employee = {
        divisionId: Number(divisionId),
      };
    }
    if (officeId) {
      where.employee = {
        officeId: Number(officeId),
      };
    }
    if (unitId) {
      where.employee = {
        unitId: Number(unitId),
      };
    }

    const currentPage = Number(page);
    const take = Number(limit);
    const skip = (currentPage - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
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
      }),

      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map(({ password, ...user }) => ({
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
      employee: user.employee
        ? {
            ...user.employee,
            createdAt: moment(user.employee.createdAt)
              .tz("Asia/Vientiane")
              .format(),
            updatedAt: moment(user.employee.updatedAt)
              .tz("Asia/Vientiane")
              .format(),
          }
        : null,
    }));

    res.json({
      data: formattedUsers,
      pagination: {
        total,
        page: currentPage,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
