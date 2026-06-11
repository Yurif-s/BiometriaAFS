import { calcularTempos, calcularTemposPorIntervalos } from '../src/constants/horarios-aulas';

describe('Cálculo de Presenças por Período (calcularTempos)', () => {
  const aulas = [
    { periodo: 1, inicio: "07:20", fim: "08:10" },
    { periodo: 2, inicio: "08:10", fim: "09:00" },
    { periodo: 3, inicio: "09:15", fim: "10:05" },
  ];

  it('deve retornar faltas em todos os períodos se entrada e saída forem nulas', () => {
    const faltas = calcularTempos(null, null, aulas);
    expect(faltas).toEqual([1, 2, 3]);
  });

  it('deve indicar presença em todas as aulas se o aluno entrou antes e saiu depois', () => {
    const faltas = calcularTempos("07:15", "10:15", aulas);
    expect(faltas).toEqual([]);
  });

  it('deve indicar falta no período 3 se o aluno saiu antes dele começar', () => {
    // Entrou às 07:15 e saiu às 08:30 (presente no período 1 e 2, faltou no 3)
    const faltas = calcularTempos("07:15", "08:30", aulas);
    expect(faltas).toEqual([3]);
  });

  it('deve indicar falta no período 1 e 2 se o aluno entrou após o início do período 3', () => {
    // Entrou às 09:20 e não saiu ainda (presente no período 3, faltou no 1 e 2)
    const faltas = calcularTempos("09:20", null, aulas);
    expect(faltas).toEqual([1, 2]);
  });

  it('deve indicar falta no intervalo entre uma saída antecipada e uma nova entrada', () => {
    const aulasDia = [
      { periodo: 1, inicio: "07:20", fim: "08:10" },
      { periodo: 2, inicio: "08:10", fim: "09:00" },
      { periodo: 3, inicio: "09:15", fim: "10:05" },
      { periodo: 4, inicio: "10:05", fim: "10:55" },
      { periodo: 5, inicio: "10:55", fim: "11:45" },
      { periodo: 6, inicio: "13:00", fim: "13:50" },
    ];

    const faltas = calcularTemposPorIntervalos([
      { entrada: "07:20", saida: "09:00" },
      { entrada: "13:00", saida: "16:35" },
    ], aulasDia);

    expect(faltas).toEqual([3, 4, 5]);
  });
});
