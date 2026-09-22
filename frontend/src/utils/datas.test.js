import test from 'node:test';
import assert from 'node:assert/strict';
import { dataBR, horarioBR, paraInputDataHora, deInputDataHora } from './datas.js';

test('data da escola permanece no dia anterior antes de 03h UTC', () => {
  assert.equal(dataBR('2026-09-16T02:59:59.999Z'), '2026-09-15');
  assert.equal(dataBR('2026-09-16T03:00:00Z'), '2026-09-16');
});

test('editar e salvar preserva o instante, inclusive segundos e milissegundos', () => {
  for (const iso of ['2026-09-16T02:59:41.123Z', '2026-09-16T03:00:00.000Z']) {
    assert.equal(deInputDataHora(paraInputDataHora(iso)), iso);
  }
  assert.equal(paraInputDataHora('2026-09-16T02:59:41.123Z'), '2026-09-15T23:59:41.123');
});

test('horário digitado segue UTC-3 mesmo quando o computador está em outro fuso', () => {
  assert.equal(deInputDataHora('2026-09-15T07:20'), '2026-09-15T10:20:00.000Z');
  assert.equal(horarioBR('2026-09-15T10:20:00Z'), '07:20:00');
});

test('horários sem offset são interpretados como hora do Ceará', () => {
  assert.equal(horarioBR('2026-09-15T07:20:00'), '07:20:00');
  assert.equal(dataBR('2026-09-15'), '2026-09-15');
});

test('datas vazias e impossíveis não são convertidas silenciosamente', () => {
  for (const value of ['', '2026-02-30T07:20', '2026-09-15', '2026-09-15T25:00']) {
    assert.throws(() => deInputDataHora(value));
  }
});
