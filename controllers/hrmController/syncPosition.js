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

    // 2. Fetch positions
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/position/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const positionsData = response.data.data;

    if (!Array.isArray(positionsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid position data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.position.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    let updated = 0;
    let created = 0;

    await Promise.all(
      positionsData.map(async (d) => {
        const isNew = !existingIds.has(d.pos_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.position.upsert({
          where: { id: d.pos_id },
          update: {
            pos_name: d.pos_name,
            pos_status: d.pos_status,
            poscodeId: d.pos_code_id,
          },
          create: {
            id: d.pos_id,
            pos_name: d.pos_name,
            pos_status: d.pos_status,
            poscodeId: d.pos_code_id,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: positionsData.length,
      updated,
      created,
      message: "position sync completed",
    });
  } catch (err) {
    console.error("Sync position error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
