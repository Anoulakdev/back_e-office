const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docinId } = req.params;

    const docin = await prisma.docInternal.findUnique({
      where: {
        id: Number(docinId),
      },
      include: {
        docinlogs: {
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
        },
      },
    });

    if (!docin) {
      return res.status(404).json({ message: "document not found" });
    }

    // Format dates
    const formattedDocs = {
      ...docin,
      createdAt: moment(docin.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docin.updatedAt).tz("Asia/Vientiane").format(),
      docinlogs: docin.docinlogs.map((log) => ({
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
