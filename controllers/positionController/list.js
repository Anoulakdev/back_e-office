const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const position = await prisma.position.findMany({
      orderBy: {
        poscodeId: "asc",
      },
      include: {
        positioncode: {
          include: {
            positiongroup: true,
          },
        },
      },
    });

    res.json(position);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
