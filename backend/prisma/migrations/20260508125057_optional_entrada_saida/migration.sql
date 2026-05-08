/*
  Warnings:

  - Made the column `biometria` on table `Aluno` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Aluno" ALTER COLUMN "biometria" SET NOT NULL,
ALTER COLUMN "entrada" DROP NOT NULL,
ALTER COLUMN "saida" DROP NOT NULL;
