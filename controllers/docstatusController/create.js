const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { docstatus_name } = req.body;

    // Validate input fields
    if (!docstatus_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newDocstatus = await prisma.docStatus.create({
      data: {
        docstatus_name,
      },
    });

    res.json({
      message: "docstatus created successfully!",
      data: newDocstatus,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
