const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { roleId } = req.params;

    const removed = await prisma.role.delete({
      where: {
        id: Number(roleId),
      },
    });

    res.status(200).json({ message: "role deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
