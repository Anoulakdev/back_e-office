const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { belongId, name } = req.body;

    // Validate input fields
    if (!belongId) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newOutsider = await prisma.outsider.create({
      data: {
        belongId,
        name,
      },
    });

    res.json({
      message: "outsider created successfully!",
      data: newOutsider,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
