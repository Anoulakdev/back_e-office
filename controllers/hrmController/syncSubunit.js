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

    // 2. Fetch subunits
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/subunit/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const subunitsData = response.data.data;

    if (!Array.isArray(subunitsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subunit data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.subunit.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    const divisions = await prisma.division.findMany({
      select: { id: true },
    });

    const divisionIds = new Set(divisions.map((d) => d.id));

    const offices = await prisma.office.findMany({
      select: { id: true },
    });

    const officeIds = new Set(offices.map((o) => o.id));

    let updated = 0;
    let created = 0;
    let skipped = 0;

    await Promise.all(
      subunitsData.map(async (d) => {
        const subUnitId = Number(d.sub_unit_id);
        if (!subUnitId) {
          skipped++;
          return null;
        }

        const isNew = !existingIds.has(subUnitId);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        const rawDivId = Number(
          d.division?.division_id || d.office?.division_id || d.division_id,
        );
        const validDivisionId =
          rawDivId && divisionIds.has(rawDivId) ? rawDivId : null;

        const rawOfficeId = Number(d.office_id || d.office?.office_id);
        const validOfficeId =
          rawOfficeId && officeIds.has(rawOfficeId) ? rawOfficeId : null;

        return prisma.subunit.upsert({
          where: { id: subUnitId },
          update: {
            sub_unit_name: d.sub_unit_name,
            sub_unit_code: d.sub_unit_code,
            divisionId: validDivisionId,
            officeId: validOfficeId,
          },
          create: {
            id: subUnitId,
            sub_unit_name: d.sub_unit_name,
            sub_unit_code: d.sub_unit_code,
            divisionId: validDivisionId,
            officeId: validOfficeId,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: subunitsData.length,
      updated,
      created,
      skipped,
      message: "subunit sync completed",
    });
  } catch (err) {
    console.error("Sync subunit error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
