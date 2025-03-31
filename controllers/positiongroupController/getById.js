const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
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
