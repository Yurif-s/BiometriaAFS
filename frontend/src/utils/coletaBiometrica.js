// Uma sessão local de coleta; eventos tardios não podem concluir uma tentativa encerrada.
export function criarColetaBiometrica({ iniciar, cancelar, atualizar, confirmar,
  agendar = setTimeout, desagendar = clearTimeout, prazo = 60000 }) {
  let geracao = 0;
  let id = null;
  let timer;
  let estado = 'idle';
  let encerrada = false;
  const publicar = (novoEstado, mensagem = '') => {
    estado = novoEstado;
    if (!encerrada) atualizar({ estado, mensagem });
  };
  const limparTimer = () => { desagendar(timer); timer = undefined; };
  async function liberar() {
    if (id === null) return;
    await cancelar(id);
    id = null;
  }
  async function interromper(mensagem) {
    ++geracao;
    limparTimer();
    publicar('cancelling', 'Cancelando a coleta…');
    try {
      await liberar();
      publicar('error', mensagem);
    } catch {
      publicar('error', 'Não foi possível cancelar a coleta. Verifique a conexão e tente novamente.');
    }
  }
  return {
    async iniciar() {
      if (encerrada || ['starting', 'waiting', 'cancelling', 'ready'].includes(estado)) return;
      const tentativa = ++geracao;
      publicar('starting', 'Preparando a coleta…');
      try {
        await liberar();
        if (tentativa !== geracao) return;
        const resultado = await iniciar();
        if (tentativa !== geracao || encerrada) {
          // Cancelamento ocorrido enquanto a API ainda reservava o ID.
          id = resultado.id;
          await liberar();
          return;
        }
        id = resultado.id;
        publicar('waiting', 'Posicione o dedo e siga as instruções do sensor. Tempo máximo: 60 segundos.');
        timer = agendar(() => { void interromper('O tempo de coleta terminou. Confira se o sensor voltou à tela inicial antes de tentar novamente.'); }, prazo);
      } catch {
        if (tentativa === geracao && !encerrada) publicar('error', 'Não foi possível iniciar a coleta. Verifique a conexão e tente novamente.');
      }
    },
    receber({ biometriaId, alunoNome }) {
      if (estado !== 'waiting' || encerrada) return;
      if (alunoNome) {
        void interromper('Esta digital já pertence a um aluno. Utilize outra digital.');
        return;
      }
      if (Number(biometriaId) !== Number(id)) return;
      limparTimer();
      publicar('ready');
      confirmar(id);
    },
    falhar() {
      if (estado === 'waiting') void interromper('Não foi possível coletar a digital. Retire o dedo e tente novamente.');
    },
    desconectar() {
      if (estado === 'waiting') void interromper('A conexão foi interrompida. Reconecte e tente novamente.');
    },
    cancelar() { return interromper('Coleta cancelada. Você pode iniciar uma nova tentativa.'); },
    concluir() { ++geracao; limparTimer(); id = null; publicar('idle'); },
    descartar() {
      encerrada = true;
      ++geracao;
      limparTimer();
      void liberar().catch(() => {});
    },
  };
}
