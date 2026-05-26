# BiometriaAFS

Sistema completo de controle de frequência biométrica para instituições de ensino. Integra um **firmware ESP32** com sensor de digital, uma **API REST** em NestJS, um **frontend React** para gestão de alunos e uma **extensão Chrome** que automatiza o lançamento de faltas no sistema da Seduc-CE.

---

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura Geral](#arquitetura-geral)
- [Módulos](#módulos)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Extensão Chrome](#extensão-chrome)
  - [Hardware (ESP32)](#hardware-esp32)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Testes](#testes)
- [Estrutura de Pastas](#estrutura-de-pastas)

---

## Sobre o Projeto

O **BiometriaAFS** automatiza o ciclo completo da frequência escolar:

1. O aluno apoia o dedo no sensor acoplado ao **ESP32S3**
2. O firmware identifica o template biométrico e envia a presença para a **API**
3. O **frontend** exibe e permite gerenciar os registros de alunos e turmas
4. A **extensão Chrome** lê os dados da API e lança as faltas automaticamente no portal **Professor Online (Seduc-CE)**

**Funcionalidades:**

- CRUD completo de Turmas e Alunos
- Identificação de aluno por biometria, matrícula ou turma
- Registro de entrada e saída (opcional)
- Validação de unicidade de matrícula e biometria
- Interface web para cadastro, edição e remoção de alunos
- Automação de lançamento de faltas no Professor Online via extensão
- Testes unitários dos serviços

---

## Arquitetura Geral

```
┌─────────────┐     digital      ┌─────────────────┐
│   ESP32S3   │ ──────────────▶  │                 │
│  + AS608    │   HTTP Request   │   API NestJS    │
└─────────────┘                  │  (localhost:3000)│
                                 │                 │
┌─────────────┐   fetch REST     │                 │
│  Frontend   │ ◀──────────────▶ │                 │
│   (React)   │                  └────────┬────────┘
└─────────────┘                           │
                                          │ Prisma ORM
┌─────────────────┐  fetch REST           ▼
│ Extensão Chrome │ ──────────▶  ┌────────────────┐
│ Faltosos Seduc  │              │   PostgreSQL    │
│ (Professor      │              └────────────────┘
│  Online Seduc)  │
└─────────────────┘
```

---

## Módulos

### Backend

API REST construída com NestJS seguindo arquitetura em camadas:

```
Controllers → Services → Repositories → Prisma → PostgreSQL
```

**Modelos de dados:**

**Turma**

| Campo | Tipo   | Obrigatório | Descrição           |
|-------|--------|:-----------:|---------------------|
| id    | Int    | —           | Identificador único |
| nome  | String | ✅          | Nome da turma       |
| ano   | Int    | ✅          | Ano letivo          |

**Aluno**

| Campo     | Tipo     | Obrigatório | Descrição                         |
|-----------|----------|:-----------:|-----------------------------------|
| id        | Int      | —           | Identificador único               |
| matricula | String   | ✅          | Matrícula (única)                 |
| nome      | String   | ✅          | Nome completo                     |
| biometria | Int      | ✅          | ID do template biométrico (único) |
| entrada   | DateTime | ❌          | Registro de entrada (opcional)    |
| saida     | DateTime | ❌          | Registro de saída (opcional)      |
| turma_id  | Int      | ✅          | FK para Turma                     |

**Acesso**

| Campo     | Tipo     | Obrigatório | Descrição                         |
|-----------|----------|:-----------:|-----------------------------------|
| id        | Int      | —           | Identificador único               |
| tipo      | String   | ✅          | "Entrada" ou "Saída"              |
| horario   | DateTime | ✅          | Horário do registro               |
| aluno_id  | Int      | ✅          | FK para Aluno                     |

**Tecnologias:**

| Tecnologia | Versão | Uso                       |
|------------|--------|---------------------------|
| NestJS     | ^11.0  | Framework backend         |
| TypeScript | ^5.7   | Linguagem                 |
| Prisma ORM | ^7.4   | Acesso ao banco de dados  |
| PostgreSQL | —      | Banco de dados relacional |
| Socket.IO  | ^4.8   | WebSockets (Tempo Real)   |
| Jest       | ^30.0  | Testes unitários          |
| pnpm       | —      | Gerenciador de pacotes    |

---

### Frontend

Interface web desenvolvida em **React + Vite** para gestão de alunos e turmas.

**Funcionalidades:**

- Cadastro de alunos com validação de matrícula duplicada
- Tabela de alunos com busca e filtros
- Edição inline via modal
- Confirmação de exclusão com feedback visual
- Histórico de acessos com gerenciamento completo (CRUD)
- Terminal interativo com comunicação em tempo real via WebSockets
- Reset diário automático da tela do terminal à meia-noite
- Persistência local via `localStorage`
- Notificações com `react-hot-toast`

**Tecnologias:**

| Tecnologia      | Versão | Uso                       |
|-----------------|--------|---------------------------|
| React           | ^19.0  | Framework de UI           |
| Vite            | ^6.0   | Bundler e dev server      |
| Socket.IO Client| ^4.8   | Comunicação em tempo real |
| react-hot-toast | ^2.5   | Notificações              |
| react-icons     | ^5.5   | Ícones                    |

---

### Extensão Chrome

Extensão **"Faltosos Seduc"** (Manifest V3) que automatiza o lançamento de faltas no portal Professor Online da Seduc-CE.

**Como funciona:**

1. O professor acessa o portal `professor.seduc.ce.gov.br`
2. Clica no botão da extensão para iniciar
3. A extensão injeta um content script na página
4. Consulta a API local (`localhost:3000`) para obter os alunos presentes
5. Lança automaticamente as faltas dos alunos ausentes no portal

**Permissões necessárias:**

| Permissão     | Motivo                                            |
|---------------|---------------------------------------------------|
| `storage`     | Armazenar configurações locais                    |
| `activeTab`   | Acessar a aba ativa do professor                  |
| `scripting`   | Injetar o content script no portal da Seduc       |

> **Hosts permitidos:** `professor.seduc.ce.gov.br` e `localhost:3000`

---

### Hardware (ESP32)

Firmware para **ESP32-S3** com sensor biométrico **AS608** (ou compatível com a biblioteca `Adafruit_Fingerprint`).

**Componentes:**

| Componente         | Pino ESP32 |
|--------------------|------------|
| Sensor AS608 — RX  | GPIO 16    |
| Sensor AS608 — TX  | GPIO 17    |
| Buzzer             | GPIO 4     |
| LED WiFi           | GPIO 2     |
| LED Biometria      | GPIO 36    |

**Fluxo do firmware:**

1. Conecta ao WiFi e sincroniza horário via **NTP** (`pool.ntp.org`, UTC-3)
2. Aguarda apoio do dedo no sensor AS608
3. Realiza matching do template biométrico
4. Em caso de sucesso: toca melodia, acende LED e envia a leitura para a API
5. Em caso de falha: emite som de erro

**Configuração do firmware** — edite as constantes no topo do `.ino`:

```cpp
const char* ssid     = "Nome_Rede";
const char* password = "Senha_Rede";
```

---

## Pré-requisitos

**Backend:**
- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [PostgreSQL](https://www.postgresql.org/) >= 14

**Frontend:**
- [Node.js](https://nodejs.org/) >= 18
- npm ou pnpm

**Extensão Chrome:**
- Google Chrome ou Chromium

**Hardware:**
- Arduino IDE com suporte ao ESP32-S3
- Biblioteca `Adafruit_Fingerprint`

---

## Instalação

```bash
git clone https://github.com/Yurif-s/BiometriaAFS.git
cd BiometriaAFS
```

**Backend:**
```bash
cd backend
pnpm install
```

**Frontend:**
```bash
cd frontend
pnpm install
```

---

## Configuração

### Backend — variáveis de ambiente

Crie um `.env` em `backend/`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/biometriaafs"
```

### Backend — banco de dados

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Extensão Chrome — instalação manual

1. Acesse `chrome://extensions/`
2. Ative o **Modo desenvolvedor**
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `extensao/`

---

## Executando o Projeto

**Backend:**
```bash
cd backend
pnpm run start:dev   # desenvolvimento (hot reload)
pnpm run start:prod  # produção
```
API disponível em `http://localhost:3000`

**Frontend:**
```bash
cd frontend
pnpm run dev         # desenvolvimento
pnpm run build       # build de produção
```
Interface disponível em `http://localhost:5173`

---

## Endpoints da API

### Turmas — `/turmas`

| Método | Rota               | Descrição             |
|--------|--------------------|-----------------------|
| POST   | `/turmas`          | Cria uma nova turma   |
| GET    | `/turmas`          | Lista todas as turmas |
| GET    | `/turmas/:id`      | Busca turma por ID    |
| GET    | `/turmas/ano/:ano` | Busca turmas por ano  |
| PUT    | `/turmas/:id`      | Atualiza uma turma    |
| DELETE | `/turmas/:id`      | Remove uma turma      |

**Payload — `POST /turmas`**
```json
{
  "nome": "3º A",
  "ano": 2025
}
```

### Alunos — `/alunos`

| Método | Rota                           | Descrição                           |
|--------|--------------------------------|-------------------------------------|
| POST   | `/alunos`                      | Cria um novo aluno                  |
| GET    | `/alunos`                      | Lista todos os alunos               |
| GET    | `/alunos/:id`                  | Busca aluno por ID                  |
| GET    | `/alunos/matricula/:matricula` | Busca aluno por matrícula           |
| GET    | `/alunos/biometria/:biometria` | Busca aluno por template biométrico |
| GET    | `/alunos/turma/:turmaId`       | Lista alunos de uma turma           |
| PUT    | `/alunos/:id`                  | Atualiza dados de um aluno          |
| DELETE | `/alunos/:id`                  | Remove um aluno                     |

**Payload — `POST /alunos`**
```json
{
  "matricula": "2025001",
  "nome": "João da Silva",
  "biometria": 42,
  "turma_id": 1
}
```

### Acessos — `/acessos`

| Método | Rota               | Descrição                              |
|--------|--------------------|----------------------------------------|
| POST   | `/acessos`         | Registra um novo acesso manualmente    |
| GET    | `/acessos`         | Lista todo o histórico de acessos      |
| GET    | `/acessos/hoje`    | Lista os acessos registrados no dia    |
| GET    | `/acessos/:id`     | Busca um acesso específico por ID      |
| PUT    | `/acessos/:id`     | Atualiza dados de um acesso (ex: tipo) |
| DELETE | `/acessos/:id`     | Remove um registro de acesso           |

> Os campos `entrada` e `saida` na entidade Aluno são **opcionais** (sendo preenchidos automaticamente na identificação, além do histórico armazenado em `Acesso`). Quando omitidos na criação, são salvos como `null`. Os campos `matricula` e `biometria` são únicos — duplicatas retornam `409 Conflict`.

---

## Testes

```bash
cd backend

pnpm run test        # unitários
pnpm run test:watch  # modo watch
pnpm run test:cov    # cobertura
pnpm run test:e2e    # end-to-end
```

**Cobertura atual:**

| Serviço      | Testes | Cenários cobertos                                    |
|--------------|--------|------------------------------------------------------|
| TurmaService | 14     | create, findAll, findById, findByAno, update, delete |
| AlunoService | 11     | create, findAll, findById, update, delete            |

---

## Estrutura de Pastas

```
BiometriaAFS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Modelos Turma e Aluno
│   │   └── migrations/                # Histórico de migrations
│   ├── src/
│   │   ├── controllers/               # TurmaController, AlunoController
│   │   ├── services/                  # TurmaService, AlunoService, PrismaService
│   │   ├── repositories/              # TurmaRepository, AlunoRepository
│   │   │   └── interfaces/            # IRepository<T>
│   │   ├── dtos/                      # DTOs de criação e atualização
│   │   ├── entities/                  # Representação das entidades
│   │   ├── modules/                   # AppModule
│   │   ├── common/                    # Código reutilizável
│   │   ├── config/                    # Configurações
│   │   └── utils/                     # Utilitários
│   └── test/
│       ├── turma.service.spec.ts
│       ├── aluno.service.spec.ts
│       └── app.e2e-spec.ts
│
├── frontend/
│   └── src/
│       ├── components/                # Header, Footer, CadastroForm, AlunosTable, modais
│       ├── hooks/                     # useAlunos, useStatus
│       └── constants/                 # Dados iniciais e opções de turma
│
├── extensao/
│   ├── content.js                     # Script injetado no portal Seduc
│   ├── manifest.json                  # Manifest V3
│   └── popup/                         # UI da extensão (HTML, CSS, JS)
│
└── Esp32S3_Biometrics/
    └── Code_Biometrics/
        └── Code_Biometrics.ino        # Firmware ESP32-S3 + AS608
```

---

## Padrões e Boas Práticas

- **Repository Pattern** — isolamento da camada de dados dos serviços
- **DTOs com `class-validator`** — validação declarativa nas entradas HTTP
- **Injeção de Dependência** — via sistema nativo do NestJS, facilitando mocks nos testes
- **Exceções semânticas** — `NotFoundException`, `ConflictException` e `BadRequestException` conforme o contexto
- **Testes unitários isolados** — repositórios completamente mockados, sem dependência de banco real
- **Custom Hooks (React)** — lógica de estado separada dos componentes de UI

---

## Licença

Distribuído sob a licença **MIT**. Veja `LICENSE` para mais detalhes.
