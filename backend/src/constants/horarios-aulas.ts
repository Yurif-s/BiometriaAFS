export interface HorarioAula {
  periodo: number;
  inicio: string;
  fim: string;
}

export const HORARIOS_AULAS: HorarioAula[] = [
  { periodo: 1, inicio: "07:20", fim: "08:10" },
  { periodo: 2, inicio: "08:10", fim: "09:00" },
  { periodo: 3, inicio: "09:15", fim: "10:05" },
  { periodo: 4, inicio: "10:05", fim: "10:55" },
  { periodo: 5, inicio: "10:55", fim: "11:45" },
  { periodo: 6, inicio: "13:00", fim: "13:50" },
  { periodo: 7, inicio: "13:50", fim: "14:40" },
  { periodo: 8, inicio: "14:55", fim: "15:45" },
  { periodo: 9, inicio: "15:45", fim: "16:35" },
];

export function toMin(h: string): number | null {
  if (!h) return null;
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

export function calcularTempos(entrada: string | null, saida: string | null, aulas: HorarioAula[] = HORARIOS_AULAS): number[] {
  if (!entrada && !saida) {
    return aulas.map(aula => aula.periodo);
  }

  const ent = entrada ? toMin(entrada) : null;
  const sai = saida ? toMin(saida) : null;

  if (ent === null && sai === null) {
    return aulas.map(aula => aula.periodo);
  }

  const tempos: number[] = [];
  aulas.forEach(aula => {
    const ini = toMin(aula.inicio)!;
    const fim = toMin(aula.fim)!;

    const presente = ent !== null && ent < fim && (sai === null || sai > ini);

    if (!presente) {
      tempos.push(aula.periodo);
    }
  });

  return tempos;
}
