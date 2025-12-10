from flask import Blueprint, request, jsonify
from extensions import bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        # Substituindo a lógica de DB para registro temporariamente
        hashed_password = bcrypt.generate_password_hash(
            data["password"]).decode("utf-8")

        # Simulação: assumir que o registro foi bem-sucedido
        return jsonify({"message": "Usuário registrado com sucesso!"}), 201
    except Exception as e:
        print(f"❌ Erro no registro: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = None

        if user and bcrypt.check_password_hash(user.password_hash, data["password"]):
            access_token = create_access_token(identity=str(user.id), additional_claims={
                'username': user.username,
                'email': user.email
            })

            response = jsonify({
                "message": "Login realizado com sucesso",
                "user": {"id": user.id, "username": user.username, "email": user.email},
            })

            set_access_cookies(response, access_token)

            return response, 200

        return jsonify({"message": "Credenciais inválidas"}), 401
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logout realizado com sucesso"})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route("/user-profile", methods=["GET"])
@jwt_required()
def user_profile():
    try:
        user_id = get_jwt_identity()
        user = None

        if user:
            return jsonify({
                "id": user.id,
                "username": user.username,
                "email": user.email
            }), 200

        return jsonify({"message": "Usuário não encontrado"}), 404
    except Exception as e:
        print(f"❌ Erro ao buscar perfil: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500

@auth_bp.route("/account", methods=["PUT"])
@jwt_required()
def update_account():
    try:
        user_id = get_jwt_identity()
        user = None

        if not user:
            return jsonify({"message": "Usuário não encontrado."}), 404

        data = request.get_json()

        current_password = data.get('current_password')
        if not current_password:
            return jsonify({"message": "Senha atual incorreta."}), 401

        # Lógica de atualização removida

        new_access_token = create_access_token(identity=str(user_id), additional_claims={
            'username': user.username,
            'email': user.email
        })
        response = jsonify(
            {"message": "Conta atualizada com sucesso!", "new_access_token": new_access_token})
        set_access_cookies(response, new_access_token)

        return response, 200

    except Exception as e:
        print(f"❌ Erro na atualização da conta: {e}")
        return jsonify({"message": "Erro interno do servidor"}), 500

@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    user = None
    return jsonify({"message": "Acesso autorizado!", "user": {"id": user_id, "username": "teste"}}), 200