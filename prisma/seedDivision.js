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

async function seedDivision() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/division/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const divisionsData = response.data.data;

    // console.log("API Response:", divisionsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const divisionData of divisionsData) {
      await prisma.division.upsert({
        where: { id: divisionData.division_id },
        update: {
          division_name: divisionData.division_name,
          division_code: divisionData.division_code,
          division_status: divisionData.division_status,
          departmentId: divisionData.department_id,
        },
        create: {
          id: divisionData.division_id, // เพิ่ม division_id ในการสร้าง
          division_name: divisionData.division_name,
          division_code: divisionData.division_code,
          division_status: divisionData.division_status,
          departmentId: divisionData.department_id,
        },
      });
      console.log(`Synchronized division: ${divisionData.division_name}`);
    }
  } catch (error) {
    console.error("Error syncing divisions:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedDivision;
