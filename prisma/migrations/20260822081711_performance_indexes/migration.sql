-- CreateIndex
CREATE INDEX "DocDirector_assignto_idx" ON "DocDirector"("assignto");

-- CreateIndex
CREATE INDEX "DocExternal_assignto_idx" ON "DocExternal"("assignto");

-- CreateIndex
CREATE INDEX "DocExternal_extype_idx" ON "DocExternal"("extype");

-- CreateIndex
CREATE INDEX "DocInternal_fromDepartmentId_idx" ON "DocInternal"("fromDepartmentId");

-- CreateIndex
CREATE INDEX "DocInternal_fromDivisionId_idx" ON "DocInternal"("fromDivisionId");

-- CreateIndex
CREATE INDEX "DocInternal_departure_type_idx" ON "DocInternal"("departure_type");

-- CreateIndex
CREATE INDEX "DocInternal_assignto_idx" ON "DocInternal"("assignto");

-- CreateIndex
CREATE INDEX "DocdtLog_createdAt_idx" ON "DocdtLog"("createdAt");

-- CreateIndex
CREATE INDEX "DocdtLog_docdtId_createdAt_idx" ON "DocdtLog"("docdtId", "createdAt");

-- CreateIndex
CREATE INDEX "DocdtTracking_docdtId_receiverCode_idx" ON "DocdtTracking"("docdtId", "receiverCode");

-- CreateIndex
CREATE INDEX "DocdtTracking_receiverCode_viewed_idx" ON "DocdtTracking"("receiverCode", "viewed");

-- CreateIndex
CREATE INDEX "DocexLog_createdAt_idx" ON "DocexLog"("createdAt");

-- CreateIndex
CREATE INDEX "DocexLog_docexId_createdAt_idx" ON "DocexLog"("docexId", "createdAt");

-- CreateIndex
CREATE INDEX "DocexTracking_docexId_receiverCode_idx" ON "DocexTracking"("docexId", "receiverCode");

-- CreateIndex
CREATE INDEX "DocexTracking_receiverCode_viewed_idx" ON "DocexTracking"("receiverCode", "viewed");

-- CreateIndex
CREATE INDEX "DocinLog_createdAt_idx" ON "DocinLog"("createdAt");

-- CreateIndex
CREATE INDEX "DocinLog_docinId_createdAt_idx" ON "DocinLog"("docinId", "createdAt");

-- CreateIndex
CREATE INDEX "DocinTracking_docinId_receiverCode_idx" ON "DocinTracking"("docinId", "receiverCode");

-- CreateIndex
CREATE INDEX "DocinTracking_receiverCode_viewed_idx" ON "DocinTracking"("receiverCode", "viewed");
