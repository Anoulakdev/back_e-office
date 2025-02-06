const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
  try {
    const { priority_name, priority_code } = req.body;

    // Validate input fields
    if ((!priority_name, !priority_code)) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newPriority = await prisma.priority.create({
      data: {
        priority_name,
        priority_code,
      },
    });

    res.json({
      message: "priority created successfully!",
      data: newPriority,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const priority = await prisma.priority.findMany();

    res.json(priority);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { priorityId } = req.params;

    const priority = await prisma.priority.findUnique({
      where: {
        id: Number(priorityId),
      },
    });

    if (!priority) {
      return res.status(404).json({ message: "priority not found" });
    }

    res.json(priority);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { priorityId } = req.params;
    const { priority_name, priority_code } = req.body;

    const updated = await prisma.priority.update({
      where: {
        id: Number(priorityId),
      },
      data: {
        priority_name: priority_name,
        priority_code: priority_code,
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
    const { priorityId } = req.params;

    const removed = await prisma.priority.delete({
      where: {
        id: Number(priorityId),
      },
    });

    res.status(200).json({ message: "priority deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
