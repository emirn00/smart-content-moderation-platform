-- CreateTable
CREATE TABLE "AiAnalysisResult" (
    "id" SERIAL NOT NULL,
    "contentId" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "toxicityScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "detectedCategories" TEXT[],
    "categoryScores" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiAnalysisResult_contentId_key" ON "AiAnalysisResult"("contentId");

-- AddForeignKey
ALTER TABLE "AiAnalysisResult" ADD CONSTRAINT "AiAnalysisResult_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
