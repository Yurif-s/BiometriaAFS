import { HORARIOS_AULAS } from '../constants/horariosAulas';

// Converte HH:MM para minutos
export function toMin(h) {
  if (!h) return null;
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

// Calcula períodos faltados
export function calcularTempos(entrada, saida, aulas = HORARIOS_AULAS) {
  return entrada
    ? calcularTemposPorIntervalos([{ entrada, saida }], aulas)
    : aulas.map(aula => aula.periodo);
}

export function calcularTemposPorIntervalos(intervalos, aulas = HORARIOS_AULAS) {
  if (!intervalos.length) {
    return aulas.map(aula => aula.periodo);
  }

  const intervalosMin = intervalos
    .map((intervalo) => ({
      entrada: toMin(intervalo.entrada),
      saida: intervalo.saida ? toMin(intervalo.saida) : null,
    }))
    .filter((intervalo) => intervalo.entrada !== null);

  if (!intervalosMin.length) {
    return aulas.map(aula => aula.periodo);
  }

  const tempos = [];
  aulas.forEach(aula => {
    const ini = toMin(aula.inicio);
    const fim = toMin(aula.fim);

    const presente = intervalosMin.some(intervalo => (
      intervalo.entrada < fim && (intervalo.saida === null || intervalo.saida > ini)
    ));

    if (!presente) {
      tempos.push(aula.periodo);
    }
  });

  return tempos;
}
