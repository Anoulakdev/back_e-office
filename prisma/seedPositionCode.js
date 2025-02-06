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

async function seedPositionCode() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/positionCode/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const positioncodesData = response.data.data;

    // console.log("API Response:", positioncodesData); // เพิ่มการแสดงข้อมูลจาก API

    for (const positioncodeData of positioncodesData) {
      await prisma.positionCode.upsert({
        where: { id: positioncodeData.pos_code_id },
        update: {
          pos_code_name: positioncodeData.pos_code_name,
          pos_code_status: positioncodeData.pos_code_status,
          posgroupId: positioncodeData.pos_group_id,
        },
        create: {
          id: positioncodeData.pos_code_id, // เพิ่ม positioncode_id ในการสร้าง
          pos_code_name: positioncodeData.pos_code_name,
          pos_code_status: positioncodeData.pos_code_status,
          posgroupId: positioncodeData.pos_group_id,
        },
      });
      console.log(
        `Synchronized positioncode: ${positioncodeData.pos_code_name}`
      );
    }
  } catch (error) {
    console.error("Error syncing positioncodes:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedPositionCode;
