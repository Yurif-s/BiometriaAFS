# BiometriaAFS

Sistema de controle de frequência biométrica para instituições de ensino. O backend gerencia **alunos** e **turmas** via API REST, enquanto um dispositivo **ESP32** realiza a leitura de digitais e comunica as presenças ao servidor.

---

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Testes](#testes)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Hardware (ESP32)](#hardware-esp32)

---

## Sobre o Projeto

O **BiometriaAFS** automatiza o registro de frequência escolar através de biometria digital. O fluxo é simples: o aluno aproxima o dedo do sensor acoplado ao ESP32 → o dispositivo envia a leitura para a API → o backend identifica o aluno e registra a presença.

**Funcionalidades:**

- CRUD completo de Turmas
- CRUD completo de Alunos com vinculação por turma
- Identificação de aluno por biometria (integração com ESP32)
- Busca de aluno por matrícula
- Listagem de alunos por turma e por ano
- Validação de unicidade de matrícula e biometria
- Testes unitários dos serviços

---

## Arquitetura

O projeto segue uma **arquitetura em camadas**, promovendo separação de responsabilidades e facilitando testes isolados:

```
HTTP Request
     │
     ▼
┌─────────────┐
│ Controllers │  ← Entrada HTTP, validação de rota e parâmetros
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  ← Regras de negócio, validações de domínio
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ Repositories │  ← Acesso a dados via Prisma ORM
└──────┬───────┘
       │
       ▼
┌────────────┐
│ PostgreSQL │
└────────────┘
```

### Modelos de Dados

**Turma**

| Campo | Tipo    | Descrição              |
|-------|---------|------------------------|
| id    | Int     | Identificador único    |
| nome  | String  | Nome da turma          |
| ano   | Int     | Ano letivo             |

**Aluno**

| Campo     | Tipo     | Descrição                              |
|-----------|----------|----------------------------------------|
| id        | Int      | Identificador único                    |
| matricula | String   | Matrícula (única)                      |
| nome      | String   | Nome completo                          |
| biometria | Int      | ID do template biométrico (único)      |
| entrada   | DateTime | Registro de entrada                    |
| saida     | DateTime | Registro de saída                      |
| turma_id  | Int      | FK para Turma                          |

---

## Tecnologias

| Tecnologia    | Versão   | Uso                          |
|---------------|----------|------------------------------|
| NestJS        | ^11.0    | Framework backend             |
| TypeScript    | ^5.7     | Linguagem                    |
| Prisma ORM    | ^7.4     | Acesso ao banco de dados     |
| PostgreSQL    | —        | Banco de dados relacional    |
| Jest          | ^30.0    | Testes unitários             |
| pnpm          | —        | Gerenciador de pacotes       |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [PostgreSQL](https://www.postgresql.org/) >= 14

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/Yurif-s/BiometriaAFS.git
cd BiometriaAFS/backend

# Instale as dependências
pnpm install
```

---

## Configuração

### 1. Variáveis de ambiente

Crie um arquivo `.env` na raiz do `backend/`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/biometriaafs"
```

### 2. Banco de dados

```bash
# Executa as migrations
npx prisma migrate dev

# Gera o Prisma Client
npx prisma generate
```

---

## Executando o Projeto

```bash
# Modo desenvolvimento (com hot reload)
pnpm run start:dev

# Modo produção
pnpm run build
pnpm run start:prod
```

A API estará disponível em `http://localhost:3000`.

---

## Endpoints da API

### Turmas — `/turmas`

| Método | Rota            | Descrição                  |
|--------|-----------------|----------------------------|
| POST   | `/turmas`       | Cria uma nova turma        |
| GET    | `/turmas`       | Lista todas as turmas      |
| GET    | `/turmas/:id`   | Busca turma por ID         |
| GET    | `/turmas/ano/:ano` | Busca turmas por ano    |
| PUT    | `/turmas/:id`   | Atualiza uma turma         |
| DELETE | `/turmas/:id`   | Remove uma turma           |

**Payload — `POST /turmas`**
```json
{
  "nome": "3º A",
  "ano": 2025
}
```

---

### Alunos — `/alunos`

| Método | Rota                          | Descrição                        |
|--------|-------------------------------|----------------------------------|
| POST   | `/alunos`                     | Cria um novo aluno               |
| GET    | `/alunos`                     | Lista todos os alunos            |
| GET    | `/alunos/:id`                 | Busca aluno por ID               |
| GET    | `/alunos/matricula/:matricula`| Busca aluno por matrícula        |
| GET    | `/alunos/biometria/:biometria`| Busca aluno por template biométrico |
| GET    | `/alunos/turma/:turmaId`      | Lista alunos de uma turma        |
| PUT    | `/alunos/:id`                 | Atualiza dados de um aluno       |
| DELETE | `/alunos/:id`                 | Remove um aluno                  |

**Payload — `POST /alunos`**
```json
{
  "matricula": "2025001",
  "nome": "João da Silva",
  "biometria": 42,
  "entrada": "2025-03-10T07:30:00.000Z",
  "saida": "2025-03-10T13:00:00.000Z",
  "turma_id": 1
}
```

> **Nota:** os campos `matricula` e `biometria` são únicos por aluno. Tentativas de duplicação resultam em `409 Conflict`.

---

## Testes

Os testes unitários ficam em `test/` e cobrem os serviços `TurmaService` e `AlunoService`.

```bash
# Executa os testes unitários
pnpm run test

# Modo watch (re-executa ao salvar)
pnpm run test:watch

# Cobertura de código
pnpm run test:cov

# Testes e2e
pnpm run test:e2e
```

**Cobertura atual dos serviços:**

| Serviço        | Testes | Cenários cobertos                                   |
|----------------|--------|-----------------------------------------------------|
| TurmaService   | 14     | create, findAll, findById, findByAno, update, delete |
| AlunoService   | 11     | create, findAll, findById, update, delete            |

---

## Estrutura de Pastas

```
BiometriaAFS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Modelos Turma e Aluno
│   │   └── migrations/           # Histórico de migrations
│   ├── src/
│   │   ├── controllers/          # TurmaController, AlunoController
│   │   ├── services/             # TurmaService, AlunoService, PrismaService
│   │   ├── repositories/         # TurmaRepository, AlunoRepository
│   │   │   └── interfaces/       # IRepository<T>
│   │   ├── dtos/                 # DTOs de criação e atualização
│   │   ├── entities/             # Representação das entidades
│   │   ├── modules/              # AppModule
│   │   ├── common/               # Código reutilizável
│   │   ├── config/               # Configurações
│   │   └── utils/                # Utilitários
│   └── test/
│       ├── turma.service.spec.ts
│       ├── aluno.service.spec.ts
│       └── app.e2e-spec.ts
└── esp32_digital_clone/
    └── esp32_digital_clone.ino   # Firmware do sensor biométrico
```

---

## Hardware (ESP32)

O firmware localizado em `esp32_digital_clone/` simula a leitura biométrica utilizando um sensor ultrassônico como substituto do leitor de digital para fins de desenvolvimento.

**Componentes:**

| Componente      | Pino ESP32 |
|-----------------|-----------|
| Trigger (HC-SR04) | GPIO 5  |
| Echo (HC-SR04)    | GPIO 18 |
| Buzzer            | GPIO 4  |
| LED WiFi          | GPIO 2  |
| LED Presença      | GPIO 36 |

**Fluxo do firmware:**

1. Conecta ao WiFi
2. Aguarda detecção de proximidade via sensor ultrassônico
3. Ao detectar presença, emite sinal sonoro e luminoso
4. Envia a leitura biométrica para a API (`GET /alunos/biometria/:id`)

> Para usar o leitor de digital real (ex: **AS608** ou **R307**), substitua a lógica do sensor ultrassônico pela leitura do template via comunicação serial no firmware.

---

## Padrões e Boas Práticas

- **Repository Pattern** — isolamento da camada de dados dos serviços
- **DTOs com `class-validator`** — validação declarativa nas entradas HTTP
- **Injeção de Dependência** — via sistema nativo do NestJS, facilitando mocks nos testes
- **Exceções semânticas** — `NotFoundException`, `ConflictException` e `BadRequestException` usados conforme o contexto
- **Testes unitários isolados** — repositórios completamente mockados, sem dependência de banco real

---

## Licença

Distribuído sob a licença **MIT**. Veja `LICENSE` para mais detalhes.
