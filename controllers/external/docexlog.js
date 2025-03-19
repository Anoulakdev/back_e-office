const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

exports.listdocexternal = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }
    let docexlogs;

    const existingTracking = await prisma.docexTracking.findFirst({
      where: {
        receiverCode: req.user.emp_code,
        OR: [{ docstatusId: 1 }, { docstatusId: 2 }],
      },
      select: {
        docexId: true,
        receiverCode: true,
        docstatusId: true,
      },
    });

    // console.log(existingTracking);

    const existinglog = existingTracking
      ? await prisma.docexLog.findFirst({
          where: {
            docexId: existingTracking.docexId,
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
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                  receiver: {
                    select: {
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
            },
          },
        },
      });
    } else if (req.user.roleId === 6) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...idFilter,
          ...(req.user.rankId !== 1 && { rankId: req.user.rankId }),
          roleId: req.user.roleId,
          departmentId: req.user.departmentId,
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
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                  receiver: {
                    select: {
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
            },
          },
        },
      });
    } else if (req.user.roleId === 7) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...idFilter,
          ...(req.user.rankId !== 1 && { rankId: req.user.rankId }),
          roleId: req.user.roleId,
          divisionId: req.user.divisionId,
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
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                  receiver: {
                    select: {
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
            },
          },
        },
      });
    } else if (req.user.roleId === 8) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...idFilter,
          ...(req.user.rankId !== 1 && { rankId: req.user.rankId }),
          roleId: req.user.roleId,
          officeId: req.user.officeId,
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
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                  receiver: {
                    select: {
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
            },
          },
        },
      });
    } else if (req.user.roleId === 9) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...idFilter,
          rankId: req.user.rankId,
          roleId: req.user.roleId,
          unitId: req.user.unitId,
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
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                  receiver: {
                    select: {
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
            },
          },
        },
      });
    } else if (req.user.roleId === 10) {
      docexlogs = await prisma.docexLog.findMany({
        where: {
          ...idFilter,
          receiverCode: req.user.emp_code,
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
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                  receiver: {
                    select: {
                      first_name: true,
                      last_name: true,
                      gender: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: "desc" },
              },
              priority: true,
              doctype: true,
              outsider: true,
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

exports.gethistory = async (req, res) => {
  try {
    const { docexId } = req.params;

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexId),
      },
      include: {
        docexlogs: {
          include: {
            docstatus: true,
            assigner: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
            receiver: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "document not found" });
    }

    // Format dates
    const formattedDocs = {
      ...docex,
      createdAt: moment(docex.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docex.updatedAt).tz("Asia/Vientiane").format(),
      docexlogs: docex.docexlogs.map((log) => ({
        ...log,
        createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(log.updatedAt).tz("Asia/Vientiane").format(),
      })),
    };

    res.json(formattedDocs);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.gethistory = async (req, res) => {
//   try {
//     const { docexId } = req.params;

//     const docex = await prisma.docexLog.findMany({
//       where: {
//         docexId: Number(docexId),
//       },
//     });

//     if (!docex) {
//       return res.status(404).json({ message: "document not found" });
//     }

//     // Format dates
//     const formattedDocs = {
//       ...docex,
//       createdAt: moment(docex.createdAt).tz("Asia/Vientiane").format(),
//       updatedAt: moment(docex.updatedAt).tz("Asia/Vientiane").format(),
//     };

//     res.json(formattedDocs);
//   } catch (err) {
//     // err
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

exports.person = async (req, res) => {
  try {
    const { docexId, docstatusId } = req.query;
    const docstatus = Number(docstatusId);
    let persons = [];

    if (docstatus === 5 || docstatus === 7) {
      persons = await prisma.docexLog.findMany({
        where: {
          docexId: Number(docexId),
          receiverCode: req.user.emp_code,
          OR: [{ docstatusId: 2 }, { docstatusId: 6 }],
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
        include: {
          assigner: {
            select: {
              gender: true,
              first_name: true,
              last_name: true,
              emp_code: true,
            },
          },
        },
      });
    } else if (docstatus === 6 || docstatus === 3) {
      persons = await prisma.docexLog.findMany({
        where: {
          docexId: Number(docexId),
          receiverCode: req.user.emp_code,
          OR: [{ docstatusId: 5 }, { docstatusId: 7 }],
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
        include: {
          assigner: {
            select: {
              gender: true,
              first_name: true,
              last_name: true,
              emp_code: true,
            },
          },
        },
      });
    }

    res.json(persons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
