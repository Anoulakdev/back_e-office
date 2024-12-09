const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function seedOffice() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/office/get"
    );
    const officesData = response.data.data;

    // console.log("API Response:", officesData); // เพิ่มการแสดงข้อมูลจาก API

    for (const officeData of officesData) {
      // ตรวจสอบว่า division_id มีอยู่ในฐานข้อมูลหรือไม่
      const division = await prisma.division.findUnique({
        where: { division_id: officeData.division_id },
      });

      // ถ้า division_id ไม่มีในฐานข้อมูล ให้ข้ามข้อมูลนี้ไป
      if (!division) {
        console.error(`Division with id ${officeData.division_id} not found`);
        continue;
      }

      await prisma.office.upsert({
        where: { office_id: officeData.office_id },
        update: {
          office_name: officeData.office_name,
          office_code: officeData.office_code,
          office_status: officeData.office_status,
          division_id: officeData.division_id,
        },
        create: {
          office_id: officeData.office_id, // เพิ่ม office_id ในการสร้าง
          office_name: officeData.office_name,
          office_code: officeData.office_code,
          office_status: officeData.office_status,
          division_id: officeData.division_id,
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
