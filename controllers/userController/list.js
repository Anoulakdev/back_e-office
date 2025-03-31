const fs = require("fs");
const prisma = require("../../prisma/prisma");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/user"); // The directory where user images will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Appending file extension
  },
});

const upload = multer({ storage: storage }).single("userimg");

module.exports = async (req, res) => {
  try {
    const { search, roleId, departmentId, divisionId, officeId, unitId } =
      req.query;

    const where = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { emp_code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleId) where.roleId = Number(roleId);
    if (departmentId) where.departmentId = Number(departmentId);
    if (divisionId) where.divisionId = Number(divisionId);
    if (officeId) where.officeId = Number(officeId);
    if (unitId) where.unitId = Number(unitId);

    const filter = {
      where,
      orderBy: [{ roleId: "asc" }, { rankId: "asc" }],
      include: {
        rank: true,
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    };

    const users = await prisma.user.findMany(filter);

    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
