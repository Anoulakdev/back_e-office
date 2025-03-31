const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { permissionId } = req.params;

    const removed = await prisma.permission.delete({
      where: {
        id: Number(permissionId),
      },
    });

    res.status(200).json({ message: "permission deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
