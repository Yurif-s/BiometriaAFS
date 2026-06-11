<div align="center">
  <h1>🖐️ BiometriaAFS</h1>
  
  <p>
    <strong>Sistema completo de controle de frequência biométrica para instituições de ensino.</strong><br>
    Integra um firmware ESP32 com sensor de digital, uma API REST em NestJS, um frontend React para gestão de alunos e uma extensão Chrome que automatiza o lançamento de faltas no sistema da Seduc-CE.
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
- [✨ Funcionalidades em Destaque](#-funcionalidades-em-destaque)
- [📐 Arquitetura Geral](#-arquitetura-geral)
- [🧩 Módulos](#-módulos)
- [🛠️ Pré-requisitos](#-pré-requisitos)
- [⚙️ Instalação e Configuração](#️-instalação-e-configuração)
- [▶️ Executando o Projeto](#️-executando-o-projeto)
- [📡 Endpoints da API](#-endpoints-da-api)
- [🧪 Testes](#-testes)
- [📁 Estrutura de Pastas](#-estrutura-de-pastas)
- [🤝 Como Contribuir](#-como-contribuir)
- [📄 Licença](#-licença)

---

## 🚀 Sobre o Projeto

O **BiometriaAFS** automatiza o ciclo completo da frequência escolar, minimizando o trabalho manual dos professores e garantindo precisão:

1. **Captura:** O aluno apoia o dedo no sensor acoplado ao **ESP32S3**.
2. **Identificação:** O firmware identifica o template biométrico e envia a presença para a **API**.
3. **Gestão:** O **frontend** exibe e permite gerenciar os registros de alunos, turmas e o terminal de presença em tempo real.
4. **Automação:** A **extensão Chrome** lê os dados da API local e lança as faltas automaticamente no portal **Professor Online (Seduc-CE)**.

---

## ✨ Funcionalidades em Destaque

- 📊 **Dashboard Operacional Completo**: Painel com KPIs diários (presentes agora, ausentes hoje, total de alunos e slots biométricos).
- 📈 **Gráficos Interativos**: Distribuição de acessos por hora do dia e divisão percentual de Entradas/Saídas (usando Recharts).
- 📂 **Relatório por Período de Aula**: Grade de presença mapeando faltas nos 9 períodos de aula de cada aluno por turma.
- 📑 **Histórico Paginado com Filtros e Exportação**: Consulta server-side paginada por data, turma, tipo e busca nominal, com suporte a exportação CSV.
- 👥 **Gestão Completa de Turmas e Alunos**: CRUD intuitivo e ágil via interface web.
- ⚡ **Comunicação em Tempo Real**: WebSocket (Socket.IO) integrado para feedback instantâneo no frontend no momento da leitura da digital (feed ao vivo).
- 🤖 **Automação Seduc-CE**: Preenchimento automatizado das faltas, poupando dezenas de minutos diários dos educadores.
- 🛡️ **Testes e Confiabilidade**: Cobertura de testes unitários no backend (incluindo cálculo de ausências por períodos) e validações rigorosas.

---

## 📐 Arquitetura Geral

O fluxo de funcionamento do projeto pode ser visualizado abaixo:

```mermaid
graph TD
    subgraph Hardware
        A[Sensor AS608] -->|Digital| B(ESP32-S3)
    end
    
    subgraph Backend
        B -->|HTTP POST| C{API NestJS}
        C -->|Prisma ORM| D[(PostgreSQL)]
        C <-->|WebSocket| E[Frontend React]
    end
    
    subgraph Extensão Seduc
        E -->|Gerencia| F(Tabelas e Registros)
        G[Extensão Chrome] -->|HTTP GET| C
        G -->|Injeta Faltas| H((Portal Professor Online))
    end
```

---

## 🧩 Módulos

### 🟢 Backend (NestJS)
API REST construída em camadas (`Controllers → Services → Repositories`).
- **Banco de Dados:** PostgreSQL com Prisma ORM.
- **Validações:** DTOs com `class-validator`.
- **Comunicação:** REST e WebSockets (Socket.IO).

### 🔵 Frontend (React + Vite)
Interface web robusta organizada por rotas de navegação (`react-router-dom`) e gráficos dinâmicos (`recharts`).
- **Rotas principais:**
  - `/` - Terminal de acesso original (feedback sonoro/visual).
  - `/dashboard` - Visão geral operacional (KPIs, gráficos por hora, donut, ranking de turmas e feed ao vivo via WebSockets).
  - `/dashboard/historico` - Histórico avançado (busca, filtros por data e turma, edição inline e exportação CSV).
  - `/dashboard/relatorios` - Controle de frequência escolar nos 9 períodos diários e gráfico de tendência.
  - `/dashboard/gestao` - Painel de administração de alunos e gerenciador de turmas.
  - `/portaria` - Tela da portaria/zelador.

### 🟡 Extensão Chrome (Manifest V3)
Extensão "Faltosos Seduc" injetada na página do portal do professor.
- Lê as ausências via `localhost:3000`.
- Percorre o DOM do portal educacional e marca automaticamente as faltas dos ausentes.

### 🔴 Hardware (ESP32-S3)
Firmware em C++ para ESP32 e módulo óptico **AS608**.
- Sincronização de relógio via NTP.
- Feedback visual (LED) e sonoro (Buzzer).

| Componente         | Pino ESP32 |
|--------------------|------------|
| Sensor AS608 — RX  | GPIO 16    |
| Sensor AS608 — TX  | GPIO 17    |
| Buzzer             | GPIO 4     |
| LED WiFi           | GPIO 2     |
| LED Biometria      | GPIO 36    |

---

## 🛠️ Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- Arduino IDE (com suporte ao ESP32-S3)
- Google Chrome ou Chromium

---

## ⚙️ Instalação e Configuração

```bash
# Clone o repositório
git clone https://github.com/Yurif-s/BiometriaAFS.git
cd BiometriaAFS
```

### 1. Banco de Dados & Backend
Em `backend/`, crie o arquivo `.env`:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/biometriaafs"
```
Instale e configure:
```bash
cd backend
pnpm install
npx prisma migrate dev
npx prisma generate
```

### 2. Frontend
```bash
cd frontend
pnpm install
```

### 3. Extensão Chrome
1. Acesse `chrome://extensions/` no seu navegador.
2. Ative o **Modo desenvolvedor** (no canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `extension/` deste projeto.

---

## ▶️ Executando o Projeto

**Backend:**
```bash
cd backend
pnpm run start:dev   # API disponível em http://localhost:3000
```

**Frontend:**
```bash
cd frontend
pnpm run dev         # Interface disponível em http://localhost:5173
```

---

## 📡 Endpoints da API

*Resumo das rotas REST disponíveis. Acesse os controladores para ver todos os detalhes.*

### 📚 Turmas (`/turmas`)
- `POST /` - Cria turma (`{ "nome": "3º A", "ano": 2025 }`)
- `GET /` - Lista turmas
- `GET /:id` - Busca turma por ID

### 🎓 Alunos (`/alunos`)
- `POST /` - Cria aluno (`{ "matricula": "2025001", "nome": "João", "biometria": 42, "turma_id": 1 }`)
- `GET /` - Lista alunos
- `GET /matricula/:matricula` - Busca aluno

### 🕒 Acessos (`/acessos`)
- `POST /` - Registra novo acesso
- `GET /` - Lista histórico completo
- `GET /hoje` - Lista acessos do dia atual

### 📊 Dashboard (`/dashboard`)
- `GET /dashboard/resumo` - Retorna KPIs consolidados (presentes agora, ausentes, total de alunos/turmas, etc.)
- `GET /dashboard/acessos/por-hora` - Agrupamento por hora das entradas e saídas
- `GET /dashboard/tendencia` - Volume diário nos últimos N dias
- `GET /dashboard/acessos` - Listagem paginada e filtrada (server-side)
- `GET /dashboard/turmas/:id/frequencia` - Relatório diário de faltas nos 9 períodos escolares por aluno
- `GET /dashboard/export` - Geração do arquivo CSV de acessos com os filtros selecionados

---

## 🧪 Testes

O projeto backend tem cobertura unitária rigorosa nos serviços principais (Turma e Aluno).

```bash
cd backend
pnpm run test        # Executa unitários
pnpm run test:watch  # Modo watch
pnpm run test:cov    # Gera relatório de cobertura de código
pnpm run test:e2e    # Executa testes end-to-end
```

---

## 📁 Estrutura de Pastas

```text
BiometriaAFS/
├── backend/                  # NestJS + Prisma
│   ├── prisma/               # Schema e Migrations
│   ├── src/                  # Controllers, Services, Repositories, DTOs
│   └── test/                 # Testes E2E e unitários
│
├── frontend/                 # React + Vite
│   └── src/                  # Components, Hooks, Constants
│
├── extension/                # Extensão Chrome Faltosos Seduc
│   ├── content.js            # Injeção no portal Seduc
│   └── popup/                # Interface da Extensão
│
└── hardware/                 # Firmware ESP32
    └── Code_Biometrics/      # Código .ino
```

---

## 🤝 Como Contribuir

Contribuições são super bem-vindas! Se você deseja colaborar:

1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua feature (`git checkout -b feature/MinhaFeature`).
3. Faça o **Commit** de suas alterações (`git commit -m 'feat: adiciona nova funcionalidade'`).
4. Faça o **Push** para a branch (`git push origin feature/MinhaFeature`).
5. Abra um **Pull Request**.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

<div align="center">
  <i>Desenvolvido para automatizar e inovar na educação.</i>
</div>
