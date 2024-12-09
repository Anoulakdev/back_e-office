const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function seedPosition() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/position/get"
    );
    const positionsData = response.data.data;

    // console.log("API Response:", positionsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const positionData of positionsData) {
      await prisma.position.upsert({
        where: { pos_id: positionData.pos_id },
        update: {
          pos_name: positionData.pos_name,
          pos_status: positionData.pos_status,
          pos_code_id: positionData.pos_code_id,
        },
        create: {
          pos_id: positionData.pos_id, // เพิ่ม pos_id ในการสร้าง
          pos_name: positionData.pos_name,
          pos_status: positionData.pos_status,
          pos_code_id: positionData.pos_code_id,
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
