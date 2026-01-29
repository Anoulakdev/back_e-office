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

    // 2. Fetch offices
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/office/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const officesData = response.data.data;

    if (!Array.isArray(officesData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid office data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.office.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    // const divisions = await prisma.division.findMany({
    //   select: { id: true },
    // });

    // const divisionIds = new Set(divisions.map((d) => d.id));

    let updated = 0;
    let created = 0;
    // let skipped = 0;

    await Promise.all(
      officesData.map(async (d) => {
        // if (!divisionIds.has(d.division_id)) {
        //   skipped++;
        //   console.warn(
        //     `Skip office ${d.office_name} (division ${d.division_id} not found)`,
        //   );
        //   return null;
        // }

        const isNew = !existingIds.has(d.office_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.office.upsert({
          where: { id: d.office_id },
          update: {
            office_name: d.office_name,
            office_code: d.office_code,
            office_status: d.office_status,
            divisionId:
              d.division_id === 0 || d.division_id === null
                ? null
                : d.division_id,
          },
          create: {
            id: d.office_id,
            office_name: d.office_name,
            office_code: d.office_code,
            office_status: d.office_status,
            divisionId:
              d.division_id === 0 || d.division_id === null
                ? null
                : d.division_id,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: officesData.length,
      updated,
      created,
      // skipped,
      message: "office sync completed",
    });
  } catch (err) {
    console.error("Sync office error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
