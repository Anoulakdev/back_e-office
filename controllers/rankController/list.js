const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const rank = await prisma.rank.findMany();

    res.json(rank);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
