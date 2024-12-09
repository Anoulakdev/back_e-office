const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function seedDivision() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/division/get"
    );
    const divisionsData = response.data.data;

    // console.log("API Response:", divisionsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const divisionData of divisionsData) {

      await prisma.division.upsert({
        where: { division_id: divisionData.division_id },
        update: {
          division_name: divisionData.division_name,
          division_code: divisionData.division_code,
          division_status: divisionData.division_status,
          department_id: divisionData.department_id,
        },
        create: {
          division_id: divisionData.division_id, // เพิ่ม division_id ในการสร้าง
          division_name: divisionData.division_name,
          division_code: divisionData.division_code,
          division_status: divisionData.division_status,
          department_id: divisionData.department_id,
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
