const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
  try {
    const { rolemenuId, C, R, U, D } = req.body;

    // Validate input fields
    if (!rolemenuId) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newPermission = await prisma.permission.create({
      data: {
        rolemenuId,
        C,
        R,
        U,
        D,
      },
    });

    res.json({
      message: "Permission created successfully!",
      data: newPermission,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();

    res.json(permissions);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { permissionId } = req.params;

    const permission = await prisma.permission.findUnique({
      where: {
        id: Number(permissionId),
      },
    });

    if (!permission) {
      return res.status(404).json({ message: "permission not found" });
    }

    res.json(permission);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { rolemenuId, C, R, U, D } = req.body;

    const updated = await prisma.permission.update({
      where: {
        id: Number(permissionId),
      },
      data: {
        rolemenuId,
        C,
        R,
        U,
        D,
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
    const { permissionId } = req.params;

    const removed = await prisma.permission.delete({
      where: {
        id: Number(permissionId),
      },
    });

    res.status(200).json({ message: "permission deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
