const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

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

    async function loginAndGetToken() {
      try {
        const loginResponse = await axios.post(
          `${process.env.URL_API}/auth-svc/auth/login`,
          {
            username: process.env.USERNAME_API,
            password: process.env.PASSWORD_API,
          }
        );

        return loginResponse.data.data.accessToken;
      } catch (error) {
        console.error("Error during login:", error.message);
        throw error;
      }
    }

    const token = await loginAndGetToken();

    const response = await axios.get(
      `${process.env.URL_API}/organization-svc/employee/get?search=${username}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const usersData = response.data.data.employees;

    if (usersData.length > 0) {
      const userData = usersData[0];

      await prisma.employee.upsert({
        where: { emp_code: userData.emp_code },
        update: {
          first_name: userData.first_name_la,
          last_name: userData.last_name_la,
          emp_code: userData.emp_code,
          status: userData.status,
          gender: userData.gender,
          posId: Number(userData.office?.pos_id) || null,
          departmentId: Number(userData.office?.department_id) || null,
          divisionId: Number(userData.office?.division_id) || null,
          officeId: Number(userData.office?.office_id) || null,
          unitId:
            userData.office.unit_id === 0 || userData.office.unit_id === null
              ? null
              : userData.office?.unit_id,
          tel: userData.phone || null,
          email: userData.email || null,
          empimg: userData.image
            ? `https://uat-api.edl.com.la/api_v2/organization-svc/employee/getEmpImg/${userData.emp_code}/${userData.image}`
            : null,
          createdAt: userData.created_at
            ? new Date(userData.created_at)
            : new Date(),
          updatedAt: userData.created_at
            ? new Date(userData.created_at)
            : new Date(),
        },
        create: {
          id: userData.emp_id,
          first_name: userData.first_name_la,
          last_name: userData.last_name_la,
          emp_code: userData.emp_code,
          status: userData.status,
          gender: userData.gender,
          posId: Number(userData.office?.pos_id) || null,
          departmentId: Number(userData.office?.department_id) || null,
          divisionId: Number(userData.office?.division_id) || null,
          officeId: Number(userData.office?.office_id) || null,
          unitId:
            userData.office.unit_id === 0 || userData.office.unit_id === null
              ? null
              : userData.office?.unit_id,
          tel: userData.phone || null,
          email: userData.email || null,
          empimg: userData.image
            ? `https://uat-api.edl.com.la/api_v2/organization-svc/employee/getEmpImg/${userData.emp_code}/${userData.image}`
            : null,
          createdAt: userData.created_at
            ? new Date(userData.created_at)
            : new Date(),
          updatedAt: userData.created_at
            ? new Date(userData.created_at)
            : new Date(),
        },
      });

      await prisma.user.update({
        where: { username: userData.emp_code },
        data: {
          employeeId: userData.emp_id,
        },
      });

      // console.log(`Synchronized user: ${userData.first_name_la}`);
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
        employee: {
          include: {
            position: true,
            department: true,
            division: true,
            office: true,
            unit: true,
          },
        },
        // department: true,
        // division: true,
      },
    });
    // Step 3 Create payload
    const payload = {
      id: userWithAll.id,
      username: userWithAll.username,
      name: userWithAll.name,
      userimg: userWithAll.userimg,
      status: userWithAll.status,
      employee_code: userWithAll.employee_code,
      employeeId: userWithAll.employeeId,
      roleId: userWithAll.roleId,
      rankId: userWithAll.rankId,
      departmentId: userWithAll.departmentId,
      divisionId: userWithAll.divisionId,

      rank: userWithAll.rank,
      role: userWithAll.role,
      employee: userWithAll.employee,
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
