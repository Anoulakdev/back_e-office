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

    const employeesData = response.data.data.employees;

    if (!Array.isArray(employeesData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.employee.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    let updated = 0;
    let created = 0;

    await Promise.all(
      employeesData.map(async (d) => {
        const isNew = !existingIds.has(d.emp_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.employee.upsert({
          where: { id: d.emp_id },
          update: {
            first_name: d.first_name_la,
            last_name: d.last_name_la,
            emp_code: d.emp_code,
            status: d.status,
            gender: d.gender,
            posId: Number(d.office?.pos_id) || null,
            departmentId: Number(d.office?.department_id) || null,
            divisionId: Number(d.office?.division_id) || null,
            officeId:
              d.office?.office_id && d.office.office_id !== 0
                ? d.office.office_id
                : null,
            unitId:
              d.office?.unit_id && d.office.unit_id !== 0
                ? d.office.unit_id
                : null,
            tel: d.phone || null,
            email: d.email || null,
            empimg: d.image
              ? `${process.env.URL_API}/organization-svc/employee/getEmpImg/${d.emp_code}/${d.image}`
              : null,
            createdAt: d.created_at ? new Date(d.created_at) : new Date(),
            updatedAt: d.created_at ? new Date(d.created_at) : new Date(),
          },
          create: {
            id: d.emp_id,
            first_name: d.first_name_la,
            last_name: d.last_name_la,
            emp_code: d.emp_code,
            status: d.status,
            gender: d.gender,
            posId: Number(d.office?.pos_id) || null,
            departmentId: Number(d.office?.department_id) || null,
            divisionId: Number(d.office?.division_id) || null,
            officeId:
              d.office?.office_id && d.office.office_id !== 0
                ? d.office.office_id
                : null,
            unitId:
              d.office?.unit_id && d.office.unit_id !== 0
                ? d.office.unit_id
                : null,
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
