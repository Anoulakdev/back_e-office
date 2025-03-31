const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const rolemenus = await prisma.roleMenu.findMany({
      orderBy: {
        id: "asc",
      },
      include: {
        permissions: true,
      },
    });

    const formattedRoleMenus = rolemenus.map((rolemenu) => ({
      ...rolemenu,
      permissions: rolemenu.permissions[0] || {}, // ดึงตัวแรก หรือให้เป็น {} ถ้าไม่มีข้อมูล
    }));

    res.json(formattedRoleMenus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
