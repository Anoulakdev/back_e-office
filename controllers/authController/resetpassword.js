const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");

module.exports = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) {
      return res.status(404).json({ error: "ບໍ່ພົບຜູ້ໃຊ້" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD || "123456", salt);

    await prisma.user.update({
      where: { id: Number(userId) },
      data: { password: hashPassword },
    });

    res.status(201).json({
      message: "ຣີ​ເສັດ​ລະ​ຫັດ​ສຳ​ເລ​ັດ",
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server Error");
  }
};
