const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

const formatDates = (items) =>
  items.map((item) => ({
    ...item,
    createdAt: moment(item.createdAt).tz("Asia/Vientiane").format(),
    updatedAt: moment(item.updatedAt).tz("Asia/Vientiane").format(),
  }));

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;

    const where = {};
    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);
      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    const commonSelect = {
      id: true,
      assignto: true,
      createdAt: true,
      updatedAt: true,
      creator: {
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
    };

    const [docexternals, docinternals, docdirectors] =
      await prisma.$transaction([
        prisma.docExternal.findMany({
          where,
          orderBy: { createdAt: "asc" },
          select: {
            ...commonSelect,
            docex_no: true,
            docex_title: true,
          },
        }),
        prisma.docInternal.findMany({
          where,
          orderBy: { createdAt: "asc" },
          select: {
            ...commonSelect,
            docin_no: true,
            docin_title: true,
          },
        }),
        prisma.docDirector.findMany({
          where,
          orderBy: { createdAt: "asc" },
          select: {
            ...commonSelect,
            docdt_no: true,
            docdt_title: true,
          },
        }),
      ]);

    res.json({
      Externals: formatDates(docexternals),
      Internals: formatDates(docinternals),
      Directors: formatDates(docdirectors),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
