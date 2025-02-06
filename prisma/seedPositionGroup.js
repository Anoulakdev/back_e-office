const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function loginAndGetToken() {
  try {
    const loginResponse = await axios.post(
      `${process.env.URL_API}/auth-svc/auth/login`,
      {
        username: process.env.USERNAME_API,
        password: process.env.PASSWORD_API,
      }
    );

    const token = loginResponse.data.data.accessToken;
    return token;
  } catch (error) {
    console.error("Error during login:", error.message);
    throw error;
  }
}

async function seedPositionGroup() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/positionGroup/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const positiongroupsData = response.data.data;

    // console.log("API Response:", positiongroupsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const positiongroupData of positiongroupsData) {
      await prisma.positionGroup.upsert({
        where: { id: positiongroupData.pos_group_id },
        update: {
          pos_group_name: positiongroupData.pos_group_name,
        },
        create: {
          id: positiongroupData.pos_group_id, // เพิ่ม positiongroup_id ในการสร้าง
          pos_group_name: positiongroupData.pos_group_name,
        },
      });
      console.log(
        `Synchronized positiongroup: ${positiongroupData.pos_group_name}`
      );
    }
  } catch (error) {
    console.error("Error syncing positiongroups:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedPositionGroup;
