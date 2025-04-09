const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
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
