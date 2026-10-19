const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { closureId } = req.params;

    if (!closureId) {
      return res.status(400).json({ message: "closureId is required" });
    }

    const closure = await prisma.closureStatus.findUnique({
      where: {
        id: Number(closureId),
      },
    });

    if (!closure) {
      return res.status(404).json({ message: "Closure status not found" });
    }

    res.json(closure);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
