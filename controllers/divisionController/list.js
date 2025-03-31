const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { departmentId } = req.query;

    const filter = departmentId
      ? {
          where: { departmentId: Number(departmentId) },
          include: {
            department: true,
          },
          orderBy: {
            division_code: "asc",
          },
        }
      : {
          include: {
            department: true,
          },
          orderBy: {
            division_code: "asc",
          },
        };

    const Division = await prisma.division.findMany(filter);
    res.json(Division);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
