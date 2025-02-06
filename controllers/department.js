const prisma = require("../prisma/prisma");

// exports.create = async (req, res) => {
//   try {
//     const { name, nameeng } = req.body;

//     // Validate input fields
//     if (!name || !nameeng) {
//       return res.status(400).json({ message: "Invalid input fields" });
//     }

//     // Create new user in the database
//     const newDepartment = await prisma.department.create({
//       data: {
//         name,
//         nameeng,
//       },
//     });

//     res.json({
//       message: "Department created successfully!",
//       data: newDepartment,
//     });
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ message: "Server Error", error: err.message });
//   }
// };

exports.list = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        department_code: "asc",
      },
      include: {
        divisions: {
          include: {
            units: true,
            offices: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });

    res.json(departments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.listuser = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        department_code: "asc",
      },
      include: {
        users: true,
      },
    });

    res.json(departments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await prisma.department.findUnique({
      where: {
        id: Number(departmentId),
      },
      include: {
        divisions: {
          include: {
            units: true,
            offices: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(department);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.update = async (req, res) => {
//   try {
//     const { departmentId } = req.params;
//     const { name, nameeng } = req.body;

//     const updated = await prisma.department.update({
//       where: {
//         id: Number(departmentId),
//       },
//       data: {
//         name: name,
//         nameeng: nameeng,
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
//     const { departmentId } = req.params;

//     const removed = await prisma.department.delete({
//       where: {
//         id: Number(departmentId),
//       },
//     });

//     res.status(200).json({ message: "Department deleted successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
