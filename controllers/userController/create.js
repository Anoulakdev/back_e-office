const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");

module.exports = async (req, res) => {
  try {
    const { username, employee_code, rankId, roleId } = req.body;

    // Step 1: Validate input fields
    if (!username) {
      return res.status(400).json({ message: "Missing required username" });
    }

    if (!roleId) {
      return res.status(400).json({ message: "Missing required roleId" });
    }

    // Step 2: Check if the username already exists
    const checkUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    if (checkUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const checkEmp = await prisma.employee.findUnique({
      where: {
        emp_code: employee_code,
      },
    });

    // Step 3: Hash default password (you might want to allow password as input)
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("EDL1234", salt);

    const maxId = await prisma.user.aggregate({
      _max: { id: true },
    });

    const nextId = (maxId._max.id || 0) + 1;

    // Step 4: Create new user
    const newUser = await prisma.user.create({
      data: {
        id: nextId,
        username: username,
        password: hashPassword,
        employee_code,
        employeeId: checkEmp ? Number(checkEmp.id) : null,
        rankId: rankId ? Number(rankId) : null,
        roleId: roleId ? Number(roleId) : null,
      },
      include: {
        employee: true,
      },
    });

    res.status(201).json({
      message: "User created successfully!",
      data: newUser,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server Error");
  }
};
