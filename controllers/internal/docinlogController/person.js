const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docinId, docstatusId } = req.query;
    const docstatus = Number(docstatusId);
    let persons = [];

    const docin = await prisma.docInternal.findUnique({
      where: {
        id: Number(docinId),
      },
    });

    if (docstatus === 5 || docstatus === 7) {
      persons = await prisma.docinLog.findMany({
        where: {
          docinId: Number(docinId),
          receiverCode: req.user.username,
          OR: [{ docstatusId: 2 }, { docstatusId: 6 }],
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
        include: {
          assigner: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
            },
          },
        },
      });
    } else if (docstatus === 6 || docstatus === 3) {
      persons = await prisma.docinLog.findMany({
        where: {
          docinId: Number(docinId),
          receiverCode: req.user.username,
          OR: [{ docstatusId: 5 }, { docstatusId: 7 }],
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
        include: {
          assigner: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
            },
          },
        },
      });
    } else if (docstatus === 11) {
      persons = await prisma.docinLog.findMany({
        where: {
          docinId: Number(docinId),
          receiverCode: req.user.username,
          docstatusId: 12,
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
        include: {
          assigner: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
            },
          },
        },
      });
    } else if (docstatus === 12) {
      persons = await prisma.docinLog.findMany({
        where: {
          docinId: Number(docinId),
          receiverCode: req.user.username,
          docstatusId: 11,
        },
        orderBy: {
          id: "desc",
        },
        take: 1,
        include: {
          assigner: {
            select: {
              username: true,
              name: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
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
