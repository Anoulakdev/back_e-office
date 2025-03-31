const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docstatusId } = req.params;
    const { docstatus_name } = req.body;

    const updated = await prisma.docStatus.update({
      where: {
        id: Number(docstatusId),
      },
      data: {
        docstatus_name: docstatus_name,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
