const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input fields
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    // Create new ClosureStatus in the database
    const newClosure = await prisma.closureStatus.create({
      data: {
        name,
      },
    });

    res.json({
      message: "Closure status created successfully!",
      data: newClosure,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
