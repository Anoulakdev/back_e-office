-- CreateIndex
CREATE INDEX "Division_departmentId_idx" ON "Division"("departmentId");

-- CreateIndex
CREATE INDEX "DocDirector_creatorCode_idx" ON "DocDirector"("creatorCode");

-- CreateIndex
CREATE INDEX "DocDirector_createdAt_idx" ON "DocDirector"("createdAt");

-- CreateIndex
CREATE INDEX "DocDirector_priorityId_idx" ON "DocDirector"("priorityId");

-- CreateIndex
CREATE INDEX "DocDirector_doctypeId_idx" ON "DocDirector"("doctypeId");

-- CreateIndex
CREATE INDEX "DocExport_docexId_idx" ON "DocExport"("docexId");

-- CreateIndex
CREATE INDEX "DocExport_signatorCode_idx" ON "DocExport"("signatorCode");

-- CreateIndex
CREATE INDEX "DocExport_exporterCode_idx" ON "DocExport"("exporterCode");

-- CreateIndex
CREATE INDEX "DocExternal_creatorCode_idx" ON "DocExternal"("creatorCode");

-- CreateIndex
CREATE INDEX "DocExternal_createdAt_idx" ON "DocExternal"("createdAt");

-- CreateIndex
CREATE INDEX "DocExternal_priorityId_idx" ON "DocExternal"("priorityId");

-- CreateIndex
CREATE INDEX "DocExternal_doctypeId_idx" ON "DocExternal"("doctypeId");

-- CreateIndex
CREATE INDEX "DocExternal_outsiderId_idx" ON "DocExternal"("outsiderId");

-- CreateIndex
CREATE INDEX "DocInternal_creatorCode_idx" ON "DocInternal"("creatorCode");

-- CreateIndex
CREATE INDEX "DocInternal_createdAt_idx" ON "DocInternal"("createdAt");

-- CreateIndex
CREATE INDEX "DocInternal_priorityId_idx" ON "DocInternal"("priorityId");

-- CreateIndex
CREATE INDEX "DocInternal_doctypeId_idx" ON "DocInternal"("doctypeId");

-- CreateIndex
CREATE INDEX "DocdtLog_docdtId_idx" ON "DocdtLog"("docdtId");

-- CreateIndex
CREATE INDEX "DocdtLog_receiverCode_idx" ON "DocdtLog"("receiverCode");

-- CreateIndex
CREATE INDEX "DocdtLog_assignerCode_idx" ON "DocdtLog"("assignerCode");

-- CreateIndex
CREATE INDEX "DocdtLog_rankId_idx" ON "DocdtLog"("rankId");

-- CreateIndex
CREATE INDEX "DocdtLog_roleId_idx" ON "DocdtLog"("roleId");

-- CreateIndex
CREATE INDEX "DocdtLog_departmentId_idx" ON "DocdtLog"("departmentId");

-- CreateIndex
CREATE INDEX "DocdtLog_divisionId_idx" ON "DocdtLog"("divisionId");

-- CreateIndex
CREATE INDEX "DocdtLog_officeId_idx" ON "DocdtLog"("officeId");

-- CreateIndex
CREATE INDEX "DocdtLog_unitId_idx" ON "DocdtLog"("unitId");

-- CreateIndex
CREATE INDEX "DocdtLog_docstatusId_idx" ON "DocdtLog"("docstatusId");

-- CreateIndex
CREATE INDEX "DocdtTracking_docdtId_idx" ON "DocdtTracking"("docdtId");

-- CreateIndex
CREATE INDEX "DocdtTracking_receiverCode_idx" ON "DocdtTracking"("receiverCode");

-- CreateIndex
CREATE INDEX "DocdtTracking_assignerCode_idx" ON "DocdtTracking"("assignerCode");

-- CreateIndex
CREATE INDEX "DocdtTracking_docstatusId_idx" ON "DocdtTracking"("docstatusId");

-- CreateIndex
CREATE INDEX "DocexLog_docexId_idx" ON "DocexLog"("docexId");

-- CreateIndex
CREATE INDEX "DocexLog_receiverCode_idx" ON "DocexLog"("receiverCode");

-- CreateIndex
CREATE INDEX "DocexLog_assignerCode_idx" ON "DocexLog"("assignerCode");

-- CreateIndex
CREATE INDEX "DocexLog_rankId_idx" ON "DocexLog"("rankId");

-- CreateIndex
CREATE INDEX "DocexLog_roleId_idx" ON "DocexLog"("roleId");

-- CreateIndex
CREATE INDEX "DocexLog_departmentId_idx" ON "DocexLog"("departmentId");

-- CreateIndex
CREATE INDEX "DocexLog_divisionId_idx" ON "DocexLog"("divisionId");

-- CreateIndex
CREATE INDEX "DocexLog_officeId_idx" ON "DocexLog"("officeId");

-- CreateIndex
CREATE INDEX "DocexLog_unitId_idx" ON "DocexLog"("unitId");

-- CreateIndex
CREATE INDEX "DocexLog_docstatusId_idx" ON "DocexLog"("docstatusId");

-- CreateIndex
CREATE INDEX "DocexTracking_docexId_idx" ON "DocexTracking"("docexId");

-- CreateIndex
CREATE INDEX "DocexTracking_receiverCode_idx" ON "DocexTracking"("receiverCode");

-- CreateIndex
CREATE INDEX "DocexTracking_assignerCode_idx" ON "DocexTracking"("assignerCode");

-- CreateIndex
CREATE INDEX "DocexTracking_docstatusId_idx" ON "DocexTracking"("docstatusId");

-- CreateIndex
CREATE INDEX "DocinLog_docinId_idx" ON "DocinLog"("docinId");

-- CreateIndex
CREATE INDEX "DocinLog_receiverCode_idx" ON "DocinLog"("receiverCode");

-- CreateIndex
CREATE INDEX "DocinLog_assignerCode_idx" ON "DocinLog"("assignerCode");

-- CreateIndex
CREATE INDEX "DocinLog_rankId_idx" ON "DocinLog"("rankId");

-- CreateIndex
CREATE INDEX "DocinLog_roleId_idx" ON "DocinLog"("roleId");

-- CreateIndex
CREATE INDEX "DocinLog_departmentId_idx" ON "DocinLog"("departmentId");

-- CreateIndex
CREATE INDEX "DocinLog_divisionId_idx" ON "DocinLog"("divisionId");

-- CreateIndex
CREATE INDEX "DocinLog_officeId_idx" ON "DocinLog"("officeId");

-- CreateIndex
CREATE INDEX "DocinLog_unitId_idx" ON "DocinLog"("unitId");

-- CreateIndex
CREATE INDEX "DocinLog_docstatusId_idx" ON "DocinLog"("docstatusId");

-- CreateIndex
CREATE INDEX "DocinTracking_docinId_idx" ON "DocinTracking"("docinId");

-- CreateIndex
CREATE INDEX "DocinTracking_receiverCode_idx" ON "DocinTracking"("receiverCode");

-- CreateIndex
CREATE INDEX "DocinTracking_assignerCode_idx" ON "DocinTracking"("assignerCode");

-- CreateIndex
CREATE INDEX "DocinTracking_docstatusId_idx" ON "DocinTracking"("docstatusId");

-- CreateIndex
CREATE INDEX "Employee_posId_idx" ON "Employee"("posId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_divisionId_idx" ON "Employee"("divisionId");

-- CreateIndex
CREATE INDEX "Employee_officeId_idx" ON "Employee"("officeId");

-- CreateIndex
CREATE INDEX "Employee_unitId_idx" ON "Employee"("unitId");

-- CreateIndex
CREATE INDEX "Office_divisionId_idx" ON "Office"("divisionId");

-- CreateIndex
CREATE INDEX "Outsider_belongId_idx" ON "Outsider"("belongId");

-- CreateIndex
CREATE INDEX "Permission_rolemenuId_idx" ON "Permission"("rolemenuId");

-- CreateIndex
CREATE INDEX "Position_poscodeId_idx" ON "Position"("poscodeId");

-- CreateIndex
CREATE INDEX "PositionCode_posgroupId_idx" ON "PositionCode"("posgroupId");

-- CreateIndex
CREATE INDEX "RoleMenu_roleId_idx" ON "RoleMenu"("roleId");

-- CreateIndex
CREATE INDEX "Unit_divisionId_idx" ON "Unit"("divisionId");

-- CreateIndex
CREATE INDEX "Unit_officeId_idx" ON "Unit"("officeId");

-- CreateIndex
CREATE INDEX "User_employeeId_idx" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_rankId_idx" ON "User"("rankId");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
