const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { rolemenuId } = req.query;

    const filter = rolemenuId
      ? { where: { rolemenuId: Number(rolemenuId) } }
      : {};

    const permissions = await prisma.permission.findMany(filter);

    res.json(permissions);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
