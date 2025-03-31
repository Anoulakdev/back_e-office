const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { priority_name, priority_code } = req.body;

    // Validate input fields
    if ((!priority_name, !priority_code)) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newPriority = await prisma.priority.create({
      data: {
        priority_name,
        priority_code,
      },
    });

    res.json({
      message: "priority created successfully!",
      data: newPriority,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
