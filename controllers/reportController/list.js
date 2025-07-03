const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;

    let where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    const docexternals = await prisma.docExternal.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        docex_no: true,
        docex_title: true,
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
      },
    });

    const formattedDocexternal = docexternals.map((docex) => ({
      ...docex,
      createdAt: moment(docex.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docex.updatedAt).tz("Asia/Vientiane").format(),
    }));

    const docinternals = await prisma.docInternal.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        docin_no: true,
        docin_title: true,
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
      },
    });

    const formattedDocInternal = docinternals.map((docin) => ({
      ...docin,
      createdAt: moment(docin.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docin.updatedAt).tz("Asia/Vientiane").format(),
    }));

    const docdirectors = await prisma.docDirector.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        docdt_no: true,
        docdt_title: true,
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
      },
    });

    const formattedDocDirector = docdirectors.map((docdt) => ({
      ...docdt,
      createdAt: moment(docdt.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docdt.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json({
      Externals: formattedDocexternal,
      Internals: formattedDocInternal,
      Directors: formattedDocDirector,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
