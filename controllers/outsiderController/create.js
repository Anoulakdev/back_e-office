const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { belongId, name } = req.body;

    // Validate input fields
    if (!belongId) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    const checkOutsider = await prisma.outsider.findFirst({
      where: {
        belongId: Number(belongId),
        name: name,
      },
    });
    if (checkOutsider) {
      return res.status(409).json({ message: "Outsider already exists" });
    }

    // Create new user in the database
    const newOutsider = await prisma.outsider.create({
      data: {
        belongId: Number(belongId),
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
