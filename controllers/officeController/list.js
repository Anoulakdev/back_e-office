const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { divisionId } = req.query;
    const filter = divisionId
      ? {
          where: { divisionId: Number(divisionId) },
          include: {
            division: true,
          },
          orderBy: {
            office_code: "asc",
          },
        }
      : {
          include: {
            division: true,
          },
          orderBy: {
            office_code: "asc",
          },
        };
    const Office = await prisma.office.findMany(filter);
    res.json(Office);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
