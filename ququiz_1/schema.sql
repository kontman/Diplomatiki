
-- Table: quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT,
    questions JSONB,
    started BOOLEAN DEFAULT FALSE,
    status TEXT,
    short_id TEXT,
    host_id UUID,
    current_question_id TEXT
);

-- Table: players
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    player_code TEXT,
    score INT,
    finished BOOLEAN DEFAULT FALSE
);

-- Table: player_answers
CREATE TABLE IF NOT EXISTS player_answers (
    id UUID PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    player_code TEXT,
    question_id TEXT,
    selected_index INT,
    created_at TIMESTAMP DEFAULT now()
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    quiz_code TEXT,
    player_code TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous insert
CREATE POLICY "Allow anonymous insert"
ON reviews
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Allow read for authenticated users
CREATE POLICY "Allow read for authenticated users"
ON reviews
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on quizzes table
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow select on quizzes
CREATE POLICY "Allow select on quizzes"
ON quizzes
FOR SELECT
TO public
USING (true);

-- Policy: Allow insert on quizzes
CREATE POLICY "Allow insert on quizzes"
ON quizzes
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Allow anon update status
CREATE POLICY "Allow anon update status"
ON quizzes
FOR UPDATE
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

-- Policy: allow_delete_own_quiz
CREATE POLICY "allow_delete_own_quiz"
ON quizzes
FOR DELETE
TO authenticated
USING (host_id = auth.uid());

-- Policy: update status from player
CREATE POLICY "update status from player"
ON quizzes
FOR UPDATE
TO anon
USING (
  (current_setting('request.jwt.claim.role'::text, true) = 'anon'::text)
)
WITH CHECK (
  (current_setting('request.jwt.claim.role'::text, true) = 'anon'::text)
  AND (status = 'playing'::text)
);

-- Enable RLS on players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy: Allow select on players
CREATE POLICY "Allow select on players"
ON players
FOR SELECT
TO public
USING (true);

-- Policy: Allow insert on players
CREATE POLICY "Allow insert on players"
ON players
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Player can update themselves
CREATE POLICY "Player can update themselves"
ON players
FOR UPDATE
TO public
USING (true);

-- Policy: Allow delete to everyone
CREATE POLICY "Allow delete to everyone"
ON players
FOR DELETE
TO public
USING (true);

-- Enable RLS on player_answers table
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow SELECT on player_answers
CREATE POLICY "Allow SELECT on player_answers"
ON player_answers
FOR SELECT
TO public
USING (true);

-- Policy: Allow insert to anyone
CREATE POLICY "Allow insert to anyone"
ON player_answers
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: allow anyone to delete
CREATE POLICY "allow anyone to delete"
ON player_answers
FOR DELETE
TO public
USING (true);
