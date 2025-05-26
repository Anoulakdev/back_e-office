const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { search, selectDateStart, selectDateEnd } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { export_no: { contains: search, mode: "insensitive" } },
        { export_text: { contains: search, mode: "insensitive" } },
        { export_title: { contains: search, mode: "insensitive" } },
        { export_description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    const docexports = await prisma.docExport.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        docexternal: {
          include: {
            docexlogs: {
              where: {
                docstatusId: 10,
              },
              include: {
                docstatus: true,
              },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
            priority: true,
            doctype: true,
            outsider: {
              include: {
                belongto: true,
              },
            },
          },
        },
        signator: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                emp_code: true,
                gender: true,
                tel: true,
                email: true,
                position: true,
              },
            },
          },
        },
        exporter: {
          select: {
            username: true,
            employee: {
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

    // Format dates
    const formattedDocs = docexports.map((doc) => ({
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
