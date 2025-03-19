// Função para redirecionar ao login e salvar a página de destino
function redirectToLogin() {
  localStorage.setItem("redirectPage", window.location.href);
  window.location.href = "login.html";
}

// Função para registrar um novo usuário
document
  .getElementById("registerForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        window.location.href = "login.html";
      }
    } catch (error) {
      console.error("Erro ao registrar:", error);
      alert("Erro ao conectar ao servidor.");
    }
  });

// Função para login do usuário
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://127.0.0.1:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem("token", data.access_token);

      const redirectPage =
        localStorage.getItem("redirectPage") || "genre_selection.html";
      localStorage.removeItem("redirectPage");

      window.location.href = redirectPage;
    } else {
      alert("Credenciais inválidas");
    }
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    alert("Erro ao conectar ao servidor.");
  }
});

// Função para salvar o gênero escolhido e redirecionar para recomendações
document.getElementById("genreForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedGenre = document.getElementById("genreSelect").value;

  if (!selectedGenre) {
    alert("Por favor, escolha um gênero!");
    return;
  }

  localStorage.setItem("selectedGenre", selectedGenre);
  window.location.href = "recommendations.html";
});

// Função para carregar recomendações baseadas no gênero escolhido
async function loadRecommendations() {
  const token = localStorage.getItem("token");
  const selectedGenre = localStorage.getItem("selectedGenre");

  if (!token) {
    alert("Você precisa estar logado para ver as recomendações.");
    redirectToLogin();
    return;
  }

  if (!selectedGenre) {
    alert("Por favor, escolha um gênero antes de ver recomendações.");
    window.location.href = "genre_selection.html";
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:5000/recommendations?genre=${selectedGenre}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao buscar recomendações.");
    }

    const data = await response.json();
    const recommendationsList = document.getElementById("recommendationsList");

    if (recommendationsList) {
      recommendationsList.innerHTML = data.recommendations
        .map(
          (movie) =>
            `<li>${movie.Title} - ${movie["IMDb Score (1-10)"]} ⭐ (${movie["Director Name"]})</li>`
        )
        .join("");
    }
  } catch (error) {
    console.error("Erro ao carregar recomendações:", error);
    alert("Erro ao carregar filmes recomendados.");
  }
}

// Carregar recomendações se estiver na página correta
if (window.location.pathname.includes("recommendations.html")) {
  loadRecommendations();
}