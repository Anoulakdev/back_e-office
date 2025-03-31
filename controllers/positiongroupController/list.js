const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
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
