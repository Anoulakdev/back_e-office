const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function seedPositionCode() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/positionCode/get"
    );
    const positioncodesData = response.data.data;

    // console.log("API Response:", positioncodesData); // เพิ่มการแสดงข้อมูลจาก API

    for (const positioncodeData of positioncodesData) {
      await prisma.positionCode.upsert({
        where: { pos_code_id: positioncodeData.pos_code_id },
        update: {
          pos_code_name: positioncodeData.pos_code_name,
          pos_code_status: positioncodeData.pos_code_status,
          pos_group_id: positioncodeData.pos_group_id,
        },
        create: {
          pos_code_id: positioncodeData.pos_code_id, // เพิ่ม positioncode_id ในการสร้าง
          pos_code_name: positioncodeData.pos_code_name,
          pos_code_status: positioncodeData.pos_code_status,
          pos_group_id: positioncodeData.pos_group_id,
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
