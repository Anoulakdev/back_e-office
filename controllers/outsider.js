const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
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

exports.list = async (req, res) => {
  try {
    const { belongId } = req.query;

    const filter = belongId
      ? {
          where: { belongId: Number(belongId) },
          include: {
            belongto: true,
          },
        }
      : {};

    const outsiders = await prisma.outsider.findMany(filter);

    res.json(outsiders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { outsiderId } = req.params;

    const outsider = await prisma.outsider.findUnique({
      where: {
        id: Number(outsiderId),
      },
    });

    if (!outsider) {
      return res.status(404).json({ message: "outsider not found" });
    }

    res.json(outsider);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { outsiderId } = req.params;
    const { belongId, name } = req.body;

    const updated = await prisma.outsider.update({
      where: {
        id: Number(outsiderId),
      },
      data: {
        belongId,
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
    const { outsiderId } = req.params;

    const removed = await prisma.outsider.delete({
      where: {
        id: Number(outsiderId),
      },
    });

    res.status(200).json({ message: "outsider deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
