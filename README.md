# 📌 BiometriaAFS - Backend

## 📖 Sobre o Projeto

O **BiometriaAFS** é uma API backend desenvolvida com **NestJS**, utilizando **Prisma ORM** para gerenciamento de banco de dados. O sistema tem como objetivo gerenciar entidades relacionadas a alunos e turmas.

---

## 🧱 Arquitetura

O projeto segue uma estrutura baseada em **arquitetura em camadas**, promovendo separação de responsabilidades:

```
src/
│
├── controllers/   # Camada de entrada (HTTP)
├── services/      # Regras de negócio
├── repositories/  # Acesso a dados
├── entities/      # Representação das entidades
├── dtos/          # Objetos de transferência de dados
├── modules/       # Organização dos módulos
├── config/        # Configurações
├── common/        # Código reutilizável
└── utils/         # Utilidades
```

---

## 🚀 Tecnologias Utilizadas

* NestJS
* Prisma ORM
* TypeScript
* PostgreSQL
* Jest

---

## ⚙️ Pré-requisitos

Antes de rodar o projeto, você precisa ter instalado:

* Node.js (>= 18)
* pnpm ou npm
* PostgreSQL

---

## 📦 Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Acesse a pasta
cd backend

# Instale as dependências
pnpm install
# ou
npm install
```

---

## 🗄️ Configuração do Banco de Dados

1. Crie um banco no PostgreSQL
2. Configure o arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/biometriaafs"
```

3. Execute as migrations:

```bash
npx prisma migrate dev
```

4. Gere o client do Prisma:

```bash
npx prisma generate
```

---

## ▶️ Executando o Projeto

```bash
# Desenvolvimento
pnpm run start:dev

# Produção
pnpm run build
pnpm run start:prod
```

A aplicação estará disponível em:

```
http://localhost:3000
```

---

## 🧪 Testes

```bash
# Testes unitários
pnpm run test

# Testes e2e
pnpm run test:e2e

# Cobertura
pnpm run test:cov
```

---

## 📌 Funcionalidades

* CRUD de Turmas
* Integração com banco via Prisma
* Estrutura modular com NestJS
* Testes automatizados

---

## 🧩 Estrutura do Prisma

```
prisma/schema.prisma
```

Migrations:

```
prisma/migrations/
```

---

## 📚 Padrões Utilizados

* Arquitetura em camadas
* DTOs
* Repository Pattern
* Injeção de dependência

---

## 👨‍💻 Contribuição

1. Fork o projeto
2. Crie uma branch:

```bash
git checkout -b minha-feature
```

3. Commit:

```bash
git commit -m "feat: minha nova feature"
```

4. Push:

```bash
git push origin minha-feature
```

5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.

---
