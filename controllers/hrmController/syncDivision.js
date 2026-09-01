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

    // 2. Fetch divisions
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/division/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const divisionsData = response.data.data;

    if (!Array.isArray(divisionsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid division data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.division.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    const departments = await prisma.department.findMany({
      select: { id: true },
    });

    const departmentIds = new Set(departments.map((d) => d.id));

    let updated = 0;
    let created = 0;
    let skipped = 0;

    await Promise.all(
      divisionsData.map(async (d) => {
        const divisionId = Number(d.division_id);
        const departmentId = Number(d.department_id);

        if (!divisionId || !departmentId || !departmentIds.has(departmentId)) {
          skipped++;
          return null;
        }

        const isNew = !existingIds.has(divisionId);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        const branchId = d.branch?.branch_id ? Number(d.branch.branch_id) : null;

        return prisma.division.upsert({
          where: { id: divisionId },
          update: {
            division_name: d.division_name,
            division_code: d.division_code,
            division_status: d.division_status,
            branch_id: branchId,
            departmentId: departmentId,
            short_name: d.short_name,
            insur_code: d.insur_code,
          },
          create: {
            id: divisionId,
            division_name: d.division_name,
            division_code: d.division_code,
            division_status: d.division_status,
            branch_id: branchId,
            departmentId: departmentId,
            short_name: d.short_name,
            insur_code: d.insur_code,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: divisionsData.length,
      updated,
      created,
      skipped,
      message: "division sync completed",
    });
  } catch (err) {
    console.error("Sync division error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
