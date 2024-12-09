const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function seedDepartment() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v1/organization-svc/department/get"
    );
    const departmentsData = response.data.data;

    // console.log("API Response:", departmentsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const departmentData of departmentsData) {

      await prisma.department.upsert({
        where: { department_id: departmentData.department_id },
        update: {
          department_name: departmentData.department_name,
          department_code: departmentData.department_code,
          department_status: departmentData.department_status,
        },
        create: {
          department_id: departmentData.department_id, // เพิ่ม department_id ในการสร้าง
          department_name: departmentData.department_name,
          department_code: departmentData.department_code,
          department_status: departmentData.department_status,
        },
      });
      console.log(`Synchronized Department: ${departmentData.department_name}`);
    }
  } catch (error) {
    console.error("Error syncing departments:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedDepartment;
