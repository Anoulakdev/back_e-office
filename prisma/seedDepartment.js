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

async function seedDepartment() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/department/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const departmentsData = response.data.data;

    // console.log("API Response:", departmentsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const departmentData of departmentsData) {
      await prisma.department.upsert({
        where: { id: departmentData.department_id },
        update: {
          department_name: departmentData.department_name,
          department_code: departmentData.department_code,
          department_status: departmentData.department_status,
        },
        create: {
          id: departmentData.department_id, // เพิ่ม department_id ในการสร้าง
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
