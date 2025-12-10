-- ============================================
-- STUDENT FAVORITES TABLE MIGRATION
-- ============================================

-- Create student_favorites table
CREATE TABLE IF NOT EXISTS student_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, opportunity_id)
);

-- Create indexes for performance
CREATE INDEX idx_student_favorites_student_id ON student_favorites(student_id);
CREATE INDEX idx_student_favorites_opportunity_id ON student_favorites(opportunity_id);
CREATE INDEX idx_student_favorites_created_at ON student_favorites(created_at);

-- Enable Row Level Security
ALTER TABLE student_favorites ENABLE ROW LEVEL SECURITY;

-- Students can view their own favorites
CREATE POLICY "Students can view own favorites"
  ON student_favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_favorites.student_id
      AND students.id = auth.uid()
    )
  );

-- Students can insert their own favorites
CREATE POLICY "Students can insert own favorites"
  ON student_favorites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_favorites.student_id
      AND students.id = auth.uid()
    )
  );

-- Students can delete their own favorites
CREATE POLICY "Students can delete own favorites"
  ON student_favorites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_favorites.student_id
      AND students.id = auth.uid()
    )
  );

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites"
  ON student_favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
