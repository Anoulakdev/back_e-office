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

    // 2. Fetch positiongroups
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/positionGroup/get`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const positiongroupsData = response.data.data;

    if (!Array.isArray(positiongroupsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid positiongroup data format",
      });
    }

    // 3. Upsert
    const existing = await prisma.positionGroup.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existing.map((d) => d.id));

    let updated = 0;
    let created = 0;

    await Promise.all(
      positiongroupsData.map(async (d) => {
        const isNew = !existingIds.has(d.pos_group_id);

        if (isNew) {
          created++;
        } else {
          updated++;
        }

        return prisma.positionGroup.upsert({
          where: { id: d.pos_group_id },
          update: {
            pos_group_name: d.pos_group_name,
          },
          create: {
            id: d.pos_group_id,
            pos_group_name: d.pos_group_name,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      total: positiongroupsData.length,
      updated,
      created,
      message: "positiongroup sync completed",
    });
  } catch (err) {
    console.error(
      "Sync positiongroup error:",
      err.response?.data || err.message,
    );
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
