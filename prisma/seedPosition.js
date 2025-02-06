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

async function seedPosition() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/position/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const positionsData = response.data.data;

    // console.log("API Response:", positionsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const positionData of positionsData) {
      await prisma.position.upsert({
        where: { id: positionData.pos_id },
        update: {
          pos_name: positionData.pos_name,
          pos_status: positionData.pos_status,
          poscodeId: positionData.pos_code_id,
        },
        create: {
          id: positionData.pos_id, // เพิ่ม pos_id ในการสร้าง
          pos_name: positionData.pos_name,
          pos_status: positionData.pos_status,
          poscodeId: positionData.pos_code_id,
        },
      });
      console.log(`Synchronized position: ${positionData.pos_name}`);
    }
  } catch (error) {
    console.error("Error syncing positions:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedPosition;
