const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input fields
    if (!name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newBelongTo = await prisma.belongTo.create({
      data: {
        name,
      },
    });

    res.json({
      message: "belongTo created successfully!",
      data: newBelongTo,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
