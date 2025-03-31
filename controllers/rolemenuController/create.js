const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { roleId, title, path } = req.body;

    // Validate input fields
    if (!roleId) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newRoleMenu = await prisma.roleMenu.create({
      data: {
        roleId,
        title,
        path,
      },
    });

    res.json({
      message: "Rolemenu created successfully!",
      data: newRoleMenu,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
