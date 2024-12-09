const fs = require("fs");
const prisma = require("../prisma/prisma");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

// exports.create = async (req, res) => {
//   try {
//     // Destructure body values
//     const {
//       emp_code,
//       first_name,
//       last_name,
//       gender,
//       email,
//       role_id,
//       position_id,
//       department_id,
//       division_id,
//       office_id,
//       unit_id,
//       tel,
//       telapp,
//     } = req.body;

//     console.log(req.body);
//     console.log(req.files);
//     // Step 1: Validate input fields
//     if (!emp_code || !first_name || !last_name) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // Step 2: Check if the username already exists
//     const checkUser = await prisma.user.findUnique({
//       where: { username: emp_code },
//     });
//     if (checkUser) {
//       return res.status(409).json({ message: "Username already exists" });
//     }

//     // Step 3: Hash default password (you might want to allow password as input)
//     const salt = await bcrypt.genSalt(10);
//     const hashPassword = await bcrypt.hash("EDL1234", salt); // Default password can be changed as needed

//     let userImage = null;
//     if (req.files && req.files.user_image) {
//       console.log(req.files.user_image);
//       // Prepare the image for upload
//       const formData = new FormData();
//       formData.append(
//         "user_image",
//         req.files.user_image[0].buffer,
//         req.files.user_image[0].originalname
//       );

//       // Upload the image
//       const uploadResponse = await axios.post(
//         "http://localhost:4000/upload/user",
//         formData,
//         {
//           headers: {
//             ...formData.getHeaders(),
//           },
//         }
//       );

//       // Get the filename or image path from the upload response
//       userImage = uploadResponse.data.filename; // Assuming the API returns the image path
//     }

//     // Step 4: Create new user
//     const newUser = await prisma.user.create({
//       data: {
//         username: emp_code,
//         password: hashPassword,
//         emp_code,
//         first_name,
//         last_name,
//         email,
//         gender,
//         department_id: department_id ? Number(department_id) : null,
//         division_id: division_id ? Number(division_id) : null,
//         office_id: office_id ? Number(office_id) : null,
//         unit_id: unit_id ? Number(unit_id) : null,
//         position_id: position_id ? Number(position_id) : null,
//         tel,
//         telapp,
//         role_id: role_id ? Number(role_id) : null,
//         user_image: userImage,
//       },
//     });

//     res.status(201).json({
//       message: "User created successfully!",
//       data: newUser,
//     });
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).send("Server Error");
//   }
// };

exports.list = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc", // Change this to the field you want to sort by
      },
      include: {
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
        rank: true,
      },
    });

    // Format dates
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: moment(user.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(user.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        user_id: Number(user_id),
      },
      include: {
        role: true,
        position: true,
        department: true,
        division: true,
        office: true,
        unit: true,
        rank: true,
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

exports.update = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { role_id, unit_id, rank_id } = req.body;

    // Step 1: Find the user to update
    const user = await prisma.user.findUnique({
      where: {
        user_id: Number(user_id),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 3: Update the user record
    const updated = await prisma.user.update({
      where: {
        user_id: Number(user_id),
      },
      data: {
        role_id: Number(role_id),
        unit_id: Number(unit_id),
        rank_id: Number(rank_id),
      },
    });

    res.json({ message: "Update successful!", data: updated });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.remove = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Step 1: Find the user by ID
//     const user = await prisma.user.findUnique({
//       where: {
//         id: Number(userId),
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Step 2: Delete the photo file if it exists
//     if (user.userimg) {
//       const userimgPath = path.join(__dirname, "../uploads/user", user.userimg);
//       fs.unlink(userimgPath, (err) => {
//         if (err) {
//           console.error("Error deleting userimg file: ", err);
//           return res
//             .status(500)
//             .json({ message: "Error deleting userimg file" });
//         }
//       });
//     }

//     // Step 3: Delete the user from the database
//     const removed = await prisma.user.delete({
//       where: {
//         id: Number(userId),
//       },
//     });

//     res.status(200).json({ message: "User and userimg deleted successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
