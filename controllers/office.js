const prisma = require("../prisma/prisma");

// exports.create = async (req, res) => {
//   try {
//     const { name, divisionId } = req.body;

//     // Validate input fields
//     if ((!name, !divisionId)) {
//       return res.status(400).json({ message: "Invalid input fields" });
//     }

//     // Create new user in the database
//     const newOffice = await prisma.office.create({
//       data: {
//         name,
//         divisionId,
//       },
//     });

//     res.json({
//       message: "office created successfully!",
//       data: newOffice,
//     });
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ message: "Server Error", error: err.message });
//   }
// };

exports.list = async (req, res) => {
  try {
    const { divisionId } = req.query;
    const filter = divisionId
      ? {
          where: { divisionId: Number(divisionId) },
          include: {
            division: true,
          },
          orderBy: {
            office_code: "asc",
          },
        }
      : {
          include: {
            division: true,
          },
          orderBy: {
            office_code: "asc",
          },
        };
    const Office = await prisma.office.findMany(filter);
    res.json(Office);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { officeId } = req.params;

    const office = await prisma.office.findUnique({
      where: {
        id: Number(officeId),
      },
      include: {
        division: true,
      },
    });

    if (!office) {
      return res.status(404).json({ message: "Office not found" });
    }

    res.json(office);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.update = async (req, res) => {
//   try {
//     const { officeId } = req.params;
//     const { name, divisionId } = req.body;

//     const updated = await prisma.office.update({
//       where: {
//         id: Number(officeId),
//       },
//       data: {
//         name: name,
//         divisionId: divisionId,
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
//     const { officeId } = req.params;

//     const removed = await prisma.office.delete({
//       where: {
//         id: Number(officeId),
//       },
//     });

//     res.status(200).json({ message: "Office deleted successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
