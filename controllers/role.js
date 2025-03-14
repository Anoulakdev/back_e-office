const prisma = require("../prisma/prisma");

exports.create = async (req, res) => {
  try {
    const { role_name, role_code, role_description, authrole } = req.body;

    // Validate input fields
    if (!role_name) {
      return res.status(400).json({ message: "Invalid input fields" });
    }

    // Create new user in the database
    const newRole = await prisma.role.create({
      data: {
        role_name,
        role_code,
        role_description,
        authrole,
      },
    });

    res.json({
      message: "Role created successfully!",
      data: newRole,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json(roles);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findUnique({
      where: {
        id: Number(roleId),
      },
    });

    if (!role) {
      return res.status(404).json({ message: "role not found" });
    }

    res.json(role);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { role_name, role_code, role_description, authrole } = req.body;

    const updated = await prisma.role.update({
      where: {
        id: Number(roleId),
      },
      data: {
        role_name: role_name,
        role_code: role_code,
        role_description: role_description,
        authrole: authrole,
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
    const { roleId } = req.params;

    const removed = await prisma.role.delete({
      where: {
        id: Number(roleId),
      },
    });

    res.status(200).json({ message: "role deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
