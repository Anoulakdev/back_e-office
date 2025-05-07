const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { userId } = req.params;
    const { employee_code, rankId, roleId } = req.body;

    // Step 1: Find the user to update
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const checkEmp = await prisma.employee.findUnique({
      where: {
        emp_code: employee_code,
      },
    });

    // Step 3: Update the user record
    const updated = await prisma.user.update({
      where: {
        id: Number(userId),
      },
      data: {
        employee_code,
        employeeId: checkEmp ? Number(checkEmp.id) : null,
        rankId: Number(rankId),
        roleId: Number(roleId),
      },
      include: {
        employee: true,
      },
    });

    res.json({ message: "Update successful!", data: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
