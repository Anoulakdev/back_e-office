const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { unitId } = req.params;

    const unit = await prisma.unit.findUnique({
      where: {
        id: Number(unitId),
      },
      include: {
        division: true,
        office: true,
      },
    });

    if (!unit) {
      return res.status(404).json({ message: "unit not found" });
    }

    res.json(unit);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
