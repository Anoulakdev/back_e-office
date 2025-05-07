const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docinId, departmentId, divisionId } = req.query;

    const where = {
      docinId: Number(docinId),
    };

    if (departmentId) {
      where.departmentId = Number(departmentId);
    }
    if (divisionId) {
      where.divisionId = Number(divisionId);
    }

    const docin = await prisma.docinLog.findMany({
      where,
      include: {
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
              },
            },
          },
        },
      },
    });

    const formattedDocs = docin.map((doc) => ({
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
