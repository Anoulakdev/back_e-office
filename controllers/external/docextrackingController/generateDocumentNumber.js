const prisma = require("../../../prisma/prisma");

function padNumber(num, size) {
  return num.toString().padStart(size, "0");
}

async function generateDocumentNumber() {
  const currentYear = new Date().getFullYear();

  const latestDoc = await prisma.docExport.findFirst({
    where: {
      export_no: {
        endsWith: `-${currentYear}`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let runningNumber = 1;

  if (latestDoc) {
    const [latestNumber] = latestDoc.export_no.split("-");
    runningNumber = parseInt(latestNumber, 10) + 1;
  }

  const formattedNumber = padNumber(runningNumber, 4);
  return `${formattedNumber}-${currentYear}`;
}

module.exports = generateDocumentNumber;
