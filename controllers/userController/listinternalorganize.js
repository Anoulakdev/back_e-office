const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const {
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
          case 6:
            if (rankId) {
              filter.where = {
                OR: [
                  {
                    roleId: 2,
                    status: "A",
                  },
                  {
                    roleId: Number(roleId),
                    status: "A",
                    rankId: { lt: Number(rankId) },
                    ...(Number(departmentId) && {
                      employee: {
                        departmentId: Number(departmentId),
                      },
                    }),
                  },
                ],
              };
            } else {
              filter.where = {
                roleId: 2,
                status: "A",
              };
            }
            break;
          case 7:
            filter.where = {
              OR: [
                {
                  roleId: 6,
                  status: "A",
                  ...(Number(departmentId) && {
                    employee: {
                      departmentId: Number(departmentId),
                    },
                  }),
                },
                {
                  roleId: Number(roleId),
                  status: "A",
                  ...(rankId && { rankId: { lt: Number(rankId) } }),
                  ...(Number(divisionId) && {
                    employee: {
                      divisionId: Number(divisionId),
                    },
                  }),
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 8:
            filter.where = {
              OR: [
                {
                  roleId: 7,
                  status: "A",
                  ...(Number(divisionId) && {
                    employee: {
                      divisionId: Number(divisionId),
                    },
                  }),
                },
                {
                  roleId: Number(roleId),
                  status: "A",
                  ...(rankId && { rankId: { lt: Number(rankId) } }),
                  ...(Number(officeId) && {
                    employee: {
                      officeId: Number(officeId),
                    },
                  }),
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 9:
            const conditions = [
              {
                roleId: Number(roleId),
                status: "A",
                ...(rankId && { rankId: { lt: Number(rankId) } }),
                ...(Number(unitId) && {
                  employee: {
                    unitId: Number(unitId),
                  },
                }),
              },
            ];

            if (Number(officeId)) {
              conditions.push({
                roleId: 8,
                status: "A",
                employee: {
                  officeId: Number(officeId),
                },
              });
            } else if (Number(divisionId)) {
              conditions.push({
                roleId: 7,
                status: "A",
                employee: {
                  divisionId: Number(divisionId),
                },
              });
            }

            filter.where = {
              OR: conditions,
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];

            break;
          case 10:
            const targetUnitId = unitId || req.user?.employee?.unitId;
            let hasUnitUsers = false;

            if (Number(targetUnitId)) {
              const count = await prisma.user.count({
                where: {
                  roleId: 9,
                  status: "A",
                  employee: {
                    unitId: Number(targetUnitId),
                  },
                },
              });
              hasUnitUsers = count > 0;
            }

            if (hasUnitUsers) {
              filter.where.roleId = 9;
              filter.where.status = "A";
              filter.where.employee = {
                unitId: Number(targetUnitId),
              };
            } else {
              const branchId = Number(req.user?.employee?.division?.branch_id);
              const targetDivisionId =
                req.user?.divisionId ||
                req.user?.employee?.divisionId ||
                divisionId;
              const targetOfficeId =
                req.user?.officeId || req.user?.employee?.officeId || officeId;

              if (branchId === 1) {
                filter.where.roleId = 7;
                filter.where.status = "A";
                if (targetDivisionId) {
                  filter.where.employee = {
                    divisionId: Number(targetDivisionId),
                  };
                }
              } else if (branchId === 2) {
                filter.where.roleId = 8;
                filter.where.status = "A";
                if (targetOfficeId) {
                  filter.where.employee = {
                    officeId: Number(targetOfficeId),
                  };
                } else if (targetDivisionId) {
                  filter.where.roleId = 7;
                  filter.where.status = "A";
                  filter.where.employee = {
                    divisionId: Number(targetDivisionId),
                  };
                }
              } else {
                if (targetOfficeId) {
                  filter.where.roleId = 8;
                  filter.where.status = "A";
                  filter.where.employee = {
                    officeId: Number(targetOfficeId),
                  };
                } else if (targetDivisionId) {
                  filter.where.roleId = 7;
                  filter.where.status = "A";
                  filter.where.employee = {
                    divisionId: Number(targetDivisionId),
                  };
                }
              }
            }
            break;
        }
        break;
      case 10:
        switch (Number(roleId)) {
          case 2:
            filter.where.roleId = 4;
            filter.where.status = "A";
            break;
          case 6:
            filter.where.roleId = 2;
            filter.where.status = "A";
            break;
        }
        break;
      case 11:
        switch (Number(roleId)) {
          case 2:
            filter.where.roleId = 4;
            filter.where.status = "A";
            break;
          case 4:
            filter.where.roleId = Number(roleId);
            filter.where.status = "A";
            if (rankId) {
              filter.where.rankId = { lt: Number(rankId) };
            }
            break;
          case 6:
            filter.where.roleId = 2;
            filter.where.status = "A";
            break;
        }
        break;
      case 12:
        switch (Number(roleId)) {
          case 4:
            filter.where.roleId = Number(roleId);
            filter.where.status = "A";
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            break;
        }
        break;
      case 2:
        switch (Number(roleId)) {
          case 2:
            filter.where = {
              OR: [
                {
                  roleId: 4,
                  status: "A",
                },
                {
                  roleId: 11,
                  status: "A",
                },
              ],
            };
            break;
          case 4:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: "A",
                  ...(rankId && { rankId: { lt: Number(rankId) } }),
                },
              ],
            };
            break;
          case 11:
            filter.where.roleId = 4;
            filter.where.status = "A";
            break;
          case 6:
            if (rankId) {
              filter.where = {
                roleId: Number(roleId),
                status: "A",
                rankId: { gt: Number(rankId) },
                ...(Number(departmentId) && {
                  employee: {
                    departmentId: Number(departmentId),
                  },
                }),
              };
            } else {
              filter.where = {
                roleId: 2,
                status: "A",
              };
            }
            break;
          case 7:
            filter.where.roleId = Number(roleId);
            filter.where.status = "A";
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            if (Number(divisionId)) {
              filter.where.employee = {
                divisionId: Number(divisionId),
              };
            }
            break;
          case 8:
            filter.where.roleId = Number(roleId);
            filter.where.status = "A";
            if (rankId) {
              filter.where.rankId = { gt: Number(rankId) };
            }
            if (Number(officeId)) {
              filter.where.employee = {
                officeId: Number(officeId),
              };
            }
            break;
          case 9:
            const baseEmployee = Number(unitId)
              ? {
                  employee: {
                    unitId: Number(unitId),
                  },
                }
              : {};

            if (!rankId) {
              filter.where = {
                OR: [
                  {
                    roleId: 9,
                    status: "A",
                    ...baseEmployee,
                  },
                  {
                    roleId: 10,
                    status: "A",
                    ...baseEmployee,
                  },
                ],
              };
            } else {
              filter.where = {
                OR: [
                  {
                    roleId: 9,
                    rankId: { gt: Number(rankId) },
                    status: "A",
                    ...baseEmployee,
                  },
                  {
                    roleId: 10,
                    status: "A",
                    ...baseEmployee,
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
            filter.where.status = "A";
            if (rankId) {
              filter.where.rankId = { lt: Number(rankId) };
            }
            break;
          case 11:
            filter.where.roleId = 4;
            filter.where.status = "A";
            break;
          case 6:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: "A",
                  ...(rankId && { rankId: { lt: Number(rankId) } }),
                  ...(Number(departmentId) && {
                    employee: {
                      departmentId: Number(departmentId),
                    },
                  }),
                },
                {
                  roleId: 4,
                  status: "A",
                },
                {
                  roleId: 11,
                  status: "A",
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
                  status: "A",
                  ...(rankId && { rankId: { lt: Number(rankId) } }),
                  ...(Number(divisionId) && {
                    employee: {
                      divisionId: Number(divisionId),
                    },
                  }),
                },
                {
                  roleId: { lt: Number(roleId) },
                  status: "A",
                  ...(Number(departmentId) && {
                    employee: {
                      departmentId: Number(departmentId),
                    },
                  }),
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
                  status: "A",
                  ...(rankId && { rankId: { lt: Number(rankId) } }),
                  ...(Number(officeId) && {
                    employee: {
                      officeId: Number(officeId),
                    },
                  }),
                },
                {
                  roleId: 7,
                  status: "A",
                  ...(Number(divisionId) && {
                    employee: {
                      divisionId: Number(divisionId),
                    },
                  }),
                },
              ],
            };

            filter.orderBy = [{ roleId: "asc" }, { rankId: "asc" }];
            break;
          case 9:
            const conditions = [
              {
                roleId: Number(roleId),
                status: "A",
                ...(rankId && { rankId: { lt: Number(rankId) } }),
                ...(Number(unitId) && {
                  employee: {
                    unitId: Number(unitId),
                  },
                }),
              },
            ];

            if (Number(officeId)) {
              conditions.push({
                roleId: 8,
                status: "A",
                employee: {
                  officeId: Number(officeId),
                },
              });
            } else if (Number(divisionId)) {
              conditions.push({
                roleId: 7,
                status: "A",
                employee: {
                  divisionId: Number(divisionId),
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
            filter.where.status = "A";
            if (Number(unitId)) {
              filter.where.employee = {
                unitId: Number(unitId),
              };
            }
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
                  status: "A",
                  ...(rankId && { rankId: { gt: Number(rankId) } }),
                },
                {
                  roleId: 6,
                  status: "A",
                  ...(Number(departmentId) && {
                    employee: {
                      departmentId: Number(departmentId),
                    },
                  }),
                },
                {
                  roleId: 11,
                  status: "A",
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
            filter.where.status = "A";
            break;
          case 6:
            filter.where = {
              OR: [
                {
                  roleId: Number(roleId),
                  status: "A",
                  ...(rankId && { rankId: { gt: Number(rankId) } }),
                  ...(Number(departmentId) && {
                    employee: {
                      departmentId: Number(departmentId),
                    },
                  }),
                },
                {
                  roleId: 7,
                  status: "A",
                  ...(Number(departmentId) && {
                    employee: {
                      departmentId: Number(departmentId),
                    },
                  }),
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
                  status: "A",
                  ...(rankId && { rankId: { gt: Number(rankId) } }),
                  ...(Number(divisionId) && {
                    employee: {
                      divisionId: Number(divisionId),
                    },
                  }),
                },
                {
                  roleId: { in: [8, 9] },
                  status: "A",
                  ...(Number(divisionId) && {
                    employee: {
                      divisionId: Number(divisionId),
                    },
                  }),
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
                  status: "A",
                  ...(rankId && { rankId: { gt: Number(rankId) } }),
                  ...(Number(officeId) && {
                    employee: {
                      officeId: Number(officeId),
                    },
                  }),
                },
                {
                  roleId: 9,
                  status: "A",
                  ...(Number(officeId) && {
                    employee: {
                      officeId: Number(officeId),
                    },
                  }),
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
                    status: "A",
                    ...(Number(unitId) && {
                      employee: {
                        unitId: Number(unitId),
                      },
                    }),
                  },
                  {
                    roleId: 10,
                    status: "A",
                    ...(Number(unitId) && {
                      employee: {
                        unitId: Number(unitId),
                      },
                    }),
                  },
                ],
              };
            } else {
              filter.where = {
                OR: [
                  {
                    roleId: Number(roleId),
                    status: "A",
                    rankId: { gt: Number(rankId) },
                    ...(Number(unitId) && {
                      employee: {
                        unitId: Number(unitId),
                      },
                    }),
                  },
                  {
                    roleId: 10,
                    status: "A",
                    ...(Number(unitId) && {
                      employee: {
                        unitId: Number(unitId),
                      },
                    }),
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

    // ดึงข้อมูลจาก Prisma (ไม่รวม roleId = 1, 3, 5)
    if (Object.keys(filter.where || {}).length > 0) {
      filter.where = {
        AND: [
          filter.where,
          {
            roleId: {
              notIn: [1, 3, 5],
            },
          },
        ],
      };
    }

    const users =
      Object.keys(filter.where || {}).length > 0
        ? await prisma.user.findMany(filter)
        : [];

    // การฟอร์แมตวันที่ และกรองไม่ให้มี roleId = 1, 3, 5
    const formattedUsers = users
      .filter((user) => ![1, 3, 5].includes(user.roleId))
      .map(({ password, ...user }) => ({
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
