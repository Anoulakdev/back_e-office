const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    // รับค่าจาก query string
    const { docdtId, docstatusId } = req.query;

    // แปลงเป็นตัวเลข
    const docdtIdNum = Number(docdtId);
    const docstatusIdNum = Number(docstatusId);

    // ตรวจสอบค่าที่แปลงแล้ว
    if (isNaN(docdtIdNum) || isNaN(docstatusIdNum)) {
      return res
        .status(400)
        .json({ message: "Invalid docdtId or docstatusId" });
    }

    // หาข้อมูลจาก docdtTracking
    const docdttrackings = await prisma.docdtTracking.findFirst({
      where: {
        docdtId: docdtIdNum,
        docstatusId: docstatusIdNum,
        receiverCode: req.user.username,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // หาข้อมูลจาก docdtLog
    const docdtlogs = await prisma.docdtLog.findFirst({
      where: {
        docdtId: docdtIdNum,
        docstatusId: docstatusIdNum,
        receiverCode: req.user.username,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let updatedTracking = null;
    let updatedLog = null;

    // อัปเดต viewed ของ tracking
    if (docdttrackings) {
      updatedTracking = await prisma.docdtTracking.update({
        where: {
          id: docdttrackings.id,
        },
        data: {
          viewed: true,
        },
        include: {
          docstatus: true,
          docdirector: {
            include: {
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
                      departmentId: true,
                      divisionId: true,
                      officeId: true,
                      unitId: true,
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
        },
      });
    }

    // อัปเดต viewed ของ log
    if (docdtlogs) {
      updatedLog = await prisma.docdtLog.update({
        where: {
          id: docdtlogs.id,
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
