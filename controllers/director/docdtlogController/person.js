const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docdtId, docstatusId } = req.query;
    const docstatus = Number(docstatusId);
    let persons = [];

    if (docstatus === 5 || docstatus === 7) {
      persons = await prisma.docdtLog.findMany({
        where: {
          docdtId: Number(docdtId),
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
      });
    } else if (docstatus === 6 || docstatus === 3) {
      persons = await prisma.docdtLog.findMany({
        where: {
          docdtId: Number(docdtId),
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
      });
    }

    res.json(persons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
