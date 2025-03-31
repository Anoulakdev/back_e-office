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
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
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

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format dates
    const formattedUser = {
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    };

    res.json(formattedUser);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};