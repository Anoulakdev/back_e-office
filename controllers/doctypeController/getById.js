const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { doctypeId } = req.params;

    const doctype = await prisma.docType.findUnique({
      where: {
        id: Number(doctypeId),
      },
    });

    if (!doctype) {
      return res.status(404).json({ message: "doctype not found" });
    }

    res.json(doctype);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
