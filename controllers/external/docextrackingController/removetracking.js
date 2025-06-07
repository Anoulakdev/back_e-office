const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docexId } = req.params;

    await prisma.docexTracking.deleteMany({
      where: {
        docexId: Number(docexId),
      },
    });

    res.status(200).json({ message: "docexTracking deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
