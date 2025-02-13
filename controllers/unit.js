const prisma = require("../prisma/prisma");

// exports.create = async (req, res) => {
//   try {
//     const { name, divisionId, officeId } = req.body;

//     // Validate input fields
//     if (!name) {
//       return res.status(400).json({ message: "Invalid input fields" });
//     }

//     // Create new user in the database
//     const newUnit = await prisma.unit.create({
//       data: {
//         name,
//         divisionId,
//         officeId,
//       },
//     });

//     res.json({
//       message: "unit created successfully!",
//       data: newUnit,
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
            office: true,
          },
          orderBy: {
            unit_code: "asc",
          },
        }
      : {
          include: {
            division: true,
            office: true,
          },
          orderBy: {
            unit_code: "asc",
          },
        };
    const unit = await prisma.unit.findMany(filter);

    res.json(unit);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { unitId } = req.params;

    const unit = await prisma.unit.findUnique({
      where: {
        id: Number(unitId),
      },
      include: {
        division: true,
        office: true,
      },
    });

    if (!unit) {
      return res.status(404).json({ message: "unit not found" });
    }

    res.json(unit);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.update = async (req, res) => {
//   try {
//     const { unitId } = req.params;
//     const { name } = req.body;

//     const updated = await prisma.unit.update({
//       where: {
//         id: Number(unitId),
//       },
//       data: {
//         name: name,
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
//     const { unitId } = req.params;

//     const removed = await prisma.unit.delete({
//       where: {
//         id: Number(unitId),
//       },
//     });

//     res.status(200).json({ message: "unit deleted successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
