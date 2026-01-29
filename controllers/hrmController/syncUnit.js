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

    // 2. Fetch units
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/unit/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const unitsData = response.data.data;

    if (!Array.isArray(unitsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.unit.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    // const divisions = await prisma.division.findMany({
    //   select: { id: true },
    // });

    // const divisionIds = new Set(divisions.map((d) => d.id));

    // const offices = await prisma.office.findMany({
    //   select: { id: true },
    // });

    // const officeIds = new Set(offices.map((d) => d.id));

    let updated = 0;
    let created = 0;
    // let skipped = 0;

    await Promise.all(
      unitsData.map(async (d) => {
        // if (!divisionIds.has(d.division_id) || !officeIds.has(d.office_id)) {
        //   skipped++;
        //   if (!divisionIds.has(d.division_id)) {
        //     console.warn(
        //       `Skip unit ${d.unit_name} (division ${d.division_id} not found)`,
        //     );
        //   }
        //   if (!officeIds.has(d.office_id)) {
        //     console.warn(
        //       `Skip unit ${d.unit_name} (office ${d.office_id} not found)`,
        //     );
        //   }
        //   return null; // skip unit นี้
        // }

        const isNew = !existingIds.has(d.unit_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.unit.upsert({
          where: { id: d.unit_id },
          update: {
            unit_name: d.unit_name,
            unit_code: d.unit_code,
            unit_status: d.unit_status,
            unit_type: d.unit_type,
            divisionId:
              d.division_id === 0 || d.division_id === null
                ? null
                : d.division_id,
            officeId:
              d.office_id === 0 || d.office_id === null ? null : d.office_id,
          },
          create: {
            id: d.unit_id,
            unit_name: d.unit_name,
            unit_code: d.unit_code,
            unit_status: d.unit_status,
            unit_type: d.unit_type,
            divisionId:
              d.division_id === 0 || d.division_id === null
                ? null
                : d.division_id,
            officeId:
              d.office_id === 0 || d.office_id === null ? null : d.office_id,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: unitsData.length,
      updated,
      created,
      // skipped,
      message: "unit sync completed",
    });
  } catch (err) {
    console.error("Sync unit error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
