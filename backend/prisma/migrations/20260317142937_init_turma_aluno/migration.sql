/*
  Warnings:

  - You are about to drop the column `ano` on the `Aluno` table. All the data in the column will be lost.
  - You are about to drop the column `curso_id` on the `Aluno` table. All the data in the column will be lost.
  - The `biometria` column on the `Aluno` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Curso` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `turma_id` to the `Aluno` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_curso_id_fkey";

-- AlterTable
ALTER TABLE "Aluno" DROP COLUMN "ano",
DROP COLUMN "curso_id",
ADD COLUMN     "turma_id" INTEGER NOT NULL,
DROP COLUMN "biometria",
ADD COLUMN     "biometria" INTEGER;

-- DropTable
DROP TABLE "Curso";

-- CreateTable
CREATE TABLE "Turma" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
