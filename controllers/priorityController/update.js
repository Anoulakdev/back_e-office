const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { priorityId } = req.params;
    const { priority_name, priority_code } = req.body;

    const updated = await prisma.priority.update({
      where: {
        id: Number(priorityId),
      },
      data: {
        priority_name: priority_name,
        priority_code: priority_code,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
