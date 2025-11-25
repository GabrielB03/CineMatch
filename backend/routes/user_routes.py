from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models.user import User
from extensions import db

user_bp = Blueprint('users', __name__, url_prefix='/users')

@user_bp.route('', methods=['GET'])
@jwt_required()
def list_users():
    try:
        users_data = User.query.with_entities(
            User.id, User.username).order_by(User.id).all()

        users_list = []
        for id, username in users_data:
            users_list.append({
                'id': id,
                'username': username
            })

        return jsonify(users_list), 200

    except Exception as e:
        print(f"❌ Erro interno ao buscar usuários (SQLAlchemy): {e}")
        return jsonify({'message': 'Erro interno ao buscar usuários'}), 500

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    try:
        user = User.query.filter_by(id=user_id).first()

        if user is None:
            return jsonify({'message': 'Usuário não encontrado'}), 404

        user_profile = {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }

        return jsonify(user_profile), 200

    except Exception as e:
        print(f"❌ Erro interno ao buscar perfil (SQLAlchemy): {e}")
        return jsonify({'message': 'Erro interno ao buscar perfil'}), 500