const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { rolemenuId, C, R, U, D } = req.body;

    // Validate input fields
    if (!rolemenuId) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    const checkRolemenu = await prisma.permission.findFirst({
      where: { rolemenuId: Number(rolemenuId) },
    });
    if (checkRolemenu) {
      return res.status(409).json({ message: "rolemenu already exists" });
    }

    // Create new user in the database
    const newPermission = await prisma.permission.create({
      data: {
        rolemenuId,
        C,
        R,
        U,
        D,
      },
    });

    res.json({
      message: "Permission created successfully!",
      data: newPermission,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
