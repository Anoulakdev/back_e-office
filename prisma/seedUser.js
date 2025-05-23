const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const bcrypt = require("bcrypt");

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

async function seedUser() {
  try {
    const token = await loginAndGetToken();
    const departmentIds = Array.from({ length: 15 }, (_, i) => i + 1);
    // const departmentId = 15;

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("EDL1234", salt);

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

        let roleId = undefined;
        let rankId = undefined;
        const posId = userData.office?.pos_id;

        if ([2, 3].includes(posId)) {
          roleId = 4;
        } else if ([4].includes(posId)) {
          roleId = 11;
        } else if ([5, 6, 7, 9, 10, 11, 105].includes(posId)) {
          roleId = 6;
        } else if (
          [
            13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 90, 99, 103, 100,
          ].includes(posId)
        ) {
          roleId = 7;
        } else if (
          [22, 26, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40].includes(
            posId
          )
        ) {
          roleId = 8;
        } else if ([44, 50, 91, 45, 51, 52, 102].includes(posId)) {
          roleId = 9;
        } else if (
          [
            55, 56, 57, 58, 59, 60, 64, 65, 66, 68, 69, 70, 71, 72, 73, 75, 76,
            81, 88, 89, 93, 94, 95, 96, 97, 23, 1, 8, 42,
          ].includes(posId)
        ) {
          roleId = 10;
        }

        if (
          [
            2, 6, 7, 5, 105, 103, 16, 18, 14, 13, 19, 20, 22, 106, 26, 112, 107,
            28, 29, 30, 31, 32, 33, 90, 34, 41, 43, 104, 49, 44, 91, 45, 57,
            102, 55, 56, 100, 114,
          ].includes(posId)
        ) {
          rankId = 1;
        } else if (
          [
            3, 9, 10, 11, 12, 15, 17, 21, 24, 25, 27, 35, 36, 37, 38, 39, 40,
            47, 48, 50, 51, 52, 54, 99,
          ].includes(posId)
        ) {
          rankId = 2;
        }

        await prisma.user.upsert({
          where: { username: userData.emp_code },
          update: {
            username: userData.emp_code,
            employee_code: userData.emp_code,
            employeeId: userData.emp_id,
            status: userData.status,
            ...(roleId !== undefined && { roleId }),
            ...(rankId !== undefined && { rankId }),
            createdAt: userData.created_at
              ? new Date(userData.created_at)
              : new Date(),
            updatedAt: userData.created_at
              ? new Date(userData.created_at)
              : new Date(),
          },
          create: {
            username: userData.emp_code,
            password: hashPassword, // ตรวจสอบว่าค่านี้มีอยู่แล้ว
            employee_code: userData.emp_code,
            employeeId: userData.emp_id,
            status: userData.status,
            roleId: roleId,
            rankId: rankId,
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

module.exports = seedUser;
