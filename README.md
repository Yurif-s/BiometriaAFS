<div align="center">
  <h1>🖐️ BiometriaAFS</h1>
  
  <p>
    <strong>Sistema de controle de frequência biométrica para instituições de ensino.</strong><br>
    Integra firmware ESP32 com sensor de digital, API REST em NestJS com WebSockets, frontend React para gestão operacional e extensão Chrome para preenchimento de faltas no portal Seduc-CE.
  </p>

  <div>
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" />
    <img src="https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension" />
  </div>
</div>

---

## 📑 Sumário

- [🚀 Sobre o Projeto](#-sobre-o-projeto)
- [✨ Funcionalidades](#-funcionalidades)
- [📐 Arquitetura do Sistema](#-arquitetura-do-sistema)
- [🧩 Módulos](#-módulos)
- [🛠️ Pré-requisitos](#-pré-requisitos)
- [⚙️ Instalação e Configuração](#️-instalação-e-configuração)
- [▶️ Execução](#️-execução)
- [📡 Endpoints da API](#-endpoints-da-api)
- [🧪 Testes](#-testes)
- [📁 Estrutura de Diretórios](#-estrutura-de-diretórios)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

---

## 🚀 Sobre o Projeto

O **BiometriaAFS** automatiza o fluxo de registro e consolidação de presença escolar:

1. **Captura:** O aluno posiciona a digital no sensor óptico acoplado ao microcontrolador ESP32-S3.
2. **Identificação e Envio:** O firmware valida a digital no banco local do sensor e despacha o registro via HTTP/REST para a API.
3. **Processamento em Tempo Real:** O backend armazena o evento no PostgreSQL e transmite atualizações instantâneas via WebSocket para a interface web.
4. **Gestão e Relatórios:** O painel administrativo exibe KPIs de frequência, histórico paginado, gráficos de fluxo horário e mapa de presença nos 9 períodos diários.
5. **Integração Seduc-CE:** A extensão para navegador consome os dados da API e preenche os registros de faltas no portal Professor Online.

---

## ✨ Funcionalidades

- **Dashboard Operacional:** Indicadores em tempo real (total de presentes, ausentes, total de alunos cadastrados e slots biométricos disponíveis).
- **Gráficos Analíticos:** Distribuição de acessos por hora do dia, divisão percentual entre entradas/saídas e série histórica de frequência (Recharts).
- **Frequência por Período de Aula:** Matriz de presença distribuída nos 9 tempos de aula de cada turma.
- **Histórico com Filtros e Exportação:** Filtragem por intervalo de datas, turma, tipo de evento e busca nominal, com suporte a paginação e exportação CSV.
- **Gestão de Alunos e Turmas:** CRUD de estudantes e turmas com associação de ID biométrico.
- **Feed ao Vivo via WebSocket:** Notificações de leitura de digital na interface sem necessidade de recarregamento.
- **Automação de Lançamento no Seduc-CE:** Mapeamento DOM e marcação de faltas no portal do professor.
- **Firmware Multi-Tasking:** Execução baseada em FreeRTOS com separação de núcleos para comunicação de rede e leitura biométrica.

---

## 📐 Arquitetura do Sistema

```mermaid
graph TD
    subgraph Hardware [Hardware - ESP32-S3]
        A[Sensor AS608] -->|UART| B(ESP32-S3 Core 1)
        B -->|FreeRTOS Queue| C(ESP32-S3 Core 0 - Rede)
        C -->|HTTP REST| D{API NestJS}
        B -->|SPI| T[Display TFT]
    end
    
    subgraph Backend [Backend - NestJS & PostgreSQL]
        D -->|Prisma ORM| E[(PostgreSQL)]
        D <-->|WebSocket Socket.IO| F[Frontend React]
    end
    
    subgraph Extensao [Extensão Chrome]
        G[Extensão Manifest V3] -->|HTTP GET| D
        G -->|Injeção DOM| H((Portal Professor Online - Seduc))
    end
```

---

## 🧩 Módulos

### 🟢 Backend (NestJS)
API estruturada no padrão em camadas (`Controllers → Services → Repositories`).
- **ORM:** Prisma com PostgreSQL.
- **Validação de Dados:** DTOs com `class-validator` e `class-transformer`.
- **Comunicação:** Endpoints REST e Gateway WebSocket (`@nestjs/websockets` / Socket.IO).
- **Modelos de Dados:** `Turma`, `Aluno`, `Acesso`, `User`.

### 🔵 Frontend (React + Vite)
Interface web desenvolvida com React 19, React Router DOM e Recharts.
- **Rotas:**
  - `/` — Terminal de acesso com feedback visual/sonoro.
  - `/portaria` — Visualização dedicada para controle de portaria.
  - `/dashboard` — Painel com KPIs, gráficos de horário e feed ao vivo.
  - `/dashboard/historico` — Tabela paginada de acessos, filtros e exportação CSV.
  - `/dashboard/relatorios` — Frequência detalhada por turma nos 9 períodos escolares e tendências.
  - `/dashboard/gestao` — Gerenciamento de alunos e turmas.

### 🟡 Extensão Chrome (Manifest V3)
Extensão para navegador injetada no portal da Secretaria da Educação do Ceará.
- **Configuração de API (`config.js`):** Suporta ambiente de produção (`https://biometriaafs.onrender.com`) e ambiente local (`http://localhost:3000`).
- **Interface Popup (`popup/`):** Painel de controle e status da sincronização.
- **Script de Conteúdo (`content.js`):** Leitura de ausências e marcação no formulário web da Seduc.

### 🔴 Hardware & Firmware (ESP32-S3)
Código em C++ estruturado em FreeRTOS com alocação por núcleo:
- **Core 0:** Gerenciador de conexão Wi-Fi, sincronização de horário via NTP (`time.google.com`), envio assíncrono de eventos HTTP e polling de cadastro de biometria.
- **Core 1:** Loop dedicado para leitura e busca no sensor biométrico com mutex para controle de concorrência do display.

#### Pinagem do Hardware

| Componente | Função | Pino ESP32-S3 |
| :--- | :--- | :--- |
| **Sensor AS608** | RX (Comunicação Serial) | `GPIO 17` (`RXD_BIO`) |
| **Sensor AS608** | TX (Comunicação Serial) | `GPIO 18` (`TXD_BIO`) |
| **Buzzer** | Sinalização Sonora (PWM) | `GPIO 15` |
| **LED Wi-Fi** | Indicador de Conexão de Rede | `GPIO 2` |
| **LED Biometria** | Indicador de Validação Biométrica | `GPIO 36` |
| **Display TFT** | Interface Gráfica / Status | Interface SPI (`TFT_eSPI`) |

---

## 🛠️ Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- [Arduino IDE](https://www.arduino.cc/en/software) com suporte a placas ESP32
- Google Chrome ou navegador baseado em Chromium

---

## ⚙️ Instalação e Configuração

```bash
# Clonar o repositório
git clone https://github.com/Yurif-s/BiometriaAFS.git
cd BiometriaAFS
```

### 1. Backend
Configurar variáveis de ambiente em `backend/.env`:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/biometriaafs"
```

Instalar dependências e sincronizar o banco de dados:
```bash
cd backend
pnpm install
npx prisma migrate dev
npx prisma generate
```

### 2. Frontend
```bash
cd ../frontend
pnpm install
```

### 3. Extensão Chrome
1. Abra `chrome://extensions/` no navegador.
2. Ative a opção **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione o diretório `extension/` do projeto.

---

## ▶️ Execução

**Backend:**
```bash
cd backend
pnpm run start:dev   # API ativa em http://localhost:3000
```

**Frontend:**
```bash
cd frontend
pnpm run dev         # Interface web ativa em http://localhost:5173
```

---

## 📡 Endpoints da API

### 📚 Turmas (`/turmas`)
- `POST /turmas` — Cadastra nova turma (`{ "nome": "3º A", "ano": 2026 }`).
- `GET /turmas` — Lista todas as turmas cadastradas.
- `GET /turmas/:id` — Retorna dados da turma por ID numérico.
- `GET /turmas/ano/:ano` — Retorna turmas filtradas pelo ano letivo.
- `PUT /turmas/:id` — Atualiza dados cadastrais de uma turma.
- `DELETE /turmas/:id` — Remove uma turma por ID.

### 🎓 Alunos (`/alunos`)
- `POST /alunos` — Cadastra aluno (`{ "matricula": "2026001", "nome": "Aluno", "biometria": 1, "turma_id": 1 }`).
- `GET /alunos` — Lista todos os alunos.
- `GET /alunos/:id` — Busca aluno por ID interno.
- `GET /alunos/matricula/:matricula` — Busca aluno pelo número de matrícula.
- `GET /alunos/biometria/:biometria` — Busca aluno pelo ID gravado no sensor.
- `GET /alunos/turma/:turmaId` — Lista alunos pertencentes a uma turma específica.
- `PUT /alunos/:id` — Atualiza cadastro de aluno.
- `DELETE /alunos/:id` — Remove aluno do sistema.

#### Rotas de Integração de Hardware / ESP32 (`/alunos/biometria`)
- `POST /alunos/biometria/leitura` — Recebe ID do sensor identificado e registra acesso.
- `POST /alunos/biometria/iniciar-cadastro` — Inicia solicitação de captura de nova digital no ESP32.
- `GET /alunos/biometria/solicitacao` — Endpoint de polling para o ESP32 consultar ações pendentes (cadastrar/deletar ID).
- `POST /alunos/biometria/solicitacao/ack` — Confirmação de recebimento da solicitação pelo microcontrolador.
- `POST /alunos/biometria/cancelar-cadastro` — Cancela solicitação de cadastro pendente.
- `POST /alunos/biometria/falha` — Notifica falha de reconhecimento biométrico no sensor.

### 🕒 Acessos (`/acessos`)
- `POST /acessos` — Registra novo evento de acesso manual.
- `GET /acessos` — Lista histórico geral de acessos.
- `GET /acessos/hoje` — Retorna acessos computados na data atual.
- `GET /acessos/:id` — Retorna dados de um registro de acesso.
- `PUT /acessos/:id` — Edita dados de um registro de acesso.
- `DELETE /acessos/:id` — Exclui um registro de acesso.

### 📊 Dashboard (`/dashboard`)
- `GET /dashboard/resumo` — Retorna KPIs consolidados (presentes agora, ausentes, total de alunos e turmas).
- `GET /dashboard/acessos/por-hora` — Agrupamento de entradas e saídas por faixa horária.
- `GET /dashboard/tendencia?dias=7` — Volume histórico diário de acessos.
- `GET /dashboard/acessos` — Consulta server-side paginada com filtros (`dataInicio`, `dataFim`, `turmaId`, `tipo`, `busca`, `page`, `limit`).
- `GET /dashboard/turmas/:id/frequencia` — Mapeamento diário de presença/ausência nos 9 períodos de aula.
- `GET /dashboard/export` — Gera arquivo CSV com os registros filtrados.

---

## 🧪 Testes

O backend possui testes unitários automatizados desenvolvidos com Jest:

```bash
cd backend
pnpm run test        # Executa testes unitários (AlunoService, TurmaService, DashboardService)
pnpm run test:watch  # Executa testes em modo de observação contínua
pnpm run test:cov    # Gera relatório de cobertura de código
pnpm run test:e2e    # Executa testes end-to-end
```

---

## 📁 Estrutura de Diretórios

```text
BiometriaAFS/
├── backend/                  # API NestJS
│   ├── prisma/               # Schema e migrações do banco PostgreSQL
│   ├── src/
│   │   ├── controllers/      # Controladores de rotas REST
│   │   ├── services/         # Regras de negócio e agregação de dados
│   │   ├── repositories/     # Camada de acesso a dados
│   │   ├── gateways/         # Gateways de WebSocket (Socket.IO)
│   │   ├── dtos/             # Objetos de transferência de dados e validações
│   │   └── entities/         # Entidades de domínio
│   └── test/                 # Testes unitários e E2E
│
├── frontend/                 # Aplicação SPA em React + Vite
│   └── src/
│       ├── components/       # Componentes de UI, modais e gráficos do dashboard
│       ├── pages/            # Páginas da aplicação (Dashboard, Histórico, Relatórios, Gestão, Portaria)
│       ├── hooks/            # Hooks customizados para WebSocket, Toast e Dashboard
│       └── services/         # Cliente HTTP (Axios)
│
├── extension/                # Extensão Chrome (Manifest V3)
│   ├── manifest.json         # Manifesto e permissões da extensão
│   ├── config.js             # Configuração da URL da API
│   ├── content.js            # Injeção de script no portal Seduc-CE
│   ├── popup/                # Interface visual do popup da extensão
│   └── icons/                # Ativos visuais
│
└── hardware/                 # Firmware ESP32-S3
    └── Code_Biometrics/
        └── Code_Biometrics.ino # Código C++ com FreeRTOS, display TFT e sensor AS608
```

---

## 🤝 Contribuição

1. Realize um **Fork** do repositório.
2. Crie uma branch para sua modificação (`git checkout -b feature/nome-da-funcionalidade`).
3. Registre seus commits com mensagens descritivas (`git commit -m 'feat: implementa nova funcionalidade'`).
4. Envie as alterações para o seu repositório remoto (`git push origin feature/nome-da-funcionalidade`).
5. Abra um **Pull Request**.

---

## 📄 Licença

Distribuído sob licença MIT. Para detalhes, consulte os arquivos do projeto.
