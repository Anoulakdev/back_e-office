const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;

    const where =
      selectDateStart && selectDateEnd
        ? {
            createdAt: {
              gte: new Date(`${selectDateStart}T00:00:00+07:00`),
              lte: new Date(`${selectDateEnd}T23:59:59+07:00`),
            },
          }
        : {};

    const baseSelect = {
      id: true,
      assignto: true,
      createdAt: true,
      updatedAt: true,
      creator: {
        select: {
          username: true,
          role: true,
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

    const format = (data) =>
      data.map((item) => ({
        ...item,
        createdAt: moment(item.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(item.updatedAt).tz("Asia/Vientiane").format(),
      }));

    const fetchDocs = (model, extraSelect) =>
      model
        .findMany({
          where,
          orderBy: { createdAt: "asc" },
          select: { ...baseSelect, ...extraSelect },
        })
        .then(format);

    const [Externals, Internals, Directors] = await Promise.all([
      fetchDocs(prisma.docExternal, {
        docex_no: true,
        docex_title: true,
      }),
      fetchDocs(prisma.docInternal, {
        docin_no: true,
        docin_title: true,
      }),
      fetchDocs(prisma.docDirector, {
        docdt_no: true,
        docdt_title: true,
      }),
    ]);

    res.json({ Externals, Internals, Directors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};