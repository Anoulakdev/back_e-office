const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const {
      id,
      first_name,
      last_name,
      emp_code,
      status,
      gender,
      tel,
      email,
      empimg,
      posId,
      departmentId,
      divisionId,
      officeId,
      unitId,
      createdAt,
      updatedAt,
    } = req.body;

    if (!first_name || !last_name || !emp_code) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newEmployee = await prisma.employee.create({
      data: {
        id,
        first_name,
        last_name,
        emp_code,
        status,
        gender,
        tel,
        email,
        empimg: empimg
          ? `https://uat-api.edl.com.la/api_v2/organization-svc/employee/getEmpImg/${emp_code}/${empimg}`
          : null,
        posId: Number(posId) || null,
        departmentId: Number(departmentId) || null,
        divisionId: Number(divisionId) || null,
        officeId: Number(officeId) || null,
        unitId: Number(unitId) || null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
    });

    res.status(201).json({
      message: "Employee created successfully!",
      data: newEmployee,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server Error");
  }
};
