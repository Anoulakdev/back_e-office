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

module.exports = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Handle multer-specific errors
      return res.status(500).json({
        message: "Multer error occurred when uploading.",
        error: err.message,
      });
    } else if (err) {
      // Handle other types of errors
      return res.status(500).json({
        message: "Unknown error occurred when uploading.",
        error: err.message,
      });
    }

    try {
      const {
        username,
        emp_code,
        first_name,
        last_name,
        gender,
        tel,
        email,
        rankId,
        roleId,
        posId,
        departmentId,
        divisionId,
        officeId,
        unitId,
      } = req.body;

      // Step 1: Validate input fields
      if (!emp_code || !first_name || !last_name) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Step 2: Check if the username already exists
      const checkUser = await prisma.user.findFirst({
        where: {
          OR: [{ username: username }, { emp_code: emp_code }],
        },
      });
      if (checkUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Step 3: Hash default password (you might want to allow password as input)
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash("EDL1234", salt);

      const maxId = await prisma.user.aggregate({
        _max: { id: true },
      });

      const nextId = (maxId._max.id || 0) + 1;

      // Step 4: Create new user
      const newUser = await prisma.user.create({
        data: {
          id: nextId,
          username: username || emp_code,
          password: hashPassword,
          emp_code,
          first_name,
          last_name,
          gender,
          tel,
          email,
          rankId: Number(rankId),
          roleId: Number(roleId),
          posId: Number(posId),
          departmentId: Number(departmentId),
          divisionId: Number(divisionId),
          officeId: Number(officeId),
          unitId: Number(unitId),
          userimg: req.file ? `${req.file.filename}` : null, // Path to the uploaded image
        },
      });

      res.status(201).json({
        message: "User created successfully!",
        data: newUser,
      });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).send("Server Error");
    }
  });
};
