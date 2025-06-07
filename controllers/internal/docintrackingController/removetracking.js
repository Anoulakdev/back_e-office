const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docinId } = req.params;

    await prisma.docinTracking.deleteMany({
      where: {
        docinId: Number(docinId),
      },
    });

    res.status(200).json({ message: "docinTracking deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
