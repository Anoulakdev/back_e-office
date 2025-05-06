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

async function seedEmployee() {
  try {
    const token = await loginAndGetToken();
    const departmentIds = Array.from({ length: 15 }, (_, i) => i + 1); // [1, 2, ..., 15]

    for (const departmentId of departmentIds) {
      console.log(`Fetching data for department_id: ${departmentId}`);

      const response = await axios.get(
        `${process.env.URL_API}/organization-svc/employee/get?department_id=${departmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const usersData = response.data.data.employees;

      for (const userData of usersData) {
        if (userData.office.unit_id !== 0 && userData.office.unit_id !== null) {
          const unitExists = await prisma.unit.findUnique({
            where: { id: userData.office.unit_id },
          });
          if (!unitExists) {
            console.error(
              `Office with ID ${userData.office.unit_id} does not exist. Skipping...`
            );
            continue;
          }
        }

        await prisma.employee.upsert({
          where: { emp_code: userData.emp_code },
          update: {
            first_name: userData.first_name_la,
            last_name: userData.last_name_la,
            emp_code: userData.emp_code,
            status: userData.status,
            gender: userData.gender,
            posId: Number(userData.office?.pos_id) || null,
            departmentId: Number(userData.office?.department_id) || null,
            divisionId: Number(userData.office?.division_id) || null,
            officeId: Number(userData.office?.office_id) || null,
            unitId:
              userData.office.unit_id === 0 || userData.office.unit_id === null
                ? null
                : userData.office.unit_id,
            tel: userData.phone || null,
            email: userData.email || null,
            empimg: userData.image
              ? `https://uat-api.edl.com.la/api_v2/organization-svc/employee/getEmpImg/${userData.emp_code}/${userData.image}`
              : null,
            createdAt: userData.created_at
              ? new Date(userData.created_at)
              : new Date(),
            updatedAt: userData.created_at
              ? new Date(userData.created_at)
              : new Date(),
          },
          create: {
            id: userData.emp_id,
            first_name: userData.first_name_la,
            last_name: userData.last_name_la,
            emp_code: userData.emp_code,
            status: userData.status,
            gender: userData.gender,
            posId: Number(userData.office?.pos_id) || null,
            departmentId: Number(userData.office?.department_id) || null,
            divisionId: Number(userData.office?.division_id) || null,
            officeId: Number(userData.office?.office_id) || null,
            unitId:
              userData.office.unit_id === 0 || userData.office.unit_id === null
                ? null
                : userData.office.unit_id,
            tel: userData.phone || null,
            email: userData.email || null,
            empimg: userData.image
              ? `https://uat-api.edl.com.la/api_v2/organization-svc/employee/getEmpImg/${userData.emp_code}/${userData.image}`
              : null,
            createdAt: userData.created_at
              ? new Date(userData.created_at)
              : new Date(),
            updatedAt: userData.created_at
              ? new Date(userData.created_at)
              : new Date(),
          },
        });

        console.log(`Synchronized user: ${userData.first_name_la}`);
      }
    }
  } catch (error) {
    console.error("Error syncing users:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedEmployee;
