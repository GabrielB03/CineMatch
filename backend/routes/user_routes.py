from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required
from utils.database import get_db_connection

user_bp = Blueprint('users', __name__, url_prefix='/api')

@user_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = "SELECT id, username FROM \"user\" ORDER BY id"
        cursor.execute(query)
        users_data = cursor.fetchall()
        users_list = []
        for user in users_data:
            users_list.append({
                'id': user[0],
                'username': user[1]
            })
        return jsonify(users_list), 200

    except Exception as e:
        current_app.logger.error(f"DATABASE ERROR: {e}")
        return jsonify({'message': 'Erro interno ao buscar usuários'}), 500

    finally:
        cursor.close()
        conn.close()

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query = "SELECT id, username, email FROM \"user\" WHERE id = %s"
        cursor.execute(query, (user_id,))
        user_data = cursor.fetchone()

        if user_data is None:
            return jsonify({'message': 'Usuário não encontrado'}), 404

        user_profile = {
            'id': user_data[0],
            'username': user_data[1],
            'email': user_data[2]
        }

        return jsonify(user_profile), 200

    except Exception as e:
        current_app.logger.error(f"DATABASE ERROR: {e}")
        return jsonify({'message': 'Erro interno ao buscar perfil'}), 500

    finally:
        cursor.close()
        conn.close()