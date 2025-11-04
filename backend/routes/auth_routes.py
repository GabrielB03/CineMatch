from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"message": "Email já cadastrado"}), 400

        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"message": "Nome de usuário já existe"}), 400

        hashed_password = bcrypt.generate_password_hash(
            data["password"]).decode("utf-8")
        new_user = User(
            username=data["username"], email=data["email"], password_hash=hashed_password)

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Usuário registrado com sucesso!"}), 201
    except Exception as e:
        print(f"❌ Erro no registro: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data["email"]).first()

        if user and bcrypt.check_password_hash(user.password_hash, data["password"]):
            token = create_access_token(identity=str(user.id))
            return jsonify(
                {
                    "access_token": token,
                    "user": {"id": user.id, "username": user.username, "email": user.email},
                }
            ), 200

        return jsonify({"message": "Credenciais inválidas"}), 401
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500

@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    """Rota protegida para teste"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({"message": "Acesso autorizado!", "user": {"id": user.id, "username": user.username}}), 200