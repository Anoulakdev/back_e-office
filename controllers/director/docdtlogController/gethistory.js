const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docdtId } = req.params;

    const docdt = await prisma.docDirector.findUnique({
      where: {
        id: Number(docdtId),
      },
      include: {
        docdtlogs: {
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

    if (!docdt) {
      return res.status(404).json({ message: "document not found" });
    }

    // Format dates
    const formattedDocs = {
      ...docdt,
      createdAt: moment(docdt.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docdt.updatedAt).tz("Asia/Vientiane").format(),
      docdtlogs: docdt.docdtlogs.map((log) => ({
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
