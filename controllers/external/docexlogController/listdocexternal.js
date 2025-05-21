const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.docexternal = {
        createdAt: {
          gte: new Date(startDate.toISOString()),
          lte: new Date(endDate.toISOString()),
        },
      };
    }
    let docexlogs;

    const isRoleId2 = req.user.roleId === 2;

    const trackingWhere = isRoleId2
      ? {
          receiver: { roleId: 2 },
          OR: [{ docstatusId: 1 }, { docstatusId: 2 }, { docstatusId: 10 }],
        }
      : {
          receiverCode: req.user.username,
          OR: [{ docstatusId: 1 }, { docstatusId: 2 }, { docstatusId: 10 }],
        };

    const existingTrackings = await prisma.docexTracking.findMany({
      where: trackingWhere,
      select: {
        docexId: true,
        receiverCode: true,
        docstatusId: true,
      },
    });

    // สร้าง array ของ log ที่ไม่ซ้ำ
    const logIdsToExclude = [];

    for (const tracking of existingTrackings) {
      const log = await prisma.docexLog.findFirst({
        where: {
          docexId: tracking.docexId,
          receiverCode: tracking.receiverCode,
          docstatusId: tracking.docstatusId,
        },
        select: {
          id: true,
        },
      });

      if (log) {
        logIdsToExclude.push(log.id);
      }
    }

    // เงื่อนไข filter id ที่ไม่ซ้ำ
    const idFilter = logIdsToExclude.length
      ? { id: { notIn: logIdsToExclude } }
      : {};

    if (req.user.roleId === 2) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          roleId: req.user.roleId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 4) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          rankId: req.user.rankId,
          roleId: req.user.roleId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 11) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          receiverCode: req.user.username,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 6) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          docstatusId: { not: 4 },
          roleId: req.user.roleId,
          departmentId: req.user.employee.departmentId,
          rankId: req.user.rankId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 7) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          rankId: req.user.rankId,
          roleId: req.user.roleId,
          divisionId: req.user.employee.divisionId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 8) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          rankId: req.user.rankId,
          roleId: req.user.roleId,
          officeId: req.user.employee.officeId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 9) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          rankId: req.user.rankId,
          roleId: req.user.roleId,
          unitId: req.user.employee.unitId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 10) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...where,
          ...idFilter,
          receiverCode: req.user.username,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              docexlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                  receiver: {
                    select: {
                      // username: true,
                      // name: true,
                      employee: {
                        select: {
                          first_name: true,
                          last_name: true,
                          gender: true,
                          tel: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
              creator: {
                select: {
                  username: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      gender: true,
                      tel: true,
                      email: true,
                      department: true,
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // docexlogs.forEach((log) => {
    //   log.docexternal.docexlogs = log.docexternal.docexlogs[0] || null;
    // });

    // แปลงเวลาเป็น Asia/Vientiane
    const formattedDocs = docexlogs.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
      docexternal: {
        ...doc.docexternal,
        createdAt: moment(doc.docexternal.createdAt)
          .tz("Asia/Vientiane")
          .format(),
        updatedAt: moment(doc.docexternal.updatedAt)
          .tz("Asia/Vientiane")
          .format(),
      },
    }));

    res.json(formattedDocs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
