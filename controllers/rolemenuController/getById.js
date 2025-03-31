const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { rolemenuId } = req.params;

    const rolemenu = await prisma.roleMenu.findUnique({
      where: {
        id: Number(rolemenuId),
      },
    });

    if (!rolemenu) {
      return res.status(404).json({ message: "role not found" });
    }

    res.json(rolemenu);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
