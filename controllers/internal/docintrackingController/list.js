const fs = require("fs");
const prisma = require("../../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/documentlog");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("docinlog_file");

module.exports = async (req, res) => {
  try {
    const { selectDateStart, selectDateEnd } = req.query;
    const where = {};

    if (selectDateStart && selectDateEnd) {
      const startDate = new Date(`${selectDateStart}T00:00:00+07:00`);

      const endDate = new Date(`${selectDateEnd}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(startDate.toISOString()),
        lte: new Date(endDate.toISOString()),
      };
    }

    if (req.user.roleId === 2) {
      where.receiver = {
        roleId: 2,
      };
    } else {
      where.receiverCode = req.user.username;
    }

    const doctrackings = await prisma.docinTracking.findMany({
      where,
      include: {
        docstatus: true,
        docinternal: {
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
                departmentId: true,
                divisionId: true,
                officeId: true,
                unitId: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format dates
    const formattedDocs = doctrackings.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
      docinternal: {
        ...doc.docinternal,
        createdAt: moment(doc.docinternal.createdAt)
          .tz("Asia/Vientiane")
          .format(),
        updatedAt: moment(doc.docinternal.updatedAt)
          .tz("Asia/Vientiane")
          .format(),
      },
    }));

    res.status(200).json(formattedDocs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
