const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findUnique({
      where: {
        id: Number(roleId),
      },
    });

    if (!role) {
      return res.status(404).json({ message: "role not found" });
    }

    res.json(role);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
