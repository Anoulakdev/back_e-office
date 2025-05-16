const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docinId, docstatusId } = req.query;

    const docinIdNum = Number(docinId);
    const docstatusIdNum = Number(docstatusId);

    if (isNaN(docinIdNum) || isNaN(docstatusIdNum)) {
      return res
        .status(400)
        .json({ message: "Invalid docinId or docstatusId" });
    }

    let docintrackings = null;
    let docinlogs = null;

    if (req.user.roleId === 2) {
      docintrackings = await prisma.docinTracking.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          receiver: {
            roleId: 2,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      docinlogs = await prisma.docinLog.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          roleId: 2,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      docintrackings = await prisma.docinTracking.findFirst({
        where: {
          docinId: docinIdNum,
          docstatusId: docstatusIdNum,
          receiverCode: req.user.username,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      docinlogs = await prisma.docinLog.findFirst({
        where: {
          docinId: docinIdNum,
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

    if (docintrackings) {
      updatedTracking = await prisma.docinTracking.update({
        where: {
          id: docintrackings.id,
        },
        data: {
          viewed: true,
        },
      });
    }

    if (docinlogs) {
      updatedLog = await prisma.docinLog.update({
        where: {
          id: docinlogs.id,
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
