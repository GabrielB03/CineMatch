import unicodedata

def remover_acentos(texto: str) -> str:
    """Remove acentos de uma string."""
    if isinstance(texto, str):
        return unicodedata.normalize("NFKD", texto).encode("ASCII", "ignore").decode("ASCII")
    return texto