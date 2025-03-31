const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { divisionId } = req.query;
    const filter = divisionId
      ? {
          where: { divisionId: Number(divisionId) },
          include: {
            division: true,
            office: true,
          },
          orderBy: {
            unit_code: "asc",
          },
        }
      : {
          include: {
            division: true,
            office: true,
          },
          orderBy: {
            unit_code: "asc",
          },
        };
    const unit = await prisma.unit.findMany(filter);

    res.json(unit);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
