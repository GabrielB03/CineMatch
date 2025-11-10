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
- **backend/**
  - **assets/**
    - **IMDB-Movie-Database.xlsx:** Arquivo onde ficam os filmes
  - **app.py:** Arquivo principal do backend, onde a lógica do servidor Flask é implementada.
- **frontend/**
  - **css/**
    - **styles.css:** Arquivo onde fica a personalização do site.
  - **js/**
    - **script.js:** Arquivo JavaScript com as funcionalidades do site.
  - **genre_selection.html:** Página com seleção de gênero para escolher a recomendação de filmes.
  - **index.html:** Página para login ou registro de usuários.
  - **login.html:** Página de login.
  - **recommendations.html:** Página de recomendações de filmes conforme a seleção de gêneros.
  - **register.html:** Página de registro de usuários

## Como Rodar o Projeto

1. Clone o repositório:
  ```bash
   git clone https://github.com/GabrielB03/CineMatch.git
  ```
2. Instale as dependências:
  ```bash
  pip install -r requirements.txt
  ```
3. Execute o servidor Flask:
  ```bash
  python app.py
  ```
4. Abra o link generado, no caso:
   http://127.0.0.1:5000 ou http://192.168.0.101:5000

## Licença

Esse projeto está licenciado sob a Licença MIT - veja o arquivo [LICENÇA](LICENSE) para mais detalhes.


