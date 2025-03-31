const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        department_code: "asc",
      },
      include: {
        users: true,
      },
    });

    res.json(departments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
