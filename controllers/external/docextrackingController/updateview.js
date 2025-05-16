const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const { docexId, docstatusId } = req.body;

    const docextrackings = await prisma.docexTracking.findFirst({
      where: {
        docexId: Number(docexId),
        docstatusId: Number(docstatusId),
        receiverCode: req.user.username,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const docexlogs = await prisma.docexLog.findFirst({
      where: {
        docexId: Number(docexId),
        docstatusId: Number(docstatusId),
        receiverCode: req.user.username,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let updatedTracking = null;
    let updatedLog = null;

    if (docextrackings) {
      updatedTracking = await prisma.docexTracking.update({
        where: {
          id: Number(docextrackings.id),
        },
        data: {
          viewed: true,
        },
      });
    }

    if (docexlogs) {
      updatedLog = await prisma.docexLog.update({
        where: {
          id: Number(docexlogs.id),
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
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
