const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
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

exports.list = async (req, res) => {
  try {
    const docstatus = await prisma.docStatus.findMany();

    res.json(docstatus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { docstatusId } = req.params;

    const docstatus = await prisma.docStatus.findUnique({
      where: {
        id: Number(docstatusId),
      },
    });

    if (!docstatus) {
      return res.status(404).json({ message: "docstatus not found" });
    }

    res.json(docstatus);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { docstatusId } = req.params;
    const { docstatus_name } = req.body;

    const updated = await prisma.docStatus.update({
      where: {
        id: Number(docstatusId),
      },
      data: {
        docstatus_name: docstatus_name,
      },
    });

    res.json({ message: "Updated Success!! ", data: updated });
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { docstatusId } = req.params;

    const removed = await prisma.docStatus.delete({
      where: {
        id: Number(docstatusId),
      },
    });

    res.status(200).json({ message: "docstatus deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
