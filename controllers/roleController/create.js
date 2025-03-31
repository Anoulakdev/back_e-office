const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { role_name, role_code, role_description, authrole } = req.body;

    // Validate input fields
    if (!role_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newRole = await prisma.role.create({
      data: {
        role_name,
        role_code,
        role_description,
        authrole,
      },
    });

    res.json({
      message: "Role created successfully!",
      data: newRole,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
