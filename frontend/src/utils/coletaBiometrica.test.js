import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarColetaBiometrica } from './coletaBiometrica.js';

function preparar(opcoes = {}) {
  const estados = [], confirmados = [], cancelados = [];
  let expirar;
  const sessao = criarColetaBiometrica({
    iniciar: async () => ({ id: 7 }),
    cancelar: async id => { cancelados.push(id); },
    atualizar: estado => estados.push(estado),
    confirmar: id => confirmados.push(id),
    agendar: callback => { expirar = callback; return 1; },
    desagendar: () => {},
    ...opcoes,
  });
  return { sessao, estados, confirmados, cancelados, expirar: () => expirar() };
}
const aguardar = () => new Promise(resolve => setImmediate(resolve));

test('cliques repetidos não iniciam duas reservas', async () => {
  let chamadas = 0;
  const t = preparar({ iniciar: async () => { chamadas++; return { id: 7 }; } });
  await Promise.all([t.sessao.iniciar(), t.sessao.iniciar()]);
  assert.equal(chamadas, 1);
});

test('falha ao iniciar libera a tentativa sem confirmar cadastro', async () => {
  const t = preparar({ iniciar: async () => { throw new Error('offline'); } });
  await t.sessao.iniciar();
  assert.equal(t.estados.at(-1).estado, 'error');
  assert.deepEqual(t.confirmados, []);
});

test('digital já cadastrada cancela a reserva atual', async () => {
  const t = preparar();
  await t.sessao.iniciar();
  t.sessao.receber({ biometriaId: 3, alunoNome: 'Aluno de teste' });
  await aguardar();
  assert.deepEqual(t.cancelados, [7]);
  assert.deepEqual(t.confirmados, []);
  assert.equal(t.estados.at(-1).estado, 'error');
});

test('tempo limite cancela a reserva e ignora sucesso tardio', async () => {
  const t = preparar();
  await t.sessao.iniciar();
  t.expirar();
  await aguardar();
  t.sessao.receber({ biometriaId: 7 });
  assert.deepEqual(t.cancelados, [7]);
  assert.deepEqual(t.confirmados, []);
  assert.equal(t.estados.at(-1).estado, 'error');
  await t.sessao.iniciar();
  assert.equal(t.estados.at(-1).estado, 'waiting');
});

test('somente o ID reservado conclui a coleta e salvar libera a sessão', async () => {
  const t = preparar();
  await t.sessao.iniciar();
  t.sessao.receber({ biometriaId: 8 });
  assert.deepEqual(t.confirmados, []);
  t.sessao.receber({ biometriaId: 7 });
  assert.deepEqual(t.confirmados, [7]);
  t.sessao.concluir();
  t.sessao.descartar();
  await aguardar();
  assert.deepEqual(t.cancelados, []);
});

for (const evento of ['falhar', 'desconectar']) {
  test(`${evento} encerra espera e permite nova tentativa`, async () => {
    const t = preparar();
    await t.sessao.iniciar();
    t.sessao[evento]();
    await aguardar();
    assert.deepEqual(t.cancelados, [7]);
    assert.equal(t.estados.at(-1).estado, 'error');
    await t.sessao.iniciar();
    assert.equal(t.estados.at(-1).estado, 'waiting');
  });
}

test('nova tentativa exige cancelar a reserva anterior quando a conexão falha', async () => {
  let chamadas = 0;
  const t = preparar({ cancelar: async () => { chamadas++; throw new Error('offline'); } });
  await t.sessao.iniciar();
  await t.sessao.cancelar();
  await t.sessao.iniciar();
  assert.equal(chamadas, 2);
  assert.equal(t.estados.at(-1).estado, 'error');
});

test('sair durante a solicitação cancela o ID recebido depois sem atualizar a tela', async () => {
  let resolver;
  const t = preparar({ iniciar: () => new Promise(resolve => { resolver = resolve; }) });
  const inicio = t.sessao.iniciar();
  await aguardar();
  t.sessao.descartar();
  resolver({ id: 7 });
  await inicio;
  assert.deepEqual(t.cancelados, [7]);
  assert.deepEqual(t.confirmados, []);
  assert.equal(t.estados.length, 1);
});
