const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { belongId } = req.params;
    const { name } = req.body;

    const updated = await prisma.belongTo.update({
      where: {
        id: Number(belongId),
      },
      data: {
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
