const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { rank_name } = req.body;

    // Validate input fields
    if (!rank_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newrank = await prisma.rank.create({
      data: {
        rank_name,
      },
    });

    res.json({
      message: "rank created successfully!",
      data: newrank,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
