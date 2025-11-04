/* eslint-disable no-useless-catch */
// URL base da API Flask.
const API_BASE_URL = "http://localhost:5000";

// ------------------------------------
// 1. UTILS DE TOKEN
// ------------------------------------

export function saveToken(token) {
  // Salvar o token
  localStorage.setItem("jwt_token", token);
}

export function getToken() {
  // Obter o token
  return localStorage.getItem("jwt_token");
}

export function removeToken() {
  // Remover o token (usado para Logout)
  localStorage.removeItem("jwt_token");
}

// ------------------------------------
// 2. FETCH COM AUTENTICAÇÃO
// ------------------------------------

/**
 * Função utilitária para fazer requisições à API Flask com o token JWT.
 * @param {string} endpoint O endpoint da API, ex: /recommendations
 * @param {object} options Opções do fetch, como method, body, headers.
 * @returns {Promise<Response>} A resposta bruta do fetch.
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();

  // Verifica se há um token
  if (!token) {
    // Para rotas protegidas, o React deve lidar com o redirecionamento se não houver token.
    console.error("Token não encontrado. Necessário login.");
    // Aqui NÃO rejeitamos a Promise, mas retornamos um erro de forma controlada.
    throw new Error("Token não encontrado");
  }

  // Constrói a URL completa
  const url = `${API_BASE_URL}${endpoint}`;

  // Adiciona o token e o Content-Type aos headers
  const finalOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`, // Adiciona o token JWT
      "Content-Type": "application/json", // Garante o formato JSON
    },
  };

  try {
    const response = await fetch(url, finalOptions);

    // Lógica de tratamento de erro (Adaptado do seu script.js)
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado ou inválido (IMPORTANTE para segurança)
        removeToken();
        // Lança erro para o componente lidar com o redirecionamento
        throw new Error("Token expirado. Faça login novamente.");
      } else if (response.status === 404) {
        throw new Error("Recurso não encontrado.");
      } else if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Dados inválidos enviados. (Detalhes ausentes)";
        throw new Error(`422_VALIDATION_ERROR: ${errorMessage}`);
      } else {
        // Tenta ler a mensagem de erro do corpo, se houver
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          `Erro ${response.status}: ${errorData.message || response.statusText}`
        );
      }
    }

    // Se a resposta for OK, retorne a resposta para que o componente a processe
    return response;
  } catch (error) {
      // Relança qualquer erro de rede ou o erro de 401/404/etc
      throw error;
  }
}