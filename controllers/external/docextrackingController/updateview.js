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

    // หาข้อมูลจาก docexTracking
    const docextrackings = await prisma.docexTracking.findFirst({
      where: {
        docexId: docexIdNum,
        docstatusId: docstatusIdNum,
        receiverCode: req.user.username,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // หาข้อมูลจาก docexLog
    const docexlogs = await prisma.docexLog.findFirst({
      where: {
        docexId: docexIdNum,
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
    if (docextrackings) {
      updatedTracking = await prisma.docexTracking.update({
        where: {
          id: docextrackings.id,
        },
        data: {
          viewed: true,
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
