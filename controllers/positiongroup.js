const prisma = require("../prisma/prisma");

exports.list = async (req, res) => {
  try {
    const positionG = await prisma.positionGroup.findMany({
      orderBy: {
        pos_group_id: "asc",
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
    const { positiongroud_id } = req.params;

    const positionG = await prisma.positionGroup.findUnique({
      where: {
        pos_group_id: Number(positiongroud_id),
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
