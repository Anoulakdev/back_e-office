const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { search, departmentId, divisionId, officeId, unitId } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        {
          first_name: { contains: search, mode: "insensitive" },
        },
        {
          last_name: { contains: search, mode: "insensitive" },
        },
        {
          emp_code: { contains: search, mode: "insensitive" },
        },
      ];
    }

    if (departmentId) {
      where.departmentId = Number(departmentId);
    }
    if (divisionId) {
      where.divisionId = Number(divisionId);
    }
    if (officeId) {
      where.officeId = Number(officeId);
    }
    if (unitId) {
      where.unitId = Number(unitId);
    }

    const filter = {
      where,
      include: {
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
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
    };

    const employees = await prisma.employee.findMany(filter);

    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
