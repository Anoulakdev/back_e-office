const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res
        .status(401)
        .json({ message: "ກະ​ລຸ​ນາ​ເພີ່ມຊື່​ເຂົ້າ​ລະ​ບົບ" });
    }
    if (!password) {
      return res.status(401).json({ message: "ກະ​ລຸ​ນາ​ເພີ່ມລະ​ຫັດ" });
    }
    // Step 1 Check Email in DB
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    if (!user) {
      return res.status(401).json({
        message: "ບໍ່​ມີ​ຂໍ້​ມູນຜູ້​ໃຊ້",
      });
    }

    // if (user.actived !== 'A') {
    //   return res.status(400).json({
    //     message: "ລະ​ຫັດ​ຂອງ​ທ່ານ​ໄດ້​ຖືກ​ປິດ​ການ​ໃຊ້​ງານ",
    //   });
    // }

    // Step 2 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "​ລະ​ຫັດ​ບໍ່​ຖືກ​ຕ້ອງ",
      });
    }

    const userWithAll = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        rank: true,
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });
    // Step 3 Create payload
    const payload = {
      id: userWithAll.id,
      emp_code: userWithAll.emp_code,
      first_name: userWithAll.first_name,
      last_name: userWithAll.last_name,
      status: userWithAll.status,
      gender: userWithAll.gender,
      tel: userWithAll.tel,
      email: userWithAll.email,
      userimg: userWithAll.userimg,
      rankId: userWithAll.rankId,
      roleId: userWithAll.roleId,
      posId: userWithAll.posId,
      departmentId: userWithAll.departmentId,
      divisionId: userWithAll.divisionId,
      officeId: userWithAll.officeId,
      unitId: userWithAll.unitId,

      rank: userWithAll.rank,
      role: userWithAll.role,
      position: userWithAll.position,
      department: userWithAll.department,
      division: userWithAll.division,
      office: userWithAll.office,
      unit: userWithAll.unit,
      unit: userWithAll.unit,
    };
    // Step 4 Create Token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.status(200).json({
      user: payload,
      token: accessToken,
    });
  } catch (err) {
    console.log(err);
    res.json({ message: "Server Error" }).status(500);
  }
};
