-- CreateTable
CREATE TABLE "master_dok_pkb" (
    "id" SERIAL NOT NULL,
    "article" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_dok_pkb_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "master_dok_pkb_article_key" ON "master_dok_pkb"("article");
