const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const priority = await prisma.priority.findMany();

    res.json(priority);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
