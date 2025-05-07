const prisma = require("../../../prisma/prisma");
const moment = require("moment-timezone");

module.exports = async (req, res) => {
  try {
    const { docinId } = req.params;

    if (isNaN(Number(docinId))) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const docins = await prisma.docInternal.findUnique({
      where: {
        id: Number(docinId),
      },
    });

    const docinlogs = await prisma.docinLog.findMany({
      where: {
        docinId: Number(docinId),
      },
      // orderBy: [{ createdAt: "asc" }],
      include: {
        docstatus: true,
        assigner: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
                tel: true,
                department: {
                  select: { id: true, department_name: true },
                },
                division: {
                  select: {
                    id: true,
                    division_name: true,
                    branch_id: true,
                  },
                },
                office: {
                  select: {
                    id: true,
                    office_name: true,
                  },
                },
              },
            },
          },
        },
        receiver: {
          select: {
            username: true,
            employee: {
              select: {
                first_name: true,
                last_name: true,
                gender: true,
                tel: true,
                department: {
                  select: { id: true, department_name: true },
                },
                division: {
                  select: {
                    id: true,
                    division_name: true,
                    branch_id: true,
                  },
                },
                office: {
                  select: {
                    id: true,
                    office_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    docinlogs.sort((a, b) => {
      if (a.docstatusId === 1 && b.docstatusId !== 1) return -1;
      if (a.docstatusId !== 1 && b.docstatusId === 1) return 1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    if (!docinlogs.length) {
      return res.status(404).json({ message: "Document not found" });
    }

    const groupedData = docinlogs.reduce((acc, log) => {
      const emp = log.receiver?.employee || log.assigner?.employee;

      const deptInfo = emp?.department;
      const divisionInfo = emp?.division;
      const officeInfo = emp?.office;
      const branchId = divisionInfo?.branch_id || 1;

      const deptId = deptInfo?.id || "Unknown";
      const deptName = deptInfo?.department_name || "Unknown";

      const divisionId = divisionInfo?.id || "Unknown";
      const divisionName = divisionInfo?.division_name || "Unknown";

      const officeId = officeInfo?.id || "Unknown";
      const officeName = officeInfo?.office_name || "Unknown";

      let departmentGroup = acc.find((d) => d.departmentId === deptId);
      if (!departmentGroup) {
        departmentGroup = {
          departmentId: deptId,
          department_name: deptName,
          ...(deptId === 15 ? { logs: [] } : { divisions: [] }),
        };
        acc.push(departmentGroup);
      }

      const formattedLog = {
        ...log,
        createdAt: moment(log.createdAt).tz("Asia/Vientiane").format(),
        updatedAt: moment(log.updatedAt).tz("Asia/Vientiane").format(),
      };

      if (deptId === 15) {
        departmentGroup.logs.push(formattedLog);
      } else {
        let divisionGroup = departmentGroup.divisions.find(
          (d) => d.divisionId === divisionId
        );

        if (!divisionGroup) {
          divisionGroup = {
            divisionId,
            division_name: divisionName,
            ...(branchId === 2 ? { offices: [] } : { logs: [] }),
          };
          departmentGroup.divisions.push(divisionGroup);
        }

        if (branchId === 2) {
          let officeGroup = divisionGroup.offices.find(
            (o) => o.officeId === officeId
          );

          if (!officeGroup) {
            officeGroup = {
              officeId,
              office_name: officeName,
              logs: [],
            };
            divisionGroup.offices.push(officeGroup);
          }

          officeGroup.logs.push(formattedLog);
        } else {
          divisionGroup.logs.push(formattedLog);
        }
      }

      return acc;
    }, []);

    // Sort groupedData
    // groupedData.sort((a, b) => {
    //   if (a.departmentId === 15) return -1;
    //   if (b.departmentId === 15) return 1;
    //   return 0;
    // });

    // Sort divisions and offices
    groupedData.forEach((department) => {
      if (department.divisions) {
        department.divisions.sort((a, b) => 0);

        department.divisions.forEach((division) => {
          if (division.offices) {
            division.offices.sort((a, b) => 0);
          }
        });
      }
    });

    res.json({ groupedLogs: groupedData });
  } catch (err) {
    console.error("Error in gethistory:", err);
    res.status(500).json({
      message: "Server Error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};
