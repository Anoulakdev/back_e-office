const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const belongto = await prisma.belongTo.findMany();

    res.json(belongto);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
