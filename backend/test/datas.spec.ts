import { BadRequestException } from '@nestjs/common';
import { dataBR, inicioDoDiaBR, fimDoDiaBR, adicionarDiasBR, horarioBR, interpretarHorario } from '../src/utils/datas';

describe('Datas da escola (UTC-3)', () => {
  it('interpreta horários sem fuso no Ceará e preserva offsets explícitos', () => {
    expect(interpretarHorario('2026-09-15T07:20').toISOString()).toBe('2026-09-15T10:20:00.000Z');
    expect(interpretarHorario('2026-09-15').toISOString()).toBe('2026-09-15T03:00:00.000Z');
    expect(interpretarHorario('2026-09-15T07:20:41.123Z').toISOString()).toBe('2026-09-15T07:20:41.123Z');
    expect(() => interpretarHorario('2026-02-30T07:20:00Z')).toThrow(BadRequestException);
  });
  it('mantém o dia selecionado e inclui a noite brasileira após meia-noite UTC', () => {
    expect(inicioDoDiaBR('2026-09-15').toISOString()).toBe('2026-09-15T03:00:00.000Z');
    expect(fimDoDiaBR('2026-09-15').toISOString()).toBe('2026-09-16T02:59:59.999Z');
    expect(dataBR(new Date('2026-09-16T02:59:59Z'))).toBe('2026-09-15');
    expect(horarioBR(new Date('2026-09-16T03:00:00Z'))).toBe('00:00');
  });

  it.each(['', '15/09/2026', '2026-02-29', '2026-02-30', '2026-13-01', '2026-09-15T00:00:00Z'])(
    'rejeita a data inválida %s', value => {
      expect(() => inicioDoDiaBR(value)).toThrow(BadRequestException);
    },
  );

  it('avança entre meses, anos e dias bissextos', () => {
    expect(dataBR(adicionarDiasBR(inicioDoDiaBR('2026-01-01'), -1))).toBe('2025-12-31');
    expect(dataBR(adicionarDiasBR(inicioDoDiaBR('2024-03-01'), -1))).toBe('2024-02-29');
  });
});
