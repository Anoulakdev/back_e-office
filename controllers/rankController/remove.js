const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { rankId } = req.params;

    const removed = await prisma.rank.delete({
      where: {
        id: Number(rankId),
      },
    });

    res.status(200).json({ message: "rank deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
