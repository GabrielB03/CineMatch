GENRE_ID_TO_NAME = {
    28: "Ação",
    12: "Aventura",
    16: "Animação",
    35: "Comédia",
    80: "Crime",
    99: "Documentário",
    18: "Drama",
    10751: "Família",
    14: "Fantasia",
    36: "História",
    27: "Terror",
    10402: "Música",
    9648: "Mistério",
    10749: "Romance",
    878: "Ficção científica",
    10770: "Filme de TV",
    53: "Thriller",
    10752: "Guerra",
    37: "Faroeste"
}

class NotEnoughRatingsError(Exception):
    def __init__(self, required_count: int, current_count: int, message: str = "Avaliações insuficientes."):
        self.required_count = required_count
        self.current_count = current_count
        self.message = (
            f"{message} Você possui {current_count} avaliações, mas precisa de "
            f"pelo menos {required_count} para desbloquear este recurso."
        )
        super().__init__(self.message)