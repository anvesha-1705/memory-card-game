CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    preferred_language TEXT DEFAULT 'English'
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'easy',

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    moves INTEGER DEFAULT 0,
    time_taken REAL DEFAULT 0,
    mistakes INTEGER DEFAULT 0,
    score REAL DEFAULT 0,
    accuracy REAL DEFAULT 0,

    completed INTEGER DEFAULT 0,

    FOREIGN KEY (patient_id) REFERENCES patients(id)
);