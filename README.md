# CineMatch

## Visão Geral
CineMatch é uma aplicação web Full Stack desenvolvida para o TGI (Trabalho de Graduação Interdisciplinar) do curso de Ciência da Computação. O foco é fornecer recomendações de filmes personalizadas e indicar suas plataformas de streaming disponíveis. A arquitetura utiliza Python/Flask para o backend (API Rest) e React.js com Vite para o frontend, garantindo uma interface moderna e dinâmica. O sistema é suportado pelo banco de dados PostgreSQL para persistência de dados. CineMatch transforma a experiência de descobrir e assistir filmes, tornando-a mais fácil e acessível.

## Funcionalidades
- **Sistema de Recomendação Personalizada:** Algoritmo no backend que fornece recomendações de filmes com base nas preferências e histórico de avaliações de usuários.
- **Registro e Login de Usuários (JWT):** Sistema robusto de autenticação para acesso a experiências e dashboards personalizados.
- **Modo Escuro/Claro (Dark/Light Mode):** Interface de usuário adaptativa com persistência de tema, melhorando a acessibilidade e a experiência visual.
- **Plataformas de Streaming:** Integração de dados para mostrar onde assistir aos filmes nas principais plataformas de streaming.
- **Base de Dados de Filmes:** Integração com APIs externas (como a TMDB) para manter informações atualizadas e detalhadas sobre os filmes.
- **Avaliação e Lista de Desejos:** Permite que os usuários avaliem filmes e os adicionem à sua Watchlist (Lista de Desejos).

## Tecnologias Usadas
**Backend**:
**Python** & **Flask**: Lógica de servidor, API Restful e gerenciamento de rotas.

**Frontend**:
**React.js** & **Vite**: Biblioteca para a interface do usuário e bundler rápido.

**Banco de Dados**:
**PostgreSQL**: Sistema de Gerenciamento de Banco de Dados Relacional.

**ORM**:
**SQLAlchemy**: Mapeamento Objeto-Relacional para o Python.

**Autenticação**:
**JWT (Json Web Tokens)**: Geração de tokens de acesso para segurança de rotas.

**API Externa**:
**TMDB API (The Movie Database)**: Fonte de dados para informações de filmes, streamings e gêneros.

## Estrutura do Projeto
- **cinematch/**
  - **backend/**
    - **models/**
      - **__init__.py**: Inicialização do módulo models
      - **movie.py**: Modelo do filme
      - **rating.py**: Modelo de avaliação (rating)
      - **user.py**: Modelo do usuário
      - **watchlist.py**: Modelo da lista de desejos (watchlist)
    - **routes/**
      - **__init__.py**: Inicialização do módulo routes
      - **auth_routes.py**: Rotas de login e registro (autenticação)
      - **debug_routes.py**: Rotas para debug e testes
      - **genre_routes.py**: Rotas para manipulação de gêneros
      - **movie_routes.py**: Rotas para dados de filmes
      - **rating_routes.py**: Rotas para avaliação de filmes
      - **recommendation_routes.py**: Rotas para algoritmo de recomendação
      - **stats_routes.py**: Rotas para estatísticas
      - **watchlist_routes.py**: Rotas para gerenciamento da lista de desejos
    - **services/**
      - **__init__.py**: Inicialização do módulo services
      - **recommendation_service.py**: Lógica do algoritmo de recomendação
      - **tmdb_service.py**: Integração com TMDB
    - **utils/**
      - **__init__.py**: Inicialização do módulo utils
      - **constants.py**: Constantes do projeto
      - **helpers.py**: Funções auxiliares (helpers)
    - **.env**: Variáveis de Ambiente e Configuração de BD
    - **app.py**: Ponto de entrada da aplicação Flask
    - **config.py**: Configurações gerais
    - **extensions.py**: Inicialização de extensões (SQLAlchemy, etc.)
- **frontend/**
  - **node_modules/**
  - **public/**
  - **src/**
    - **assets/**
      - **cinematch.png**: Logo/ícone do projeto
    - **components/**
      - **Feedback.jsx**: Componente de feedback ou mensagens
      - **Layout.jsx**: Estrutura principal da página (header/footer)
      - **StarRating.jsx**: Componente de avaliação por estrelas
      - **ThemeSwitch.jsx**: Botão dark/light mode
    - **pages/**
      - **GenreSelectionPage.jsx**: Página de seleção de gêneros
      - **HomePage.jsx**: Página inicial
      - **LoginPage.jsx**: Página de login
      - **RecommendationPage.jsx**: Página principal de recomendações
      - **RegisterPage.jsx**: Página de registro
    - **utils/**
      - **authApi.js**: Funções para manipulação de tokens/autenticação
      - **ThemeContext.jsx**: Context API para gerenciamento de tema
    - **App.css**: Estilos globais (incluindo Dark Mode)
    - **App.jsx**: Roteamento central (React Router)
    - **index.css**: Estilos base
    - **main.jsx**: Ponto de montagem do React
  - **.eslintrc.config.js**: Configuração do linter ESLint
  - **index.html**: HTML principal (ponto de montagem do React)
  - **package.json**: Dependências Node
  - **package-lock.json**
  - **viteconfig.js**: Configuração do bundler Vite
 - **venv/**
 - **.gitignore**: Arquivos e pastas a serem ignorados pelo Git
 - **requirements.txt**: Dependências Python (do Backend)

## Como Rodar o Projeto (Localmente)

1. Pré-requisitos:
   - **Python 3.8+**
   - **Node.js** e **npm** (ou **yarn**)
   - **PostgreSQL** (Servidor de Banco de Dados)
   - **React.js** (Conhecimento básico)
   - **Git**

2. Setup e Configuração do Backend (Flask):
O backend é responsável pela API e pela comunicação com o PostgreSQL.

**A. Download e Setup**
  1. Clone o repositório:
     ```bash
     git clone https://github.com/GabrielB03/CineMatch.git
     cd CineMatch
     ```
  2. Crie e ative o ambiente virtual:
     ```bash
     python -m venv venv
     venv\Scripts\activate  # Windows
     source venv/bin/activate  # Linux
     ```
  3. Instale as dependências Python:
     ```bash
     pip install -r requirements.txt
     ```

**B. Configuração do Banco de Dados (PostgreSQL)**
O projeto requer um banco de dados chamado ```cinematch_db```. Você pode criá-lo via linha de comando (psql) com o seguinte comando:

  1. Acesse o console do PostgreSQL:
     ```bash
     ```

## Licença

Esse projeto está licenciado sob a Licença MIT - veja o arquivo [LICENÇA](LICENSE) para mais detalhes.












