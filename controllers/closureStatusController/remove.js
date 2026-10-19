const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { closureId } = req.params;

    if (!closureId) {
      return res.status(400).json({ message: "closureId is required" });
    }

    const removed = await prisma.closureStatus.delete({
      where: {
        id: Number(closureId),
      },
    });

    res.status(200).json({ message: "Closure status deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
