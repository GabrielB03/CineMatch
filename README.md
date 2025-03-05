# CineMatch

## Overview
CineMatch é uma aplicação web projetada para fornecer recomendações de filmes e mostrar onde assisti-los nas plataformas de streaming. Com um backend desenvolvido em Python usando Flask, frontend em HTML, CSS e JavaScript, e um banco de dados PostgreSQL para armazenar usuários e informações dos filmes, CineMatch torna a experiência de descobrir e assistir filmes mais fácil e acessível.

## Features
- **Sistema de Recomendação de Filmes:** Receba recomendações de filmes com base nas preferências do usuário.
- **Busca por Filmes:** Pesquise filmes na base de dados do IMDB para ver informações e onde assisti-los.
- **Registro e Login de Usuários:** Sistema de registro de contas e login para acessar as recomendações personalizadas.
- **Plataformas de Streaming:** Mostra onde assistir aos filmes nas principais plataformas de streaming.
- **Base de Dados IMDB:** Integração com a base de dados do IMDB para manter informações atualizadas sobre filmes.

## Tecnologias Usadas
- **Python & Flask:** Para o backend e lógica de servidor.
- **HTML, CSS e JavaScript:** Para o desenvolvimento do frontend e interface do usuário.
- **PostgreSQL:** Para armazenar dados dos usuários e filmes.
- **IMDB Database API:** Para integrar dados de filmes e plataformas de streaming.

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
