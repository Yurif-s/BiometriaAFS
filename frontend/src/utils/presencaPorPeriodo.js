import { HORARIOS_AULAS } from '../constants/horariosAulas';

// Converte HH:MM para minutos
export function toMin(h) {
  if (!h) return null;
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

// Calcula períodos faltados
export function calcularTempos(entrada, saida, aulas = HORARIOS_AULAS) {
  const ent = toMin(entrada);
  const sai = toMin(saida);

  // Sem horários = falta em todos
  if (ent === null && sai === null) {
    return aulas.map(aula => aula.periodo);
  }

  const tempos = [];
  aulas.forEach(aula => {
    const ini = toMin(aula.inicio);
    const fim = toMin(aula.fim);

    // Presença se houve interseção: entrada < fim da aula E (saída é nula ou saída > início da aula)
    const presente = ent < fim && (sai === null || sai > ini);

    if (!presente) {
      tempos.push(aula.periodo);
    }
  });

  return tempos;
}
