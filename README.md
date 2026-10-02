# Gestão comercial

Aplicação web para organizar clientes, produtos, vendas, estoque e relatórios em um único fluxo.

## Sobre esta versão

Cópia independente para portfólio, com histórico novo. Não está conectada à aplicação em produção nem à sincronização do Lovable. Os arquivos de ambiente, identificadores do projeto de produção e dados de acesso não foram incluídos.

## Funcionalidades

- Cadastro e consulta de clientes e produtos.
- Controle de estoque na loja e em transporte.
- Registro de vendas com itens, custos e cálculo de lucro.
- Painel de acompanhamento e relatórios.
- Acesso com autenticação e lista de emails autorizados.

## Tecnologias

React, TypeScript, Vite, Tailwind CSS, shadcn/ui e Supabase (PostgreSQL).

## Executar localmente

Pré-requisitos: Node.js, npm e um projeto Supabase de teste.

```bash
git clone https://github.com/brunoYves22/gestaonathalia-portfolio.git
cd gestaonathalia-portfolio
npm install
cp .env.example .env.local
npm run dev
```

No Windows, copie `.env.example` para `.env.local` pelo Explorador ou com `Copy-Item .env.example .env.local` no PowerShell.

Preencha as variáveis com os valores do **seu projeto Supabase de teste**:

| Variável | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável ou anon do projeto de teste |
| `VITE_SUPABASE_PROJECT_ID` | Identificador do projeto de teste |

Aplique as migrações de `supabase/migrations` no seu banco de teste, em ordem cronológica. `supabase/config.toml` usa um identificador local genérico; configure seu próprio projeto se utilizar a CLI.

O banco inclui uma lista de emails autorizados. Depois de aplicar as migrações, cadastre o seu email na tabela `emails_permitidos` pelo SQL Editor do seu próprio Supabase antes de testar o acesso.

Validação do frontend: `npm run build`. O build não configura nem valida o banco de dados.

## Autor

[Bruno Yves Monteiro de Paula](https://www.linkedin.com/in/bruno-yves-monteiro-de-paula-923aa93b4/)
