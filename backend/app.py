from flask import Flask, request, jsonify
from flask_cors import CORS
from database import init_db, get_db
from game_logic import calculate_performance

app = Flask(__name__)
CORS(app)

init_db()

@app.route("/")
def home():
    return "Memory Game "

@app.route("/api/patients", methods=["POST"])
def create_patient():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    name = data.get("name")
    age = data.get("age")
    preferred_language = data.get("preferred_language", "English")

    if not name:
        return jsonify({
            "error": "Name is required"
        }), 400

    connection = get_db()

    cursor = connection.execute(
        """
        INSERT INTO patients (name, age, preferred_language)
        VALUES (?, ?, ?)
        """,
        (name, age, preferred_language)
    )

    connection.commit()

    patient_id = cursor.lastrowid

    connection.close()

    return jsonify({
        "message": "Patient created successfully",
        "patient_id": patient_id,
        "patient": {
            "name": name,
            "age": age,
            "preferred_language": preferred_language
        }
    }), 201

@app.route("/api/game/start", methods=["POST"])
def start_game():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    patient_id = data.get("patient_id")
    game_type = data.get("game_type", "memory_card")
    difficulty = data.get("difficulty", "easy")

    if not patient_id:
        return jsonify({
            "error": "patient_id is required"
        }), 400

    connection = get_db()

    patient = connection.execute(
        "SELECT * FROM patients WHERE id = ?",
        (patient_id,)
    ).fetchone()

    if not patient:
        connection.close()

        return jsonify({
            "error": "Patient not found"
        }), 404

    cursor = connection.execute(
        """
        INSERT INTO game_sessions
        (patient_id, game_type, difficulty)
        VALUES (?, ?, ?)
        """,
        (patient_id, game_type, difficulty)
    )

    connection.commit()

    session_id = cursor.lastrowid

    connection.close()

    return jsonify({
        "message": "Game started successfully",
        "session_id": session_id,
        "game": {
            "patient_id": patient_id,
            "game_type": game_type,
            "difficulty": difficulty
        }
    }), 201

@app.route("/api/game/complete", methods=["POST"])
def complete_game():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    session_id = data.get("session_id")

    if not session_id:
        return jsonify({
            "error": "session_id is required"
        }), 400

    moves = data.get("moves", 0)
    time_taken = data.get("time_taken", 0)
    mistakes = data.get("mistakes", 0)
    completed = data.get("completed", 1)

    performance = calculate_performance(
       moves,
       mistakes,
       time_taken
    )

    accuracy = performance["accuracy"]
    score = performance["score"]

    connection = get_db()

    session = connection.execute(
        "SELECT * FROM game_sessions WHERE id = ?",
        (session_id,)
    ).fetchone()

    if not session:
        connection.close()

        return jsonify({
            "error": "Game session not found"
        }), 404

    connection.execute(
        """
        UPDATE game_sessions
        SET
            completed_at = CURRENT_TIMESTAMP,
            moves = ?,
            time_taken = ?,
            mistakes = ?,
            score = ?,
            accuracy = ?,
            completed = ?
        WHERE id = ?
        """,
        (
            moves,
            time_taken,
            mistakes,
            score,
            accuracy,
            completed,
            session_id
        )
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Game completed successfully",
        "session_id": session_id,
        "results": {
            "moves": moves,
            "time_taken": time_taken,
            "mistakes": mistakes,
            "score": score,
            "accuracy": accuracy,
            "completed": completed
        }
    }), 200

@app.route("/api/game/history/<int:patient_id>", methods=["GET"])
def get_game_history(patient_id):
    connection = get_db()

    patient = connection.execute(
        "SELECT * FROM patients WHERE id = ?",
        (patient_id,)
    ).fetchone()

    if not patient:
        connection.close()

        return jsonify({
            "error": "Patient not found"
        }), 404

    sessions = connection.execute(
        """
        SELECT
            id,
            game_type,
            difficulty,
            started_at,
            completed_at,
            moves,
            time_taken,
            mistakes,
            score,
            accuracy,
            completed
        FROM game_sessions
        WHERE patient_id = ?
        AND completed = 1
        ORDER BY id DESC
        """,
        (patient_id,)
    ).fetchall()

    connection.close()

    history = []

    for session in sessions:
        history.append(dict(session))

    return jsonify({
        "patient_id": patient_id,
        "games": history
    }), 200


@app.route("/api/game/progress/<int:patient_id>", methods=["GET"])
def get_game_progress(patient_id):
    connection = get_db()

    patient = connection.execute(
        "SELECT * FROM patients WHERE id = ?",
        (patient_id,)
    ).fetchone()

    if not patient:
        connection.close()

        return jsonify({
            "error": "Patient not found"
        }), 404

    stats = connection.execute(
        """
        SELECT
            COUNT(*) AS total_games,
            AVG(accuracy) AS average_accuracy,
            AVG(time_taken) AS average_time,
            AVG(mistakes) AS average_mistakes,
            MAX(score) AS best_score
        FROM game_sessions
        WHERE patient_id = ?
        AND completed = 1
        """,
        (patient_id,)
    ).fetchone()

    latest = connection.execute(
        """
        SELECT
            accuracy,
            score,
            time_taken,
            mistakes
        FROM game_sessions
        WHERE patient_id = ?
        AND completed = 1
        ORDER BY id DESC
        LIMIT 1
        """,
        (patient_id,)
    ).fetchone()

    connection.close()

    return jsonify({
        "patient_id": patient_id,
        "progress": {
            "total_games": stats["total_games"],
            "average_accuracy": round(stats["average_accuracy"] or 0, 2),
            "average_time": round(stats["average_time"] or 0, 2),
            "average_mistakes": round(stats["average_mistakes"] or 0, 2),
            "best_score": round(stats["best_score"] or 0, 2),
            "latest_accuracy": round(latest["accuracy"] if latest else 0, 2),
            "latest_score": round(latest["score"] if latest else 0, 2),
            "latest_time": round(latest["time_taken"] if latest else 0, 2),
            "latest_mistakes": latest["mistakes"] if latest else 0
        }
    }), 200

@app.route("/api/game/progress/history/<int:patient_id>", methods=["GET"])
def get_progress_history(patient_id):
    connection = get_db()

    patient = connection.execute(
        "SELECT * FROM patients WHERE id = ?",
        (patient_id,)
    ).fetchone()

    if not patient:
        connection.close()

        return jsonify({
            "error": "Patient not found"
        }), 404

    sessions = connection.execute(
        """
        SELECT
            id,
            accuracy,
            score,
            time_taken,
            mistakes,
            difficulty,
            completed_at
        FROM game_sessions
        WHERE patient_id = ?
        AND completed = 1
        ORDER BY id ASC
        """,
        (patient_id,)
    ).fetchall()

    connection.close()

    progress = []

    for index, session in enumerate(sessions, start=1):
        progress.append({
            "game_number": index,
            "session_id": session["id"],
            "accuracy": session["accuracy"],
            "score": session["score"],
            "time_taken": session["time_taken"],
            "mistakes": session["mistakes"],
            "difficulty": session["difficulty"],
            "completed_at": session["completed_at"]
        })

    return jsonify({
        "patient_id": patient_id,
        "progress": progress
    }), 200


if __name__ == "__main__":
    app.run(debug=True)