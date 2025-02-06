const prisma = require("../prisma/prisma");

exports.list = async (req, res) => {
  try {
    const positionC = await prisma.positionCode.findMany({
      orderBy: {
        id: "asc",
      },
      include: {
        positiongroup: true,
      },
    });

    res.json(positionC);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
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
