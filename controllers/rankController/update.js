const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { rankId } = req.params;
    const { rank_name } = req.body;

    const updated = await prisma.rank.update({
      where: {
        id: Number(rankId),
      },
      data: {
        rank_name: rank_name,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
