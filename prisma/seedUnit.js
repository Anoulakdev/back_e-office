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

async function seedUnit() {
  try {
    const token = await loginAndGetToken();
    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/unit/get`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const unitsData = response.data.data;

    // console.log("API Response:", unitsData); // เพิ่มการแสดงข้อมูลจาก API

    for (const unitData of unitsData) {
      // ตรวจสอบ divisionId
      if (unitData.division_id !== 0 && unitData.division_id !== null) {
        const divisionExists = await prisma.division.findUnique({
          where: { id: unitData.division_id },
        });
        if (!divisionExists) {
          console.error(
            `Division with ID ${unitData.division_id} does not exist. Skipping...`
          );
          continue; // ข้ามหน่วยงานนี้
        }
      }

      // ตรวจสอบ officeId
      if (unitData.office_id !== 0 && unitData.office_id !== null) {
        const officeExists = await prisma.office.findUnique({
          where: { id: unitData.office_id },
        });
        if (!officeExists) {
          console.error(
            `Office with ID ${unitData.office_id} does not exist. Skipping...`
          );
          continue; // ข้ามหน่วยงานนี้
        }
      }

      // ทำการ upsert
      await prisma.unit.upsert({
        where: { id: unitData.unit_id },
        update: {
          unit_name: unitData.unit_name,
          unit_code: unitData.unit_code,
          unit_status: unitData.unit_status,
          unit_type: unitData.unit_type,
          divisionId:
            unitData.division_id === 0 || unitData.division_id === null
              ? null
              : unitData.division_id,
          officeId:
            unitData.office_id === 0 || unitData.office_id === null
              ? null
              : unitData.office_id,
        },
        create: {
          id: unitData.unit_id,
          unit_name: unitData.unit_name,
          unit_code: unitData.unit_code,
          unit_status: unitData.unit_status,
          unit_type: unitData.unit_type,
          divisionId:
            unitData.division_id === 0 || unitData.division_id === null
              ? null
              : unitData.division_id,
          officeId:
            unitData.office_id === 0 || unitData.office_id === null
              ? null
              : unitData.office_id,
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
