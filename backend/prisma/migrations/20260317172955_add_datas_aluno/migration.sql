/*
  Warnings:

  - Added the required column `entrada` to the `Aluno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saida` to the `Aluno` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "entrada" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "saida" TIMESTAMP(3) NOT NULL;
