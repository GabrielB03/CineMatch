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

export const isTokenPresent = () => {
  return !!getCookie("csrf_access_token");
};

export const getToken = () => {
  const realToken = getCookie("csrf_access_token");
  if (realToken) return realToken;

  return "DUMMY_TOKEN_CHECK";
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
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      console.error("Não foi possível ler o corpo do erro como JSON:", e);
    }

    throw new Error(`${response.status}: ${errorMessage}`);
  }

  return response;
};