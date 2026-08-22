const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const {
      departmentId,
      departure_type,
      search,
      page,
      limit,
    } = req.query;

    // แปลงค่า page & limit เป็นตัวเลข
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;

    // คำนวณค่าการแบ่งหน้า
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    // สร้างเงื่อนไข where
    const where = {};

    // ถ้ามี departmentId ให้ค้นหาจาก department ของ employee หรือ fromDepartmentId
    if (departmentId && Number(departmentId) > 0) {
      where.creator = {
        employee: {
          departmentId: Number(departmentId),
        },
      };
    }

    if (departure_type && Number(departure_type) > 0) {
      where.departure_type = Number(departure_type);
    }

    if (search) {
      where.OR = [
        { docin_no: { contains: search, mode: "insensitive" } },
        { docin_title: { contains: search, mode: "insensitive" } },
      ];
    }

    const docinternals = await prisma.docInternal.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        priority: true,
        doctype: true,
        fromDepartment: true,
        fromDivision: true,
        creator: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                emp_code: true,
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
      },
    });

    const total = await prisma.docInternal.count({ where });

    // Format dates
    const formattedDocs = docinternals.map((doc) => ({
      docinId: doc.id,
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json({
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      formattedDocs,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
