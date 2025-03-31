const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { outsiderId } = req.params;
    const { belongId, name } = req.body;

    const updated = await prisma.outsider.update({
      where: {
        id: Number(outsiderId),
      },
      data: {
        belongId,
        name,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
