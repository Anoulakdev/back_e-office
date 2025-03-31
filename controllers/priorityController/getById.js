const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { priorityId } = req.params;

    const priority = await prisma.priority.findUnique({
      where: {
        id: Number(priorityId),
      },
    });

    if (!priority) {
      return res.status(404).json({ message: "priority not found" });
    }

    res.json(priority);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
