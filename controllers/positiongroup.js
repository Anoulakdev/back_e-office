const prisma = require("../prisma/prisma");

exports.list = async (req, res) => {
  try {
    const positionG = await prisma.positionGroup.findMany({
      orderBy: {
        id: "asc",
      },
      include: {
        positioncodes: {
          include: {
            positions: true,
          },
        },
      },
    });

    res.json(positionG);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { posgroudId } = req.params;

    const positionG = await prisma.positionGroup.findUnique({
      where: {
        id: Number(posgroudId),
      },
      include: {
        positioncodes: {
          include: {
            positions: true,
          },
        },
      },
    });

    if (!positionG) {
      return res.status(404).json({ message: "position not found" });
    }

    res.json(positionG);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
