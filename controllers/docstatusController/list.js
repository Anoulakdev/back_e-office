const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const docstatus = await prisma.docStatus.findMany();

    res.json(docstatus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
