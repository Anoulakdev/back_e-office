const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const doctype = await prisma.docType.findMany();

    res.json(doctype);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
