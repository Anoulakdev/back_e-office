const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { docstatusId } = req.params;

    const docstatus = await prisma.docStatus.findUnique({
      where: {
        id: Number(docstatusId),
      },
    });

    if (!docstatus) {
      return res.status(404).json({ message: "docstatus not found" });
    }

    res.json(docstatus);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
