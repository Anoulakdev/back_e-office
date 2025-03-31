const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
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
