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
    } else if (req.user.roleId === 11) {
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

exports.person = async (req, res) => {
  try {
    const { docexId, docstatusId } = req.query;
    const docstatus = Number(docstatusId);
    let persons = [];

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexId),
      },
    });

    if (docex.extype === 1) {
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
    } else if (docex.extype === 2) {
      if (docstatus === 1 || docstatus === 2 || docstatus === 10) {
        persons = await prisma.docexLog.findMany({
          where: {
            docexId: Number(docexId),
            receiverCode: req.user.emp_code,
            OR: [{ docstatusId: 3 }],
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
      } else if (docstatus === 3) {
        persons = await prisma.docexLog.findMany({
          where: {
            docexId: Number(docexId),
            receiverCode: req.user.emp_code,
            OR: [{ docstatusId: 1 }, { docstatusId: 2 }, { docstatusId: 10 }],
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
    }

    res.json(persons);
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

exports.history = async (req, res) => {
  try {
    const { docexId, departmentId, divisionId } = req.query;

    const where = {
      docexId: Number(docexId),
    };

    if (departmentId) {
      where.departmentId = Number(departmentId);
    }
    if (divisionId) {
      where.divisionId = Number(divisionId);
    }

    const docex = await prisma.docexLog.findMany({
      where,
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
    });

    const formattedDocs = docex.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedDocs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.gethistoryall = async (req, res) => {
  try {
    const { docexId } = req.params;

    // Validate docexId is a number
    if (isNaN(Number(docexId))) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const docexlogs = await prisma.docexLog.findMany({
      where: {
        docexId: Number(docexId),
      },
      orderBy: [
        { receiver: { department: { id: "desc" } } },
        { createdAt: "asc" },
        // { departmentactive: "asc" }
      ],
      include: {
        docstatus: true,
        assigner: {
          select: {
            first_name: true,
            last_name: true,
            gender: true,
            department: {
              select: { id: true, department_name: true },
            },
            division: {
              select: { id: true, division_name: true },
            },
          },
        },
        receiver: {
          select: {
            first_name: true,
            last_name: true,
            gender: true,
            department: {
              select: { id: true, department_name: true },
            },
            division: {
              select: { id: true, division_name: true },
            },
          },
        },
      },
    });

    if (!docexlogs.length) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Group data by department and division
    const groupedData = docexlogs.reduce((acc, log) => {
      // Determine department info (prefer receiver over assigner)
      const deptInfo = log.receiver?.department || log.assigner?.department;
      const divisionInfo = log.receiver?.division || log.assigner?.division;

      const deptId = deptInfo?.id || "Unknown";
      const deptName = deptInfo?.department_name || "Unknown";
      const divisionName = divisionInfo?.division_name || "Unknown";

      // Find or create department group
      let departmentGroup = acc.find((d) => d.departmentId === deptId);
      if (!departmentGroup) {
        departmentGroup = {
          departmentId: deptId,
          department_name: deptName,
          ...(deptId === 15 ? { logs: [] } : { divisions: [] }),
        };
        acc.push(departmentGroup);
      }

      // Format log entry
      const formattedLog = {
        ...log,
        createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(log.updatedAt).tz("Asia/Vientiane").format(),
      };

      // Handle department 15 (special case) or other departments
      if (deptId === 15) {
        departmentGroup.logs.push(formattedLog);
      } else {
        // Find or create division group
        let divisionGroup = departmentGroup.divisions.find(
          (d) => d.division_name === divisionName
        );

        if (!divisionGroup) {
          divisionGroup = {
            division_name: divisionName,
            logs: [],
          };
          departmentGroup.divisions.push(divisionGroup);
        }

        divisionGroup.logs.push(formattedLog);
      }

      return acc;
    }, []);

    res.json({ groupedLogs: groupedData });
  } catch (err) {
    console.error("Error in gethistory:", err);
    res.status(500).json({
      message: "Server Error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};
