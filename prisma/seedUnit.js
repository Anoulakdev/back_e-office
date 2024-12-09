const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function seedUnit() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/unit/get"
    );
    const unitsData = response.data.data;

    // console.log("API Response:", unitsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const unitData of unitsData) {
      await prisma.unit.upsert({
        where: { unit_id: unitData.unit_id },
        update: {
          unit_name: unitData.unit_name,
          unit_code: unitData.unit_code,
          unit_status: unitData.unit_status,
          unit_type: unitData.unit_type,
          division_id: unitData.division_id,
          office_id: unitData.office_id,
        },
        create: {
          unit_id: unitData.unit_id, // เพิ่ม unit_id ในการสร้าง
          unit_name: unitData.unit_name,
          unit_code: unitData.unit_code,
          unit_status: unitData.unit_status,
          unit_type: unitData.unit_type,
          division_id: unitData.division_id,
          office_id: unitData.office_id,
        },
      });
      console.log(`Synchronized unit: ${unitData.unit_name}`);
    }
  } catch (error) {
    console.error("Error syncing units:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedUnit;
