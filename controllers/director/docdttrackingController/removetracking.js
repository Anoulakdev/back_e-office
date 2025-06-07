const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docdtId } = req.params;

    await prisma.docdtTracking.deleteMany({
      where: {
        docdtId: Number(docdtId),
      },
    });

    res.status(200).json({ message: "docdtTracking deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
