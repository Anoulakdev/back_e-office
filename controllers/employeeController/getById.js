const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { emp_code } = req.params;

    const employee = await prisma.employee.findUnique({
      where: {
        emp_code: emp_code,
      },
      include: {
        user: {
          select: {
            username: true,
            status: true,
            employee_code: true,
            employeeId: true,
            rankId: true,
            roleId: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: "employee not found" });
    }

    res.json(employee);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
