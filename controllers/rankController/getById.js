const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { rankId } = req.params;

    const rank = await prisma.rank.findUnique({
      where: {
        id: Number(rankId),
      },
    });

    if (!rank) {
      return res.status(404).json({ message: "rank not found" });
    }

    res.json(rank);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
