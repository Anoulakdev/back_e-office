const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { officeId } = req.params;

    const office = await prisma.office.findUnique({
      where: {
        id: Number(officeId),
      },
      include: {
        division: true,
      },
    });

    if (!office) {
      return res.status(404).json({ message: "Office not found" });
    }

    res.json(office);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
