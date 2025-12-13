const API_BASE_URL = "https://cinematch-api-mhxk.onrender.com";

const getCookie = (name) => {
  if (!document.cookie) return null;
  const xsrfCookies = document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.startsWith(name + "="));

  if (xsrfCookies.length === 0) return null;
  return xsrfCookies[0].split("=")[1];
};

export const removeToken = () => {
  fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
    .then((response) => {
      console.log("Cookie de sessão enviado para a remoção.");
    })
    .catch((err) => {
      console.error("Erro ao tentar remover cookie do servidor:", err);
    });
};

export const getToken = () => {
  // A correção: Checa se o cookie de acesso (padrão Flask-JWT-Extended) existe.
  const accessTokenCookie = getCookie("access_token_cookie");

  // Retorna o DUMMY token SOMENTE se o cookie de sessão estiver ativo (usuário logado).
  if (accessTokenCookie) {
    return "DUMMY_TOKEN_CHECK";
  }

  // Se o usuário não está logado, retorna null, resolvendo o problema do botão SAIR.
  return null;
};

export const decodeToken = (token) => {
  if (!token || token === "DUMMY_TOKEN_CHECK") return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16).slice(-2));
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const defaultOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (mergedOptions.method !== "GET") {
    const csrfToken = getCookie("csrf_access_token");

    if (csrfToken) {
      mergedOptions.headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }

  const cleanedEndpoint = endpoint.startsWith("/")
    ? endpoint.substring(1)
    : endpoint;
  const url = `${API_BASE_URL}/${cleanedEndpoint}`;

  const response = await fetch(url, mergedOptions);

  if (response.status === 401) {
    throw new Error("401: Token expirado ou não autorizado.");
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorData = null;

    // Tratamento robusto para evitar o SyntaxError: JSON.parse
    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      try {
        const textError = await response.text();
        console.error(
          "Erro no JSON. Conteúdo do corpo:",
          textError.substring(0, 200) + "..."
        );
        errorMessage = `Erro ${response.status}: Resposta não é JSON (Erro interno no servidor).`;
      } catch (textReadError) {
        console.error(
          "Falha ao tentar ler a resposta como texto:",
          textReadError
        );
      }
    }

    throw new Error(`${response.status}: ${errorMessage}`);
  }

  return response;
};