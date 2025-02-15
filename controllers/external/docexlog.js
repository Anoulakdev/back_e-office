const prisma = require("../../prisma/prisma");
const moment = require("moment-timezone");

exports.listdocexternal = async (req, res) => {
  try {
    let docexlogs;

    if (req.user.roleId === 10) {
      // กรณี roleId === 10 ใช้ receiverCode
      docexlogs = await prisma.docexLog.findMany({
        where: {
          receiverCode: req.user.emp_code,
        },
        orderBy: {
          docexId: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              priority: true,
              doctype: true,
            },
          },
        },
      });
    } else {
      // กรณีอื่น ๆ ใช้ rankId, roleId, departmentId, divisionId, officeId, unitId
      docexlogs = await prisma.docexLog.findMany({
        where: {
          rankId: req.user.rankId,
          roleId: req.user.roleId,
          departmentId: req.user.departmentId,
          divisionId: req.user.divisionId,
          officeId: req.user.officeId,
          unitId: req.user.unitId,
        },
        orderBy: {
          docexId: "desc",
        },
        distinct: ["docexId"],
        include: {
          docexternal: {
            include: {
              priority: true,
              doctype: true,
            },
          },
        },
      });
    }

    // แปลงเวลาเป็น Asia/Vientiane
    const formattedDocs = docexlogs.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
      docexternal: {
        ...doc.docexternal,
        createdAt: moment(doc.docexternal.createdAt)
          .tz("Asia/Vientiane")
          .format(),
        updatedAt: moment(doc.docexternal.updatedAt)
          .tz("Asia/Vientiane")
          .format(),
      },
    }));

    res.json(formattedDocs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.gethistory = async (req, res) => {
  try {
    const { docexId } = req.params;

    const docex = await prisma.docExternal.findUnique({
      where: {
        id: Number(docexId),
      },
      include: {
        docexlogs: {
          include: {
            assigner: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
            receiver: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "document not found" });
    }

    // Format dates
    const formattedDocs = {
      ...docex,
      createdAt: moment(docex.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(docex.updatedAt).tz("Asia/Vientiane").format(),
      docexlogs: docex.docexlogs.map((log) => ({
        ...log,
        createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(log.updatedAt).tz("Asia/Vientiane").format(),
      })),
    };

    res.json(formattedDocs);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
