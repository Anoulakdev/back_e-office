const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function seedPositionGroup() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/positionGroup/get"
    );
    const positiongroupsData = response.data.data;

    // console.log("API Response:", positiongroupsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const positiongroupData of positiongroupsData) {
      await prisma.positionGroup.upsert({
        where: { pos_group_id: positiongroupData.pos_group_id },
        update: {
          pos_group_name: positiongroupData.pos_group_name,
        },
        create: {
          pos_group_id: positiongroupData.pos_group_id, // เพิ่ม positiongroup_id ในการสร้าง
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
