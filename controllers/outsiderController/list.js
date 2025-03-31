const prisma = require("../../prisma/prisma");
module.exports = async (req, res) => {
  try {
    const { belongId } = req.query;

    let filter = {};

    if (belongId !== undefined) {
      const belongIdNum = Number(belongId);

      if (belongIdNum === 0) {
        // ถ้า belongId = 0 ให้ดึงข้อมูลทั้งหมดแต่ไม่เอาที่ belongId = 1
        filter = {
          where: {
            belongId: { not: 1 },
          },
        };
      } else {
        // ถ้า belongId มีค่าอื่นๆ ให้กรองตาม belongId
        filter = {
          where: { belongId: belongIdNum },
        };
      }
    }

    const outsiders = await prisma.outsider.findMany({
      ...filter,
      include: { belongto: true },
    });

    res.json(outsiders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
