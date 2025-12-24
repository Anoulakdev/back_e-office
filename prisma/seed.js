// const seedDepartment = require("./seedDepartment");
// const seedDivision = require("./seedDivision");
// const seedOffice = require("./seedOffice");
// const seedUnit = require("./seedUnit");
// const seedPositionGroup = require("./seedPositionGroup");
// const seedPositionCode = require("./seedPositionCode");
// const seedPosition = require("./seedPosition");
const seedEmployee = require("./seedEmployee");
// const seedUser = require("./seedUser");

async function main() {
  // await seedDepartment(); // เรียกใช้ฟังก์ชัน seeding สำหรับ Department
  // await seedDivision(); // เรียกใช้ฟังก์ชัน seeding สำหรับ Division
  // await seedOffice(); // เรียกใช้ฟังก์ชัน seeding สำหรับ Office
  // await seedUnit(); // เรียกใช้ฟังก์ชัน seeding สำหรับ Unit
  // await seedPositionGroup(); // เรียกใช้ฟังก์ชัน seeding สำหรับ PositionGroup
  // await seedPositionCode(); // เรียกใช้ฟังก์ชัน seeding สำหรับ PositionCode
  // await seedPosition(); // เรียกใช้ฟังก์ชัน seeding สำหรับ Position
  await seedEmployee(); // เรียกใช้ฟังก์ชัน seeding สำหรับ Employee
  // await seedUser(); // เรียกใช้ฟังก์ชัน seeding สำหรับ User

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
