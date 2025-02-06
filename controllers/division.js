const prisma = require("../prisma/prisma");

// exports.create = async (req, res) => {
//   try {
//     const { name, departmentId } = req.body;

//     // Validate input fields
//     if ((!name, !departmentId)) {
//       return res.status(400).json({ message: "Invalid input fields" });
//     }

//     // Create new user in the database
//     const newDivision = await prisma.division.create({
//       data: {
//         name,
//         departmentId,
//       },
//     });

//     res.json({
//       message: "Division created successfully!",
//       data: newDivision,
//     });
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ message: "Server Error", error: err.message });
//   }
// };

exports.list = async (req, res) => {
  try {
    const Division = await prisma.division.findMany({
      include: {
        department: true,
      },
      orderBy: {
        division_code: "asc",
      },
    });
    res.json(Division);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { divisionId } = req.params;

    const division = await prisma.division.findUnique({
      where: {
        id: Number(divisionId),
      },
      include: {
        department: true,
      },
    });

    if (!division) {
      return res.status(404).json({ message: "Division not found" });
    }

    res.json(division);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.update = async (req, res) => {
//   try {
//     const { divisionId } = req.params;
//     const { name, departmentId } = req.body;

//     const updated = await prisma.division.update({
//       where: {
//         id: Number(divisionId),
//       },
//       data: {
//         name: name,
//         departmentId: departmentId,
//       },
//     });

//     res.json({ message: "Updated Success!! ", data: updated });
//   } catch (err) {
//     // err
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// exports.remove = async (req, res) => {
//   try {
//     const { divisionId } = req.params;

//     const removed = await prisma.division.delete({
//       where: {
//         id: Number(divisionId),
//       },
//     });

//     res.status(200).json({ message: "Division deleted successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
