const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
  try {
    const { roleId, title, path } = req.body;

    // Validate input fields
    if (!roleId) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newRoleMenu = await prisma.roleMenu.create({
      data: {
        roleId,
        title,
        path,
      },
    });

    res.json({
      message: "Rolemenu created successfully!",
      data: newRoleMenu,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const rolemenus = await prisma.roleMenu.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json(rolemenus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rolemenuId } = req.params;

    const rolemenu = await prisma.roleMenu.findUnique({
      where: {
        id: Number(rolemenuId),
      },
    });

    if (!rolemenu) {
      return res.status(404).json({ message: "role not found" });
    }

    res.json(rolemenu);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { rolemenuId } = req.params;
    const { roleId, title, path } = req.body;

    const updated = await prisma.roleMenu.update({
      where: {
        id: Number(rolemenuId),
      },
      data: {
        roleId,
        title,
        path,
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
    const { rolemenuId } = req.params;

    const removed = await prisma.roleMenu.delete({
      where: {
        id: Number(rolemenuId),
      },
    });

    res.status(200).json({ message: "rolemenu deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
