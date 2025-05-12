const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { doctype_name, soptype, actionMax, followMax } = req.body;

    // Validate input fields
    if (!doctype_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newDoctype = await prisma.docType.create({
      data: {
        doctype_name,
        soptype,
        actionMax,
        followMax,
      },
    });

    res.json({
      message: "doctype created successfully!",
      data: newDoctype,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
