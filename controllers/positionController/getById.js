const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { positionId } = req.params;

    const position = await prisma.position.findUnique({
      where: {
        id: Number(positionId),
      },
      include: {
        positioncode: {
          include: {
            positiongroup: true,
          },
        },
      },
    });

    if (!position) {
      return res.status(404).json({ message: "position not found" });
    }

    res.json(position);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
