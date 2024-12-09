const prisma = require("../prisma/prisma");

exports.list = async (req, res) => {
  try {
    const positionC = await prisma.positionCode.findMany({
      orderBy: {
        pos_code_id: "asc",
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
    const { positioncode_id } = req.params;

    const positionC = await prisma.positionCode.findUnique({
      where: {
        pos_code_id: Number(positioncode_id),
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
