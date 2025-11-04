from datetime import datetime
from extensions import db

class Watchlist(db.Model):
    __tablename__ = "watchlist"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text) # Notas opcionais do usuário
    priority = db.Column(db.Integer, default=1) # 1=baixa, 2=média, 3=alta
    
    # Constraint única para evitar duplicatas
    __table_args__ = (db.UniqueConstraint("user_id", "movie_id"),)
    
    def __repr__(self):
        return f"<Rating user={self.user_id} movie={self.movie_id} priority={self.priority}>"