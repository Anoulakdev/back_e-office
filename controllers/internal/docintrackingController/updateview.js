const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docinId, docstatusId } = req.query;

    const docinIdNum = Number(docinId);
    const docstatusIdNum = Number(docstatusId);

    if (isNaN(docinIdNum) || isNaN(docstatusIdNum)) {
      return res
        .status(400)
        .json({ message: "Invalid docinId or docstatusId" });
    }

    let docintrackings = null;
    let docinlogs = null;

    if (req.user.roleId === 2) {
      docintrackings = await prisma.docinTracking.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          receiver: {
            roleId: 2,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      docinlogs = await prisma.docinLog.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          roleId: 2,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      docintrackings = await prisma.docinTracking.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          receiverCode: req.user.username,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      docinlogs = await prisma.docinLog.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          receiverCode: req.user.username,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let updatedTracking = null;
    let updatedLog = null;

    if (docintrackings) {
      updatedTracking = await prisma.docinTracking.update({
        where: {
          id: docintrackings.id,
        },
        data: {
          viewed: true,
        },
        include: {
          docstatus: true,
          docinternal: {
            include: {
              priority: true,
              doctype: true,
              creator: {
                select: {
                  username: true,
                  rankId: true,
                  roleId: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      status: true,
                      gender: true,
                      tel: true,
                      email: true,
                      empimg: true,
                      posId: true,
                      departmentId: true,
                      divisionId: true,
                      department: true,
                      division: true,
                      office: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          assigner: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                  departmentId: true,
                  divisionId: true,
                  officeId: true,
                  unitId: true,
                },
              },
            },
          },
          receiver: {
            select: {
              username: true,
              roleId: true,
            },
          },
        },
      });
    }

    if (docinlogs) {
      updatedLog = await prisma.docinLog.update({
        where: {
          id: docinlogs.id,
        },
        data: {
          viewed: true,
        },
      });
    }

    res.json({
      message: "Update successful!",
      tracking: updatedTracking,
      log: updatedLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
