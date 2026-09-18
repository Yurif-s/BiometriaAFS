# Roteiro de demonstração — Biometria AFS

## 1. Objetivo e cenário

Demonstrar o fluxo **cadastro do aluno → coleta da digital → registro de entrada/saída → consulta do histórico e da frequência**, usando uma máquina e um sensor, com um cadastro por vez.

Tempo sugerido: **8 a 10 minutos**, após um ensaio completo. O hardware e o firmware atuais serão mantidos. As melhorias de recuperação atuam no frontend e no backend; não interrompem diretamente uma rotina já iniciada no ESP32.

## 2. Preparação antes do evento

### Ambiente e rede

- Separe computador, fonte/cabo do ESP32, sensor e acesso à rede já utilizada pelo equipamento.
- Confira se frontend e ESP32 apontam para **o mesmo backend**. Um frontend conectado ao backend local e um ESP32 conectado ao backend hospedado não compartilham os eventos.
- O frontend usa `VITE_API_URL`; sem essa variável, utiliza `http://localhost:3000`. Após mudar essa configuração, reinicie o Vite.
- No ESP32, `localhost` não representa o computador. Como o firmware será preservado, prepare a rede e o backend para o endereço já configurado nele. Se esse endereço não estiver acessível, resolva isso antes do evento.
- O indicador de conexão da página confirma o WebSocket com o servidor, **não a disponibilidade do sensor**.
- Faça o ensaio na mesma rede e com os mesmos endereços previstos para a apresentação.

### Dados de demonstração

- Use uma turma identificada como demonstração, com ano preenchido.
- Prepare um nome e uma matrícula de teste que ainda não estejam cadastrados.
- Para demonstrar o cadastro, escolha uma digital ainda não armazenada no sensor e use o mesmo dedo nas duas capturas.
- Tenha também um aluno já cadastrado e testado como alternativa caso a coleta ao vivo falhe.
- Não exclua cadastros existentes para preparar a apresentação: a exclusão pode remover históricos associados e solicitar a exclusão da digital no sensor.

## 3. Inicialização local

As instruções abaixo pressupõem que o ESP32 já esteja configurado para alcançar este backend local. Se o ensaio usar o backend hospedado, confirme esse ambiente em vez de iniciar uma API local diferente.

### 3.1 PostgreSQL

No PowerShell:

```powershell
Get-Service postgresql-x64-18
```

Resultado esperado: `Running`.

Se estiver parado, execute no PowerShell **como administrador**:

```powershell
Start-Service postgresql-x64-18
```

Se estiver desativado, habilite o início manual e tente novamente:

```powershell
Set-Service -Name postgresql-x64-18 -StartupType Manual
Start-Service -Name postgresql-x64-18
```

O backend local deve ter `DATABASE_URL` configurada em `backend/.env`. Não projete esse arquivo na apresentação: ele contém credenciais.

### 3.2 Backend

Em um terminal:

```powershell
cd C:\Projects\BiometriaAFS\backend
pnpm run start:dev
```

Resultado esperado: compilação sem erros e aplicação iniciada. Mantenha esse terminal aberto. Use apenas uma instância na porta 3000.

Confira uma rota que consulta o banco:

```powershell
(Invoke-WebRequest http://localhost:3000/turmas).StatusCode
```

Resultado esperado: `200`. A rota `/helloworld` sozinha não confirma acesso ao banco. Um aviso de falha nas saídas automáticas também indica que o servidor ativo pode estar sem acesso ao PostgreSQL.

### 3.3 Frontend e sensor

Em outro terminal:

```powershell
cd C:\Projects\BiometriaAFS\frontend
pnpm run dev
```

Abra `http://localhost:5173`. Ligue o ESP32 e aguarde a conexão Wi-Fi e a tela de espera. Abra o dashboard e confirme que as turmas carregam e que não há mensagens de erro.

## 4. Checagem rápida antes de apresentar

- [ ] PostgreSQL ativo e API consultando as turmas com sucesso.
- [ ] Frontend e sensor usando o mesmo backend.
- [ ] ESP32 conectado e mostrando a tela de espera.
- [ ] Turma de demonstração disponível.
- [ ] Aluno de reserva reconhecido em um teste real.
- [ ] Cadastro de teste e digital disponíveis para uma nova coleta.
- [ ] Histórico conferido após o ensaio: leituras de teste também geram registros reais.
- [ ] Apenas uma tela conduzindo o cadastro; nenhuma coleta anterior pendente.
- [ ] Terminais permanecem abertos, sem outra instância disputando as portas.

## 5. Sequência da apresentação

| Etapa | Ação do apresentador | Resultado a conferir |
|---|---|---|
| 1 — Contexto (1 min) | Explique que o sensor identifica a digital, a API registra a movimentação e a interface apresenta os dados. | Público entende o caminho da informação. |
| 2 — Cadastro (2–3 min) | Abra `/dashboard/gestao`, preencha nome, matrícula e turma e clique em **Prosseguir**. | Tela de coleta aberta, mantendo os dados informados. |
| 3 — Digital | Clique em **Coletar Digital**. Siga o display: coloque o dedo, retire quando solicitado e coloque o mesmo dedo novamente. | Tela de confirmação com os dados do aluno e o ID da digital. |
| 4 — Salvar | Confira nome, matrícula e turma e clique uma vez em **Salvar Cadastro**. | Mensagem de sucesso e aluno disponível na lista. Coletar a digital sem salvar não conclui o cadastro do aluno. |
| 5 — Entrada (1 min) | Abra `/portaria` antes da leitura. Com o sensor em espera, coloque a digital cadastrada e retire o dedo. | Nome, matrícula, turma, tipo de acesso e horário aparecem. Para aluno novo, sem acesso no dia, o primeiro registro é entrada. |
| 6 — Histórico (1 min) | Abra `/dashboard/historico` e filtre pelo dia e pelo nome do aluno. | Registro com aluno, turma, tipo e horário corretos. |
| 7 — Saída (opcional, 1 min) | Volte à portaria, aguarde o sensor estar pronto e faça outra leitura deliberada. | Em uma sequência normal, a nova leitura registra a saída. Confira o tipo exibido, principalmente se houve ensaios anteriores. |
| 8 — Relatórios (1–2 min) | Abra `/dashboard/relatorios`, selecione a turma e a data do teste. | Aluno e frequência por período exibidos conforme os horários registrados. |

**Confirmar Visualização**, na portaria, apenas limpa o cartão da tela: não registra outra movimentação nem confirma uma gravação no banco.

Evite várias leituras para “reforçar” o teste. Cada leitura aceita pode alterar entrada/saída. Abra a portaria antes da leitura, pois o cartão acompanha novos eventos ao vivo.

## 6. Como explicar horários e indicadores

- O sistema apresenta datas e horários no fuso do Ceará (UTC-3).
- Antes de **16h35**, uma entrada pode gerar no histórico uma saída **prevista** para 16h35. Ela não deve ser apresentada como uma saída física já realizada; os indicadores de movimentação desconsideram eventos futuros.
- A frequência usa nove períodos entre **07h20 e 16h35**, com intervalos. Uma entrada feita à noite não demonstra presença nos períodos de aula daquele dia.
- A regra atual marca presença no período quando há sobreposição com um intervalo de presença do aluno; não representa, por si só, permanência durante toda a aula.
- Para mostrar uma grade com presença em horários escolares, use registros de um ensaio prévio feito nesses horários. Se preparar registros manualmente, identifique-os explicitamente como dados de demonstração.
- Os indicadores principais do dashboard são consultados aproximadamente a cada **30 segundos**. O ranking de turmas é carregado ao abrir a página; recarregue para atualizá-lo.
- O histórico e o relatório devem ser consultados novamente depois das novas leituras. Não prometa atualização automática de todas as telas.

## 7. Recuperação de falhas

| Sintoma | O que fazer | Quando continuar |
|---|---|---|
| **Aguardando Digital…** sem conclusão | Aguarde o limite de 60 segundos após a reserva do ID. Confira o display do ESP32. A requisição inicial à API tem limite separado de 10 segundos. | Após a mensagem na tela e o sensor estar novamente pronto. |
| Sensor continua pedindo o dedo após cancelar ou expirar | O cancelamento na API não interrompe imediatamente o firmware atual. Pode ser necessário reiniciar o ESP32. Aguarde reconexão e processamento de solicitações pendentes. | Somente com o display em espera; depois clique em **Tentar novamente**. |
| Mensagem de falha na coleta | Retire o dedo, confira o sensor e repita seguindo as duas capturas indicadas no display. | Quando a tela liberar nova tentativa e o sensor estiver pronto. |
| Digital já cadastrada | Use outra digital para o cadastro ou passe à demonstração com o aluno já existente. Confira o histórico, pois o reconhecimento de uma digital existente pode registrar acesso. | Depois de confirmar qual aluno será usado. |
| Sem conexão ao vivo | Verifique se o backend está ativo e se a URL está correta. Após reconectar, confira a coleta pendente antes de repetir. | Indicador conectado e consulta de dados funcionando. |
| Falha ao cancelar | Restabeleça a conexão. A nova tentativa procura liberar a reserva anterior antes de solicitar outra. | Depois de cancelar com sucesso e conferir o sensor. |
| `ECONNREFUSED` no banco | Confira o serviço PostgreSQL e a configuração da API. | Consulta a `/turmas` respondendo `200`. |
| `EADDRINUSE` na porta 3000 | Verifique se já existe um backend aberto. Não inicie uma segunda instância. | Instância correta respondendo às consultas. |
| Dados ou evento não aparecem | Confira se frontend e ESP32 usam a mesma API, se o aluno foi salvo e se os filtros estão corretos. Abra novamente o histórico. | Registro confirmado na API/interface. |

Nem todas as falhas do firmware atual enviam um evento para a página. Nesses casos, a interface depende do seu próprio tempo limite. Não fique repetindo a coleta enquanto o sensor ainda executa a anterior.

### Plano alternativo durante o evento

Se o cadastro ao vivo falhar, explique a limitação e use o aluno previamente cadastrado para mostrar entrada, saída e histórico. Se o sensor não se recuperar, apresente os registros do ensaio como **dados previamente registrados**, sem afirmar que foram gerados ao vivo.

Deixe os testes deliberados de desconexão e tempo esgotado para o ensaio; eles não precisam fazer parte da apresentação principal.

## 8. Encerramento e critério de prontidão

Ao terminar, confirme no histórico quais movimentos foram registrados. Encerre os processos de desenvolvimento com `Ctrl+C` nos respectivos terminais quando não forem mais necessários. Preserve os dados do ensaio até decidir o que pode ser removido.

Considere a demonstração pronta quando, no equipamento e na rede do evento, conseguir:

- Cadastrar e salvar um aluno com sucesso.
- Reconhecer a digital e conferir uma entrada e uma saída no histórico.
- Consultar a turma e a data corretas no relatório.
- Recuperar uma tentativa interrompida sem deixar a tela ou o sensor presos no fluxo anterior.
- Executar o plano alternativo com um aluno já cadastrado.

Os testes automatizados verificam o controle da coleta no frontend e regras do backend com dependências simuladas. **Não substituem esse ensaio físico.** Este roteiro não exige alteração nem gravação de firmware.
