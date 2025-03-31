const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { poscodeId } = req.params;

    const positionC = await prisma.positionCode.findUnique({
      where: {
        id: Number(poscodeId),
      },
      include: {
        positiongroup: true,
      },
    });

    if (!positionC) {
      return res.status(404).json({ message: "position not found" });
    }

    res.json(positionC);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
