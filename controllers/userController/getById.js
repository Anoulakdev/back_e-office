const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      include: {
        rank: true,
        role: true,
        employee: {
          include: {
            position: true,
            department: true,
            division: true,
            office: true,
            unit: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format dates
    const formattedUser = {
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
      employee: user.employee
        ? {
            ...user.employee,
            createdAt: moment(user.employee.createdAt)
              .tz("Asia/Vientiane")
              .format(),
            updatedAt: moment(user.employee.updatedAt)
              .tz("Asia/Vientiane")
              .format(),
          }
        : null,
    };

    res.json(formattedUser);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
