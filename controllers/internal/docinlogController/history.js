const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
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
        receiver: {
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
