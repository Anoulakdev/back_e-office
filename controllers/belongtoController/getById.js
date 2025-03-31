const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { belongId } = req.params;

    const belongto = await prisma.belongTo.findUnique({
      where: {
        id: Number(belongId),
      },
    });

    if (!belongto) {
      return res.status(404).json({ message: "belongto not found" });
    }

    res.json(belongto);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
