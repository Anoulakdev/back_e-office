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
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({
        message: "Multer error occurred during upload.",
        error: err,
      });
    } else if (err) {
      return res.status(500).json({
        message: "Unknown error occurred during upload.",
        error: err,
      });
    }

    try {
      const { userId } = req.params;
      const {
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

      // Step 1: Find the user to update
      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Step 2: If a new photo is uploaded and an old photo exists, delete the old photo
      let userimgPath = user.userimg; // Keep old photo path
      if (req.file) {
        // Only attempt to delete if there is an existing photo path
        if (user.userimg) {
          const oldUserimgPath = path.join(
            __dirname,
            "../../uploads/user",
            path.basename(user.userimg)
          );
          fs.unlink(oldUserimgPath, (err) => {
            if (err) {
              console.error("Error deleting old image: ", err);
            }
          });
        }

        // Set the new photo path
        userimgPath = `${req.file.filename}`;
      }

      // Step 3: Update the user record
      const updated = await prisma.user.update({
        where: {
          id: Number(userId),
        },
        data: {
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
          userimg: userimgPath,
        },
      });

      res.json({ message: "Update successful!", data: updated });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server Error" });
    }
  });
};