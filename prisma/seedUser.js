const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedUser() {
  try {
    const response = await axios.get(
      "https://uat-api.edl.com.la/api_v2/organization-svc/employee/get"
    );
    const usersData = response.data.data.employees;

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("EDL1234", salt);

    // console.log("API Response:", usersData); // เพิ่มการแสดงข้อมูลจาก API

    for (const userData of usersData) {
      await prisma.user.upsert({
        where: { emp_code: userData.emp_code },
        update: {
          username: userData.emp_code,
          first_name: userData.first_name_la,
          last_name: userData.last_name_la,
          emp_code: userData.emp_code,
          status: userData.status,
          gender: userData.gender,
          posId: Number(userData.office?.pos_id) || null,
          departmentId: Number(userData.office?.department_id) || null,
          divisionId: Number(userData.office?.division_id) || null,
          officeId: Number(userData.office?.office_id) || null,
          //   unit_id: Number(userData?.office?.unit_id) || null,
          tel: userData.phone || null,
          email: userData.email || null,
          user_image: userData.image
            ? `https://uat-api.edl.com.la/api_v1/organization-svc/employee/getEmpImg/${userData.emp_code}/${userData.image}`
            : null,
          createdAt: userData.created_at,
          updatedAt: userData.created_at,
        },
        create: {
          username: userData.emp_code,
          password: hashPassword,
          first_name: userData.first_name_la,
          last_name: userData.last_name_la,
          emp_code: userData.emp_code,
          status: userData.status,
          gender: userData.gender,
          //   pos_id: Number(userData.office?.pos_id) || null,
          //   department_id: Number(userData.office?.department_id) || null,
          //   division_id: Number(userData.office?.division_id) || null,
          //   office_id: Number(userData.office?.office_id) || null,
          //   unit_id: Number(userData.office?.unit_id) || null,
          tel: userData.phone || null,
          email: userData.email || null,
          user_image: userData.image
            ? `https://uat-api.edl.com.la/api_v1/organization-svc/employee/getEmpImg/${userData.emp_code}/${userData.image}`
            : null,
          createdAt: userData.created_at,
          updatedAt: userData.created_at,
        },
      });
      console.log(`Synchronized user: ${userData.first_name_la}`);
    }
  } catch (error) {
    console.error("Error syncing users:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedUser;
