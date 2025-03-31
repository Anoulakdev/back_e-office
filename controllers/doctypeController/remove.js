const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { doctypeId } = req.params;

    const removed = await prisma.docType.delete({
      where: {
        id: Number(doctypeId),
      },
    });

    res.status(200).json({ message: "doctype deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
