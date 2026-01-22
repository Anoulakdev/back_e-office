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
  // await seedDepartment();
  // await seedDivision();
  // await seedOffice();
  // await seedUnit();
  // await seedPositionGroup();
  // await seedPositionCode();
  // await seedPosition();
  await seedEmployee();
  // await seedUser();

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
