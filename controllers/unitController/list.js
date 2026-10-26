const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { divisionId, officeId } = req.query;

    const filter = {
      include: {
        division: true,
        office: true,
      },
      orderBy: {
        unit_code: "asc",
      },
    };

    if (divisionId || officeId) {
      filter.where = {};
      if (divisionId) filter.where.divisionId = Number(divisionId);
      if (officeId) filter.where.officeId = Number(officeId);
    }

    const unit = await prisma.unit.findMany(filter);

    res.json(unit);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
