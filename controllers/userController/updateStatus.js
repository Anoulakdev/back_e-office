const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Step 1: Find the user to update
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { status },
    });

    res.json({ message: "Update successful!", data: updatedUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
