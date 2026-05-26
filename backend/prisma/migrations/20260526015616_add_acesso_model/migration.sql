-- CreateTable
CREATE TABLE "Acesso" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aluno_id" INTEGER NOT NULL,

    CONSTRAINT "Acesso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Acesso" ADD CONSTRAINT "Acesso_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
