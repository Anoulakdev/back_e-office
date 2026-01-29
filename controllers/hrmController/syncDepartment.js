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

    // 2. Fetch departments
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/department/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const departmentsData = response.data.data;

    if (!Array.isArray(departmentsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.department.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    let updated = 0;
    let created = 0;

    await Promise.all(
      departmentsData.map(async (d) => {
        const isNew = !existingIds.has(d.department_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.department.upsert({
          where: { id: d.department_id },
          update: {
            department_name: d.department_name,
            department_code: d.department_code,
            department_status: d.department_status,
          },
          create: {
            id: d.department_id,
            department_name: d.department_name,
            department_code: d.department_code,
            department_status: d.department_status,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: departmentsData.length,
      updated,
      created,
      message: "Department sync completed",
    });
  } catch (err) {
    console.error("Sync department error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
