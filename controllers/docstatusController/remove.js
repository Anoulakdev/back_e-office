const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docstatusId } = req.params;

    const removed = await prisma.docStatus.delete({
      where: {
        id: Number(docstatusId),
      },
    });

    res.status(200).json({ message: "docstatus deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
