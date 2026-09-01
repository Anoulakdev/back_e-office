const prisma = require("../../prisma/prisma");
const axios = require("axios");

module.exports = async (req, res) => {
  try {
    // 1. Login
    const loginResponse = await axios.post(
      `${process.env.URL_API}/auth-svc/auth/login`,
      {
        username: process.env.USERNAME_API,
        password: process.env.PASSWORD_API,
      },
    );

    const token = loginResponse?.data?.data?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Cannot get access token",
      });
    }

    // รับค่าจาก body
    const { department_id } = req.body;

    // validate
    if (department_id && isNaN(Number(department_id))) {
      return res.status(400).json({
        success: false,
        message: "department_id must be number",
      });
    }

    const params = new URLSearchParams();
    if (department_id) {
      params.append("department_id", department_id);
    }

    // 2. Fetch employees
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/employee/get?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const employeesData = Array.isArray(response.data?.data?.employees)
      ? response.data.data.employees
      : Array.isArray(response.data?.data)
      ? response.data.data
      : null;

    if (!Array.isArray(employeesData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee data format",
      });
    }

    // 3. Upsert
    const [existing, positions, departments, divisions, offices, units] =
      await Promise.all([
        prisma.employee.findMany({ select: { id: true } }),
        prisma.position.findMany({ select: { id: true } }),
        prisma.department.findMany({ select: { id: true } }),
        prisma.division.findMany({ select: { id: true } }),
        prisma.office.findMany({ select: { id: true } }),
        prisma.unit.findMany({ select: { id: true } }),
      ]);

    const existingIds = new Set(existing.map((d) => d.id));
    const positionIds = new Set(positions.map((p) => p.id));
    const departmentIds = new Set(departments.map((d) => d.id));
    const divisionIds = new Set(divisions.map((d) => d.id));
    const officeIds = new Set(offices.map((o) => o.id));
    const unitIds = new Set(units.map((u) => u.id));

    let updated = 0;
    let created = 0;
    let skipped = 0;

    await Promise.all(
      employeesData.map(async (d) => {
        const empId = Number(d.emp_id);
        if (!empId) {
          skipped++;
          return null;
        }

        const isNew = !existingIds.has(empId);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        const rawPosId = Number(d.office?.pos_id);
        const rawDepId = Number(d.office?.department_id);
        const rawDivId = Number(d.office?.division_id);
        const rawOffId = Number(d.office?.office_id);
        const rawUnitId = Number(d.office?.unit_id);

        const posId = rawPosId && positionIds.has(rawPosId) ? rawPosId : null;
        const departmentId =
          rawDepId && departmentIds.has(rawDepId) ? rawDepId : null;
        const divisionId =
          rawDivId && divisionIds.has(rawDivId) ? rawDivId : null;
        const officeId =
          rawOffId && officeIds.has(rawOffId) ? rawOffId : null;
        const unitId =
          rawUnitId && unitIds.has(rawUnitId) ? rawUnitId : null;

        const gender = d.gender === "Female" ? "Female" : "Male";

        return prisma.employee.upsert({
          where: { id: empId },
          update: {
            first_name: d.first_name_la,
            last_name: d.last_name_la,
            emp_code: d.emp_code,
            status: d.status,
            gender: gender,
            posId: posId,
            departmentId: departmentId,
            divisionId: divisionId,
            officeId: officeId,
            unitId: unitId,
            tel: d.phone || null,
            email: d.email || null,
            empimg: d.image
              ? `${process.env.URL_API}/organization-svc/employee/getEmpImg/${d.emp_code}/${d.image}`
              : null,
            createdAt: d.created_at ? new Date(d.created_at) : new Date(),
            updatedAt: d.created_at ? new Date(d.created_at) : new Date(),
          },
          create: {
            id: empId,
            first_name: d.first_name_la,
            last_name: d.last_name_la,
            emp_code: d.emp_code,
            status: d.status,
            gender: gender,
            posId: posId,
            departmentId: departmentId,
            divisionId: divisionId,
            officeId: officeId,
            unitId: unitId,
            tel: d.phone || null,
            email: d.email || null,
            empimg: d.image
              ? `${process.env.URL_API}/organization-svc/employee/getEmpImg/${d.emp_code}/${d.image}`
              : null,
            createdAt: d.created_at ? new Date(d.created_at) : new Date(),
            updatedAt: d.created_at ? new Date(d.created_at) : new Date(),
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: employeesData.length,
      updated,
      created,
      skipped,
      message: "employee sync completed",
    });
  } catch (err) {
    console.error("Sync employee error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
