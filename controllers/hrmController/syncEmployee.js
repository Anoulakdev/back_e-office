const prisma = require("../../prisma/prisma");
const axios = require("axios");

module.exports = async (req, res) => {
  try {
    // 1. Login
    const loginResponse = await axios.post(
      `${process.env.URL_API}/auth-svc/auth/login`,
      {
        username: process.env.USERNAME_API,
        password: process.env.PASSWORD_API,
      },
      { timeout: 15000 },
    );

    const token = loginResponse?.data?.data?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Cannot get access token",
      });
    }

    // ຮັບຄ່າ department_id ຫຼື division_id ຈາກທັງ body ແລະ query
    const department_id = req.body?.department_id || req.query?.department_id;
    const division_id = req.body?.division_id || req.query?.division_id;

    // validate
    if (department_id && isNaN(Number(department_id))) {
      return res.status(400).json({
        success: false,
        message: "department_id must be number",
      });
    }
    if (division_id && isNaN(Number(division_id))) {
      return res.status(400).json({
        success: false,
        message: "division_id must be number",
      });
    }

    // 2. Fetch employees
    let employeesData = [];
    const largeDepartmentIds = [10, 11, 12]; // ຝ່າຍຂະໜາດໃຫຍ່ (ພາກກາງ, ພາກເໜືອ, ພາກໃຕ້)

    // Helper ດຶງຂໍ້ມູນພະນັກງານຕາມ division ແບບ reusable
    const fetchByDivision = async (divId) => {
      try {
        const res = await axios.get(
          `${process.env.URL_API}/organization-svc/employee/get?division_id=${divId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000,
          },
        );
        const data = res.data?.data?.employees || res.data?.data;
        return Array.isArray(data) ? data : [];
      } catch (divErr) {
        console.error(`Fetch division ${divId} error:`, divErr.message);
        return [];
      }
    };

    if (division_id) {
      // ກໍລະນີສົ່ງ division_id ມາໂດຍກົງ
      const response = await axios.get(
        `${process.env.URL_API}/organization-svc/employee/get?division_id=${division_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000,
        },
      );
      const data = response.data?.data?.employees || response.data?.data;
      if (Array.isArray(data)) {
        employeesData = data;
      }
    } else if (department_id) {
      const depIdNum = Number(department_id);

      // ຖ້າເປັນຝ່າຍຂະໜາດໃຫຍ່ (10, 11, 12) ໃຫ້ດຶງພ້ອມກັນແບບ Parallel (Promise.all) ເພື່ອປ້ອງກັນ 504 Gateway Time-out
      if (largeDepartmentIds.includes(depIdNum)) {
        const divisions = await prisma.division.findMany({
          where: { departmentId: depIdNum },
          select: { id: true, division_name: true },
        });

        const divisionResults = await Promise.all(
          divisions.map((div) => fetchByDivision(div.id)),
        );
        for (const data of divisionResults) {
          employeesData.push(...data);
        }
      } else {
        // ຝ່າຍທົ່ວໄປ: ດຶງໂດຍກົງ, ຖ້າເກີດ timeout ໃຫ້ fallback ມາດຶງທີລະ division ແບບ Parallel
        try {
          const response = await axios.get(
            `${process.env.URL_API}/organization-svc/employee/get?department_id=${depIdNum}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 60000,
            },
          );
          const data = response.data?.data?.employees || response.data?.data;
          if (Array.isArray(data)) {
            employeesData = data;
          }
        } catch (fetchErr) {
          const divisions = await prisma.division.findMany({
            where: { departmentId: depIdNum },
            select: { id: true },
          });

          if (divisions.length > 0) {
            const divisionResults = await Promise.all(
              divisions.map((div) => fetchByDivision(div.id)),
            );
            for (const data of divisionResults) {
              employeesData.push(...data);
            }
          } else {
            throw fetchErr;
          }
        }
      }
    } else {
      // ກໍລະນີບໍ່ລະບຸ department_id: loop ດຶງທຸກ department
      const departments = await prisma.department.findMany({
        select: { id: true },
      });

      for (const dep of departments) {
        if (largeDepartmentIds.includes(dep.id)) {
          const divisions = await prisma.division.findMany({
            where: { departmentId: dep.id },
            select: { id: true },
          });
          const divisionResults = await Promise.all(
            divisions.map((div) => fetchByDivision(div.id)),
          );
          for (const data of divisionResults) {
            employeesData.push(...data);
          }
        } else {
          try {
            const res = await axios.get(
              `${process.env.URL_API}/organization-svc/employee/get?department_id=${dep.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 60000,
              },
            );
            const data = res.data?.data?.employees || res.data?.data;
            if (Array.isArray(data)) {
              employeesData.push(...data);
            }
          } catch (err) {
            console.error(`Fetch dept ${dep.id} error:`, err.message);
          }
        }
      }
    }

    if (!employeesData.length) {
      return res.status(400).json({
        success: false,
        message: "No employee data found or invalid format",
      });
    }

    // 3. Upsert
    const [
      existing,
      positions,
      departments,
      divisions,
      offices,
      units,
      subunits,
    ] = await Promise.all([
      prisma.employee.findMany({ select: { id: true } }),
      prisma.position.findMany({ select: { id: true } }),
      prisma.department.findMany({ select: { id: true } }),
      prisma.division.findMany({ select: { id: true } }),
      prisma.office.findMany({ select: { id: true } }),
      prisma.unit.findMany({ select: { id: true } }),
      prisma.subunit.findMany({ select: { id: true } }),
    ]);

    const existingIds = new Set(existing.map((d) => d.id));
    const positionIds = new Set(positions.map((p) => p.id));
    const departmentIds = new Set(departments.map((d) => d.id));
    const divisionIds = new Set(divisions.map((d) => d.id));
    const officeIds = new Set(offices.map((o) => o.id));
    const unitIds = new Set(units.map((u) => u.id));
    const subunitIds = new Set(subunits.map((u) => u.id));

    let updated = 0;
    let created = 0;
    let skipped = 0;

    // ແບ່ງ batch upsert ເທື່ອລະ 50 ຄົນ ເພື່ອບໍ່ໃຫ້ DB connection pool ເຕັມ
    const batchSize = 50;
    for (let i = 0; i < employeesData.length; i += batchSize) {
      const batch = employeesData.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (d) => {
          const empId = Number(d.emp_id);
          const empsId = Number(
            d.office?.employeeStatus?.emps_id || d.office?.emps_id,
          );
          // ກັ່ນຕອງສະເພາະພະນັກງານທີ່ປະຈຳການ (emps_id = 1)
          if (!empId || empsId !== 1) {
            skipped++;
            return null;
          }

          const isNew = !existingIds.has(empId);

          if (isNew) {
            created++;
          } else {
            updated++;
          }

          const rawPosId = Number(d.office?.pos_id);
          const rawDepId = Number(d.office?.department_id);
          const rawDivId = Number(d.office?.division_id);
          const rawOffId = Number(d.office?.office_id);
          const rawUnitId = Number(d.office?.unit_id);
          const rawSubUnitId = Number(d.office?.sub_unit_id);

          const posId = rawPosId && positionIds.has(rawPosId) ? rawPosId : null;
          const departmentId =
            rawDepId && departmentIds.has(rawDepId) ? rawDepId : null;
          const divisionId =
            rawDivId && divisionIds.has(rawDivId) ? rawDivId : null;
          const officeId =
            rawOffId && officeIds.has(rawOffId) ? rawOffId : null;
          const unitId = rawUnitId && unitIds.has(rawUnitId) ? rawUnitId : null;
          const subunitId =
            rawSubUnitId && subunitIds.has(rawSubUnitId) ? rawSubUnitId : null;

          const gender = d.gender === "Female" ? "Female" : "Male";

          return prisma.employee.upsert({
            where: { id: empId },
            update: {
              first_name: d.first_name_la,
              last_name: d.last_name_la,
              emp_code: d.emp_code,
              gender: gender,
              posId: posId,
              departmentId: departmentId,
              divisionId: divisionId,
              officeId: officeId,
              unitId: unitId,
              subunitId: subunitId,
              tel: d.phone || null,
              email: d.email || null,
              empimg: d.image
                ? `${process.env.URL_API}/organization-svc/employee/getEmpImg/${d.emp_code}/${d.image}`
                : null,
              createdAt: d.created_at ? new Date(d.created_at) : new Date(),
              updatedAt: d.created_at ? new Date(d.created_at) : new Date(),
            },
            create: {
              id: empId,
              first_name: d.first_name_la,
              last_name: d.last_name_la,
              emp_code: d.emp_code,
              gender: gender,
              posId: posId,
              departmentId: departmentId,
              divisionId: divisionId,
              officeId: officeId,
              unitId: unitId,
              subunitId: subunitId,
              tel: d.phone || null,
              email: d.email || null,
              empimg: d.image
                ? `${process.env.URL_API}/organization-svc/employee/getEmpImg/${d.emp_code}/${d.image}`
                : null,
              createdAt: d.created_at ? new Date(d.created_at) : new Date(),
              updatedAt: d.created_at ? new Date(d.created_at) : new Date(),
            },
          });
        }),
      );
    }

    return res.status(200).json({
      success: true,
      total: employeesData.length,
      updated,
      created,
      skipped,
      message: "employee sync completed",
    });
  } catch (err) {
    console.error("Sync employee error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
