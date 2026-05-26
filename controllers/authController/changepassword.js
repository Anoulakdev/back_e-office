const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");

module.exports = async (req, res) => {
    try {
        const { oldpassword, password1, password2 } = req.body;

        if (!oldpassword || !password1 || !password2) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (password1 !== password2) {
            return res.status(400).json({ message: "ລະ​ຫັດ​ໃໝ່​ບໍ່​ຕົງ​ກັນ" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return res.status(404).json({ message: "ບໍ່ພົບຜູ້ໃຊ້" });
        }

        const isPasswordValid = await bcrypt.compare(oldpassword, user.password);
        if (!isPasswordValid) {
            return res
                .status(400)
                .json({ message: "ລະ​ຫັດ​ເກ​ົ່າ​ບໍ່​ຕົງ​ກັບ​ຖານ​ຂໍ້​ມູນ" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password1, salt);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashPassword },
        });

        res.status(200).json({ message: "ອັບ​ເດດ​ລະ​ຫັດ​ສຳ​ເລ​ັດ" });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
