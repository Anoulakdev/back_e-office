const fs = require("fs").promises;
const path = require("path");
const prisma = require("../../../prisma/prisma");

module.exports = async (req, res) => {
  try {
    const {
      departmentId,
      departure_type,
      search,
      startDate,
      endDate,
    } = { ...req.query, ...req.body };

    // สร้างเงื่อนไข where
    const where = {};

    // ถ้ามี departmentId ให้ค้นหาจาก department ของ employee
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

    if (startDate && endDate) {
      const sDate = new Date(`${startDate}T00:00:00+07:00`);
      const eDate = new Date(`${endDate}T23:59:59+07:00`);

      where.createdAt = {
        gte: new Date(sDate.toISOString()),
        lte: new Date(eDate.toISOString()),
      };
    }

    // ดึงข้อมูลเอกสารทั้งหมดที่ตรงตามเงื่อนไข (เอาเฉพาะ id และ docin_file)
    const docinternals = await prisma.docInternal.findMany({
      where,
      select: {
        id: true,
        docin_file: true,
      },
    });

    // รวบรวม ID ทั้งหมดเข้า Array
    const targetIds = docinternals.map((doc) => doc.id);

    if (targetIds.length === 0) {
      return res.status(200).json({
        message: "No documents found to delete",
        deletedCount: 0,
        deletedIds: [],
      });
    }

    // ค้นหาไฟล์แนบจาก logs และ trackings ที่เกี่ยวข้องในรอบเดียว (Batch Query)
    const [docinLogs, docinTrackings] = await Promise.all([
      prisma.docinLog.findMany({
        where: {
          docinId: { in: targetIds },
          docinlog_file: { not: null },
        },
        select: { docinlog_file: true },
      }),
      prisma.docinTracking.findMany({
        where: {
          docinId: { in: targetIds },
          docinlog_file: { not: null },
        },
        select: { docinlog_file: true },
      }),
    ]);

    // รวบรวม path ของไฟล์ทั้งหมดที่ต้องลบ (ใช้ Set ป้องกันไฟล์ซ้ำ)
    const filesToDelete = new Set();

    for (const doc of docinternals) {
      if (doc.docin_file) {
        filesToDelete.add(
          path.join(__dirname, "../../../uploads/document", doc.docin_file)
        );
      }
    }

    for (const log of docinLogs) {
      if (log.docinlog_file) {
        filesToDelete.add(
          path.join(__dirname, "../../../uploads/documentlog", log.docinlog_file)
        );
      }
    }

    for (const trk of docinTrackings) {
      if (trk.docinlog_file) {
        filesToDelete.add(
          path.join(__dirname, "../../../uploads/documentlog", trk.docinlog_file)
        );
      }
    }

    // 1. ลบไฟล์ออกจากระบบแบบ Asynchronous Parallel (Non-blocking I/O)
    await Promise.allSettled(
      Array.from(filesToDelete).map((filePath) =>
        fs.unlink(filePath).catch((fileErr) => {
          if (fileErr.code !== "ENOENT") {
            console.error(`Error deleting file ${filePath}:`, fileErr.message);
          }
        })
      )
    );

    // 2. ลบข้อมูลออกจากฐานข้อมูลผ่าน Transaction (แบ่ง Chunk ละ 500 รายการ เพื่อประสิทธิภาพและความปลอดภัย)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
      const chunkIds = targetIds.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction([
        prisma.docinLog.deleteMany({
          where: { docinId: { in: chunkIds } },
        }),
        prisma.docinTracking.deleteMany({
          where: { docinId: { in: chunkIds } },
        }),
        prisma.docInternal.deleteMany({
          where: { id: { in: chunkIds } },
        }),
      ]);
    }

    res.status(200).json({
      message: `Deleted ${targetIds.length} documents successfully!`,
      deletedCount: targetIds.length,
      deletedIds: targetIds,
    });
  } catch (err) {
    console.error("Error in listdepartment (delete):", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
