const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
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

exports.list = async (req, res) => {
  try {
    const belongto = await prisma.belongTo.findMany();

    res.json(belongto);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { belongId } = req.params;

    const belongto = await prisma.belongTo.findUnique({
      where: {
        id: Number(belongId),
      },
    });

    if (!belongto) {
      return res.status(404).json({ message: "belongto not found" });
    }

    res.json(belongto);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { belongId } = req.params;
    const { name } = req.body;

    const updated = await prisma.belongTo.update({
      where: {
        id: Number(belongId),
      },
      data: {
        name,
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
    const { belongId } = req.params;

    const removed = await prisma.belongTo.delete({
      where: {
        id: Number(belongId),
      },
    });

    res.status(200).json({ message: "belongto deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
