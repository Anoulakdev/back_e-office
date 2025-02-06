const prisma = require("../prisma/prisma");

// exports.create = async (req, res) => {
//   try {
//     const { position_name, position_code, group_id } = req.body;

//     // Validate input fields
//     if ((!position_name, !position_code)) {
//       return res.status(400).json({ message: "Invalid input fields" });
//     }

//     // Create new user in the database
//     const newPosition = await prisma.position.create({
//       data: {
//         position_name,
//         position_code,
//         group_id,
//       },
//     });

//     res.json({
//       message: "Position created successfully!",
//       data: newPosition,
//     });
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ message: "Server Error", error: err.message });
//   }
// };

exports.list = async (req, res) => {
  try {
    const position = await prisma.position.findMany({
      orderBy: {
        poscodeId: "asc",
      },
      include: {
        positioncode: {
          include: {
            positiongroup: true,
          },
        },
      },
    });

    res.json(position);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { positionId } = req.params;

    const position = await prisma.position.findUnique({
      where: {
        id: Number(positionId),
      },
      include: {
        positioncode: {
          include: {
            positiongroup: true,
          },
        },
      },
    });

    if (!position) {
      return res.status(404).json({ message: "position not found" });
    }

    res.json(position);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// exports.update = async (req, res) => {
//   try {
//     const { position_id } = req.params;
//     const { position_name, position_code, group_id } = req.body;

//     const updated = await prisma.position.update({
//       where: {
//         position_id: Number(position_id),
//       },
//       data: {
//         position_name: position_name,
//         position_code: position_code,
//         group_id: group_id,
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
//     const { position_id } = req.params;

//     const removed = await prisma.position.delete({
//       where: {
//         position_id: Number(position_id),
//       },
//     });

//     res.status(200).json({ message: "Position deleted successfully!" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
