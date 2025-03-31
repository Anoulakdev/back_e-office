const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { permissionId } = req.params;

    const permission = await prisma.permission.findUnique({
      where: {
        id: Number(permissionId),
      },
    });

    if (!permission) {
      return res.status(404).json({ message: "permission not found" });
    }

    res.json(permission);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
