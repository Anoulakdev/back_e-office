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

    // 2. Fetch positioncodes
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/positionCode/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const positioncodesData = response.data.data;

    if (!Array.isArray(positioncodesData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid positioncode data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.positionCode.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    let updated = 0;
    let created = 0;

    await Promise.all(
      positioncodesData.map(async (d) => {
        const isNew = !existingIds.has(d.pos_code_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.positionCode.upsert({
          where: { id: d.pos_group_id },
          update: {
            pos_code_name: d.pos_code_name,
            pos_code_status: d.pos_code_status,
            posgroupId: d.pos_group_id,
          },
          create: {
            id: d.pos_code_id,
            pos_code_name: d.pos_code_name,
            pos_code_status: d.pos_code_status,
            posgroupId: d.pos_group_id,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: positioncodesData.length,
      updated,
      created,
      message: "positioncode sync completed",
    });
  } catch (err) {
    console.error(
      "Sync positioncode error:",
      err.response?.data || err.message,
    );
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
