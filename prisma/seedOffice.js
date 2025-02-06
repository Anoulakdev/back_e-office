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

async function seedOffice() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/office/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const officesData = response.data.data;

    // console.log("API Response:", officesData); // เพิ่มการแสดงข้อมูลจาก API

    for (const officeData of officesData) {
      // ตรวจสอบว่า division_id มีอยู่ในฐานข้อมูลหรือไม่
      const division = await prisma.division.findUnique({
        where: { id: officeData.division_id },
      });

      // ถ้า division_id ไม่มีในฐานข้อมูล ให้ข้ามข้อมูลนี้ไป
      if (!division) {
        console.error(`Division with id ${officeData.division_id} not found`);
        continue;
      }

      await prisma.office.upsert({
        where: { id: officeData.office_id },
        update: {
          office_name: officeData.office_name,
          office_code: officeData.office_code,
          office_status: officeData.office_status,
          divisionId: officeData.division_id,
        },
        create: {
          id: officeData.office_id, // เพิ่ม office_id ในการสร้าง
          office_name: officeData.office_name,
          office_code: officeData.office_code,
          office_status: officeData.office_status,
          divisionId: officeData.division_id,
        },
      });
      console.log(`Synchronized office: ${officeData.office_name}`);
    }
  } catch (error) {
    console.error("Error syncing offices:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedOffice;
