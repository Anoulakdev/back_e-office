const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { outsiderId } = req.params;

    const outsider = await prisma.outsider.findUnique({
      where: {
        id: Number(outsiderId),
      },
    });

    if (!outsider) {
      return res.status(404).json({ message: "outsider not found" });
    }

    res.json(outsider);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
