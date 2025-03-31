const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { divisionId } = req.params;

    const division = await prisma.division.findUnique({
      where: {
        id: Number(divisionId),
      },
      include: {
        department: true,
      },
    });

    if (!division) {
      return res.status(404).json({ message: "Division not found" });
    }

    res.json(division);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
