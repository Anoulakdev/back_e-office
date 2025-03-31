const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        role_code: "asc",
      },
    });

    res.json(roles);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
