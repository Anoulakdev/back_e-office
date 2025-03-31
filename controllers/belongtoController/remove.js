const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { belongId } = req.params;

    const removed = await prisma.belongTo.delete({
      where: {
        id: Number(belongId),
      },
    });

    res.status(200).json({ message: "belongto deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
