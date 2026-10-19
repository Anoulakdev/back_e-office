const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { closureId } = req.params;
    const { name } = req.body;

    if (!closureId) {
      return res.status(400).json({ message: "closureId is required" });
    }

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const updated = await prisma.closureStatus.update({
      where: {
        id: Number(closureId),
      },
      data: {
        name,
      },
    });

    res.json({ message: "Updated Success!!", data: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
