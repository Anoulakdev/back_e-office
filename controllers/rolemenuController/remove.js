const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { rolemenuId } = req.params;

    const removed = await prisma.roleMenu.delete({
      where: {
        id: Number(rolemenuId),
      },
    });

    res.status(200).json({ message: "rolemenu deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
