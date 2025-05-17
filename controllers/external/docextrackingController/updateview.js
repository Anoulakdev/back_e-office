const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    // รับค่าจาก query string
    const { docexId, docstatusId } = req.query;

    // แปลงเป็นตัวเลข
    const docexIdNum = Number(docexId);
    const docstatusIdNum = Number(docstatusId);

    // ตรวจสอบค่าที่แปลงแล้ว
    if (isNaN(docexIdNum) || isNaN(docstatusIdNum)) {
      return res
        .status(400)
        .json({ message: "Invalid docexId or docstatusId" });
    }

    let docextrackings = null;
    let docexlogs = null;

    if (req.user.roleId === 2) {
      docextrackings = await prisma.docexTracking.findFirst({
        where: {
          docexId: docexIdNum,
          docstatusId: docstatusIdNum,
          receiver: {
            roleId: 2,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      docexlogs = await prisma.docexLog.findFirst({
        where: {
          docexId: docexIdNum,
          docstatusId: docstatusIdNum,
          receiver: {
            roleId: 2,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      docextrackings = await prisma.docexTracking.findFirst({
        where: {
          docexId: docexIdNum,
          docstatusId: docstatusIdNum,
          receiverCode: req.user.username,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      docexlogs = await prisma.docexLog.findFirst({
        where: {
          docexId: docexIdNum,
          docstatusId: docstatusIdNum,
          receiverCode: req.user.username,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let updatedTracking = null;
    let updatedLog = null;

    // อัปเดต viewed ของ tracking
    if (docextrackings) {
      updatedTracking = await prisma.docexTracking.update({
        where: {
          id: docextrackings.id,
        },
        data: {
          viewed: true,
        },
        include: {
          docstatus: true,
          docexternal: {
            include: {
              outsider: true,
              priority: true,
              doctype: true,
              creator: {
                select: {
                  username: true,
                  rankId: true,
                  roleId: true,
                  employee: {
                    select: {
                      first_name: true,
                      last_name: true,
                      emp_code: true,
                      status: true,
                      gender: true,
                      tel: true,
                      email: true,
                      empimg: true,
                      posId: true,
                      department: true,
                      division: true,
                      office: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          assigner: {
            select: {
              username: true,
              employee: {
                select: {
                  first_name: true,
                  last_name: true,
                  gender: true,
                  tel: true,
                },
              },
            },
          },
          receiver: {
            select: {
              username: true,
              roleId: true,
            },
          },
        },
      });
    }

    // อัปเดต viewed ของ log
    if (docexlogs) {
      updatedLog = await prisma.docexLog.update({
        where: {
          id: docexlogs.id,
        },
        data: {
          viewed: true,
        },
      });
    }

    res.json({
      message: "Update successful!",
      tracking: updatedTracking,
      log: updatedLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
