// ======== UTILITÁRIOS JWT ========
function saveToken(token) {
  localStorage.setItem("jwt_token", token);
}

function getToken() {
  return localStorage.getItem("jwt_token");
}

function fetchWithAuth(url, options = {}) {
  const token = getToken();
  if (!token) {
    return Promise.reject(new Error("Token não encontrado"));
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then((response) => {
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado ou inválido
        localStorage.removeItem("jwt_token");
        throw new Error("Token expirado. Faça login novamente.");
      } else if (response.status === 404) {
        throw new Error("Recurso não encontrado.");
      } else if (response.status === 422) {
        throw new Error("Dados inválidos enviados.");
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    }
    return response;
  });
}

// ======== FUNÇÃO PARA EMBARALHAR ARRAY ========
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ======== FUNÇÃO PARA CRIAR SISTEMA DE ESTRELAS ========
function createStarRating(tmdbId, currentRating = 0) {
  const starContainer = document.createElement("div");
  starContainer.className = "star-rating";
  starContainer.dataset.tmdb = tmdbId;

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.dataset.value = i;
    star.innerHTML = "&#9733;";

    // Marcar estrelas já avaliadas (currentRating vem como 0-10, convertemos para 1-5)
    if (i <= Math.round(currentRating / 2)) {
      star.classList.add("active");
    }

    starContainer.appendChild(star);
  }

  return starContainer;
}

// ======== FUNÇÃO PARA ATIVAR SISTEMA DE ESTRELAS ========
function activateStarRating(starContainer) {
  const tmdbId = parseInt(starContainer.dataset.tmdb); // Garantir que seja número
  const stars = starContainer.querySelectorAll(".star");

  stars.forEach((star, index) => {
    star.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevenir comportamentos indesejados

      const rating = parseInt(star.dataset.value);
      console.log(
        `Tentando avaliar filme ${tmdbId} com nota ${rating} (convertido para ${
          rating * 2
        })`
      );

      // Validar dados antes de enviar
      if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
        console.error("ID do filme inválido:", tmdbId);
        alert("Erro: ID do filme inválido.");
        return;
      }

      if (!rating || rating < 1 || rating > 5) {
        console.error("Rating inválido:", rating);
        alert("Erro: Avaliação deve ser entre 1 e 5 estrelas.");
        return;
      }

      // Atualizar visualmente primeiro
      stars.forEach((s, i) => {
        if (i < rating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });

      try {
        // Verificar se o usuário está logado antes de tentar avaliar
        const token = getToken();
        if (!token) {
          alert("Você precisa estar logado para avaliar filmes.");
          return;
        }

        // Preparar dados para enviar
        const ratingData = {
          rating: rating * 2, // Converter 1-5 estrelas para 2-10
        };

        console.log("Enviando dados:", ratingData);

        const response = await fetchWithAuth(`/movies/${tmdbId}/rate`, {
          method: "POST",
          body: JSON.stringify(ratingData),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✔ Avaliação salva:", data);

          // Mostrar feedback visual de sucesso
          showSuccessMessage(starContainer, "Avaliação salva!");
        } else {
          // Tentar ler a resposta de erro
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = {
              message: `Erro ${response.status}: ${response.statusText}`,
            };
          }

          console.error("Erro na resposta:", response.status, errorData);
          throw new Error(errorData.message || `Erro ${response.status}`);
        }
      } catch (error) {
        console.error("Erro ao salvar avaliação:", error);

        // Mostrar mensagem de erro específica
        let errorMessage = "Erro ao salvar avaliação. ";
        if (error.message.includes("401") || error.message.includes("Token")) {
          errorMessage += "Faça login novamente.";
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
        } else if (error.message.includes("404")) {
          errorMessage += "Filme não encontrado no sistema.";
        } else if (error.message.includes("422")) {
          errorMessage += "Dados inválidos. Verifique se o filme existe.";
        } else {
          errorMessage += "Tente novamente.";
        }

        alert(errorMessage);

        // Reverter mudanças visuais em caso de erro
        stars.forEach((s) => s.classList.remove("active"));
      }
    });

    // Efeito hover melhorado
    star.addEventListener("mouseenter", () => {
      const rating = parseInt(star.dataset.value);
      stars.forEach((s, i) => {
        if (i < rating) {
          s.style.color = "#f5b301";
          s.style.transform = "scale(1.1)";
        } else {
          s.style.color = "#ccc";
          s.style.transform = "scale(1)";
        }
      });
    });

    star.addEventListener("mouseleave", () => {
      stars.forEach((s, i) => {
        const isActive = s.classList.contains("active");
        s.style.color = isActive ? "#f5b301" : "#ccc";
        s.style.transform = "scale(1)";
      });
    });
  });
}

// ======== FUNÇÃO PARA MOSTRAR MENSAGEM DE SUCESSO ========
function showSuccessMessage(container, message) {
  // Animação de sucesso
  container.style.transform = "scale(1.1)";
  container.style.boxShadow = "0 0 15px rgba(76, 175, 80, 0.6)";

  setTimeout(() => {
    container.style.transform = "scale(1)";
    container.style.boxShadow = "none";
  }, 300);

  // Mostrar mensagem de sucesso temporária
  const successMsg = document.createElement("div");
  successMsg.textContent = message;
  successMsg.style.cssText = `
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: #4caf50;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    z-index: 1000;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  container.style.position = "relative";
  container.appendChild(successMsg);

  setTimeout(() => {
    if (successMsg && successMsg.parentNode) {
      successMsg.parentNode.removeChild(successMsg);
    }
  }, 3000);
}

// ======== LOGIN ========
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        saveToken(data.access_token);
        console.log("Login realizado com sucesso");
        window.location.href = "recommendations.html";
      } else {
        alert(data.message || "Erro ao fazer login");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      alert("Erro de conexão. Verifique sua internet.");
    }
  });
}

// ======== REGISTRO ========
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registro realizado com sucesso!");
        window.location.href = "login.html";
      } else {
        alert(data.message || "Erro ao registrar");
      }
    } catch (err) {
      console.error("Erro no registro:", err);
      alert("Erro de conexão. Verifique sua internet.");
    }
  });
}

// ======== RECOMENDAÇÕES (GÊNERO OU HÍBRIDA) ========
const recommendationsList = document.getElementById("recommendationsList");
const urlParams = new URLSearchParams(window.location.search);
const genreId = urlParams.get("genre");

if (recommendationsList) {
  if (genreId) {
    // Recomendação por gênero (pública)
    console.log("Carregando filmes por gênero:", genreId);

    fetch(`/movies/by-genre/${genreId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        recommendationsList.innerHTML = "";
        if (data.results && data.results.length > 0) {
          // Embaralhar filmes aleatoriamente
          const shuffledMovies = shuffleArray(data.results);

          shuffledMovies.forEach((movie) => {
            const div = document.createElement("div");
            div.className = "movie-card";

            const posterUrl = movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "assets/placeholder.png";

            // Garantir que temos um ID válido
            const movieId = movie.id || movie.tmdb_id;
            if (!movieId) {
              console.warn("Filme sem ID válido:", movie);
              return;
            }

            div.innerHTML = `
              <h3>${movie.title || "Título não disponível"}</h3>
              <img src="${posterUrl}" alt="${
              movie.title
            }" onerror="this.src='assets/placeholder.png'" />
              <p>${movie.overview || "Sem descrição disponível."}</p>
              <p><strong>Nota TMDB:</strong> ${movie.vote_average || "N/A"}</p>
            `;

            // Adicionar sistema de estrelas
            const starRating = createStarRating(movieId);
            div.appendChild(starRating);
            recommendationsList.appendChild(div);

            // Ativar sistema de estrelas
            activateStarRating(starRating);
          });
        } else {
          recommendationsList.innerHTML =
            "<p>Nenhum filme encontrado para este gênero.</p>";
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar filmes por gênero:", error);
        recommendationsList.innerHTML =
          "<p>Erro ao carregar filmes por gênero. Tente novamente.</p>";
      });
  } else {
    // Recomendação híbrida (autenticada)
    console.log("Carregando recomendações personalizadas");

    fetchWithAuth("/recommendations")
      .then((res) => {
        if (res.status === 401) throw new Error("401");
        return res.json();
      })
      .then((data) => {
        recommendationsList.innerHTML = "";

        if (Array.isArray(data) && data.length > 0) {
          // Embaralhar recomendações aleatoriamente
          const shuffledRecommendations = shuffleArray(data);

          shuffledRecommendations.forEach((rec) => {
            const movie = rec.movie;
            if (!movie || !movie.tmdb_id) {
              console.warn("Recomendação sem dados válidos:", rec);
              return;
            }

            const div = document.createElement("div");
            div.className = "movie-card";

            const posterUrl = movie.poster_path || "assets/placeholder.png";

            div.innerHTML = `
              <h3>${movie.title || "Título não disponível"}</h3>
              <img src="${posterUrl}" alt="${
              movie.title
            }" onerror="this.src='assets/placeholder.png'" />
              <p><strong>Diretor:</strong> ${
                movie.director || "Desconhecido"
              }</p>
              <p><strong>Nota TMDB:</strong> ${movie.vote_average || "N/A"}</p>
              <p><em>${rec.reason || "Recomendado para você"}</em></p>
            `;

            // Criar e adicionar sistema de estrelas
            const starRating = createStarRating(
              movie.tmdb_id,
              rec.user_rating || 0
            );
            div.appendChild(starRating);
            recommendationsList.appendChild(div);

            // Ativar sistema de estrelas
            activateStarRating(starRating);
          });
        } else {
          recommendationsList.innerHTML =
            "<p>Nenhuma recomendação disponível. Avalie alguns filmes para receber sugestões personalizadas!</p>";
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar recomendações:", err);
        if (err.message === "401") {
          recommendationsList.innerHTML = `
            <div style="text-align: center; padding: 20px;">
              <p>Você precisa estar logado para ver recomendações personalizadas.</p>
              <a href="login.html" style="color: #5e1360; text-decoration: underline;">Fazer login</a>
            </div>
          `;
        } else {
          recommendationsList.innerHTML =
            "<p>Erro ao carregar recomendações. Tente novamente mais tarde.</p>";
        }
      });
  }
}

// ======== SELEÇÃO DE GÊNERO ========
const genreSelect = document.getElementById("genreSelect");
const genreForm = document.getElementById("genreForm");

if (genreSelect && genreForm) {
  fetch("/genres")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then((data) => {
      if (data.genres && Array.isArray(data.genres)) {
        // Embaralhar gêneros para variedade
        const shuffledGenres = shuffleArray(data.genres);
        shuffledGenres.forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = g.name;
          genreSelect.appendChild(opt);
        });
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar gêneros:", error);
      // Adicionar opção de erro
      const errorOpt = document.createElement("option");
      errorOpt.textContent = "Erro ao carregar gêneros";
      errorOpt.disabled = true;
      genreSelect.appendChild(errorOpt);
    });

  genreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const genreId = genreSelect.value;
    if (genreId && genreId !== "") {
      window.location.href = `recommendations.html?genre=${genreId}`;
    } else {
      alert("Por favor, selecione um gênero.");
    }
  });
}