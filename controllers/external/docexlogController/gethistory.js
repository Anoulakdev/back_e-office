const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
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
