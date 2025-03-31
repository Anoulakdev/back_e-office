const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { rolemenuId, C, R, U, D } = req.body;

    const updated = await prisma.permission.update({
      where: {
        id: Number(permissionId),
      },
      data: {
        rolemenuId,
        C,
        R,
        U,
        D,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
