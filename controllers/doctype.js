const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
  try {
    const { doctype_name } = req.body;

    // Validate input fields
    if (!doctype_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newDoctype = await prisma.docType.create({
      data: {
        doctype_name,
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

exports.list = async (req, res) => {
  try {
    const doctype = await prisma.docType.findMany();

    res.json(doctype);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { doctypeId } = req.params;

    const doctype = await prisma.docType.findUnique({
      where: {
        id: Number(doctypeId),
      },
    });

    if (!doctype) {
      return res.status(404).json({ message: "doctype not found" });
    }

    res.json(doctype);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { doctypeId } = req.params;
    const { doctype_name } = req.body;

    const updated = await prisma.docType.update({
      where: {
        id: Number(doctypeId),
      },
      data: {
        doctype_name: doctype_name,
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
    const { doctypeId } = req.params;

    const removed = await prisma.docType.delete({
      where: {
        id: Number(doctypeId),
      },
    });

    res.status(200).json({ message: "doctype deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
