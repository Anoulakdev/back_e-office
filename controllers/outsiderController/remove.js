const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { outsiderId } = req.params;

    const removed = await prisma.outsider.delete({
      where: {
        id: Number(outsiderId),
      },
    });

    res.status(200).json({ message: "outsider deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
