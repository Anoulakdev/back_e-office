const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.docdirector = {
        createdAt: {
          gte: new Date(startDate.toISOString()),
          lte: new Date(endDate.toISOString()),
        },
      };
    }
    let docdtlogs;

    const existingTracking = await prisma.docdtTracking.findFirst({
      where: {
        receiverCode: req.user.username,
        OR: [{ docstatusId: 1 }, { docstatusId: 2 }],
      },
      select: {
        docdtId: true,
        receiverCode: true,
        docstatusId: true,
      },
    });

    // console.log(existingTracking);

    const existinglog = existingTracking
      ? await prisma.docdtLog.findFirst({
          where: {
            docdtId: existingTracking.docdtId,
            receiverCode: existingTracking.receiverCode,
            docstatusId: existingTracking.docstatusId,
          },
          select: {
            id: true,
          },
        })
      : null;

    const idFilter = existinglog ? { id: { not: existinglog.id } } : {};

    // console.log(existinglog);

    if (req.user.roleId === 4) {
      docdtlogs = await prisma.docdtLog.findMany({
        where: {
          ...where,
          ...idFilter,
          rankId: req.user.rankId,
          roleId: req.user.roleId,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 11) {
      docdtlogs = await prisma.docdtLog.findMany({
        where: {
          ...where,
          ...idFilter,
          receiverCode: req.user.username,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 6) {
      docdtlogs = await prisma.docdtLog.findMany({
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
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 7) {
      docdtlogs = await prisma.docdtLog.findMany({
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
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 8) {
      docdtlogs = await prisma.docdtLog.findMany({
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
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 9) {
      docdtlogs = await prisma.docdtLog.findMany({
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
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (req.user.roleId === 10) {
      docdtlogs = await prisma.docdtLog.findMany({
        where: {
          ...where,
          ...idFilter,
          receiverCode: req.user.username,
        },
        orderBy: {
          id: "desc",
        },
        distinct: ["docdtId"],
        include: {
          docdirector: {
            include: {
              docdtlogs: {
                select: {
                  docstatus: true,
                  assigner: {
                    select: {
                      username: true,
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
                      username: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // docdtlogs.forEach((log) => {
    //   log.docdirector.docdtlogs = log.docdirector.docdtlogs[0] || null;
    // });

    // แปลงเวลาเป็น Asia/Vientiane
    const formattedDocs = docdtlogs.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
      docdirector: {
        ...doc.docdirector,
        createdAt: moment(doc.docdirector.createdAt)
          .tz("Asia/Vientiane")
          .format(),
        updatedAt: moment(doc.docdirector.updatedAt)
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
