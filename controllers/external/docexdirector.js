const fs = require("fs");
const prisma = require("../../prisma/prisma");
const multer = require("multer");
const path = require("path");
const moment = require("moment-timezone");

exports.create = async (req, res) => {
  try {
    const { docexternalId, departmentId1, departmentId2 } = req.body;

    if (!docexternalId || !departmentId1 || !departmentId2) {
      return res
        .status(400)
        .json({ message: "Missing or invalid required fields" });
    }

    const dataArray = [
      {
        docexternalId: docexternalId,
        departmentId: departmentId1,
        active: 1, // Set active to 1 for departmentId1
      },
      ...departmentId2.map((departmentId, index) => ({
        docexternalId: docexternalId,
        departmentId,
        active: 2, // Set active to 2 for departmentId2
      })),
    ];

    // Create multiple DocexDepartment records
    const newDocexDepartments = await prisma.docexDepartment.createMany({
      data: dataArray,
    });

    console.log("New document external departments:", newDocexDepartments);

    res.status(201).json({
      message: "Document departments created successfully",
      data: newDocexDepartments,
    });
  } catch (error) {
    console.error("Error creating document departments:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const docexternals = await prisma.docExternal.findMany({
      where: {
        roleId: req.user.roleId,
        levelId: req.user.levelId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            code: true,
            firstname: true,
            lastname: true,
          },
        },
        docimportant: {
          select: {
            id: true,
            name: true,
          },
        },
        doctype: {
          select: {
            id: true,
            name: true,
          },
        },
        docstatus: {
          select: {
            id: true,
            name: true,
          },
        },
        DocexDepartment: {
          orderBy: {
            id: "asc",
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      omit: {
        docimportantId: true,
        doctypeId: true,
        docstatusId: true,
      },
    });

    // Format dates
    const formattedDocs = docexternals.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedDocs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { docexdirectorId } = req.params;

    const docex = await prisma.docexDepartment.findMany({
      where: {
        docexternalId: Number(docexdirectorId),
      },
      include: {
        docexternal: true,
        department: true,
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "document not found" });
    }

    // Format dates
    const formattedDocs = docex.map((doc) => ({
      ...doc,
      createdAt: moment(doc.createdAt).tz("Asia/Vientiane").format(),
      updatedAt: moment(doc.updatedAt).tz("Asia/Vientiane").format(),
    }));

    res.json(formattedDocs);
  } catch (err) {
    // err
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const { docexdirectorId } = req.params;
    const { departmentId1, departmentId2 } = req.body;

    // Step 1: Find the document to update
    const docex = await prisma.docexDepartment.findMany({
      where: {
        docexternalId: Number(docexdirectorId),
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Step 2: Delete existing DocexDepartment associations (if any)
    await prisma.docexDepartment.deleteMany({
      where: { docexternalId: Number(docexdirectorId) },
    });

    const dataArray = [
      {
        docexternalId: Number(docexdirectorId),
        departmentId: departmentId1,
        active: 1, // Set active to 1 for departmentId1
      },
      ...departmentId2.map((departmentId, index) => ({
        docexternalId: Number(docexdirectorId),
        departmentId,
        active: 2, // Set active to 2 for departmentId2
      })),
    ];

    // Step 4: Update the docExternal record
    const updated = await prisma.docexDepartment.createMany({
      data: dataArray,
    });

    res.json({ message: "Update successful!", data: updated });
  } catch (err) {
    console.log(err); // Added logging for better error debugging
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { docexdirectorId } = req.params;

    // Step 1: Find the user by ID
    const docex = await prisma.docexDepartment.findMany({
      where: {
        docexternalId: Number(docexdirectorId),
      },
    });

    if (!docex) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Delete related records in docexDepartment
    await prisma.docexDepartment.deleteMany({
      where: { docexternalId: Number(docexdirectorId) },
    });

    res.status(200).json({ message: "Department deleted successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};
