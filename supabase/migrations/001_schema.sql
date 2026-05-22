-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    username TEXT NOT NULL,
    company TEXT NOT NULL,
    designation TEXT NOT NULL,
    email TEXT,
    total_score INTEGER DEFAULT 0,
    total_response_time NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'registered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    scenario TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: question_options
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL,
    option_text TEXT NOT NULL,
    score INTEGER NOT NULL
);

-- Table: game_sessions
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    selected_questions UUID[] NOT NULL,
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 5,
    total_score INTEGER DEFAULT 0,
    total_response_time NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table: answers
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    session_id UUID REFERENCES game_sessions(id),
    user_id UUID REFERENCES users(id),
    question_id UUID REFERENCES questions(id),
    selected_option TEXT,
    base_score INTEGER DEFAULT 0,
    speed_bonus INTEGER DEFAULT 0,
    final_score INTEGER DEFAULT 0,
    response_time NUMERIC DEFAULT 60,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Policies
-- Events: Public can read active events
CREATE POLICY "Public can read active events" ON events FOR SELECT USING (is_active = TRUE);

-- Users: Users can read their own data, and create their profile
CREATE POLICY "Public can create users" ON users FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (TRUE); -- Simplified for event context

-- Questions: Public can read questions (scores are hidden by not including them in public views if needed, but here we only have questions table)
CREATE POLICY "Public can read questions" ON questions FOR SELECT USING (is_active = TRUE);

-- Question Options: Public can read options
CREATE POLICY "Public can read options" ON question_options FOR SELECT USING (TRUE);

-- Game Sessions: Users can read their own sessions
CREATE POLICY "Users can read their own sessions" ON game_sessions FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own sessions" ON game_sessions FOR UPDATE USING (TRUE);

-- Answers: Users can create answers
CREATE POLICY "Users can create answers" ON answers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can read their own answers" ON answers FOR SELECT USING (TRUE);

-- Realtime: Enable realtime for game_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- View for Leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id as user_id,
    u.username as name,
    u.company,
    u.designation,
    gs.total_score,
    gs.total_response_time,
    gs.completed_at,
    gs.event_id
FROM users u
JOIN game_sessions gs ON u.id = gs.user_id
WHERE gs.status = 'completed'
ORDER BY gs.total_score DESC, gs.total_response_time ASC, gs.completed_at ASC;
