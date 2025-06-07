const prisma = require("../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { emp_code } = req.params;
    const {
      id,
      first_name,
      last_name,
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

    // Step 1: Find the user to update
    const employee = await prisma.employee.findUnique({
      where: {
        emp_code: emp_code,
      },
    });

    if (!employee) {
      return res.status(404).json({ message: "employee not found" });
    }

    // Step 3: Update the employee record
    const updated = await prisma.employee.update({
      where: {
        emp_code: emp_code,
      },
      data: {
        id,
        first_name,
        last_name,
        status,
        gender,
        tel,
        email,
        empimg: empimg
          ? `https://uat-api.edl.com.la/api_v2/organization-svc/employee/getEmpImg/${emp_code}/${empimg}`
          : null,
        posId: posId ? Number(posId) : null,
        departmentId: departmentId ? Number(departmentId) : null,
        divisionId: divisionId ? Number(divisionId) : null,
        officeId: officeId ? Number(officeId) : null,
        unitId: unitId ? Number(unitId) : null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
    });

    res.json({ message: "Update successful!", data: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
