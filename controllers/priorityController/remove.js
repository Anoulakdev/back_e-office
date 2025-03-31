const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { priorityId } = req.params;

    const removed = await prisma.priority.delete({
      where: {
        id: Number(priorityId),
      },
    });

    res.status(200).json({ message: "priority deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
