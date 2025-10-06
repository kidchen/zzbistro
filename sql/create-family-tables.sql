-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255), -- Optional, defaults to "[owner_name]'s family"
  owner_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create family memberships table  
CREATE TABLE family_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email) -- One family per user constraint
);

-- Add family_id to existing tables
ALTER TABLE recipes ADD COLUMN family_id UUID REFERENCES families(id);
ALTER TABLE ingredients ADD COLUMN family_id UUID REFERENCES families(id);

-- Create indexes for performance
CREATE INDEX idx_family_memberships_user_email ON family_memberships(user_email);
CREATE INDEX idx_family_memberships_family_id ON family_memberships(family_id);
CREATE INDEX idx_recipes_family_id ON recipes(family_id);
CREATE INDEX idx_ingredients_family_id ON ingredients(family_id);

-- Enable RLS on new tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for families table
CREATE POLICY "Users can view their own family" ON families
  FOR SELECT USING (
    owner_email = auth.jwt() ->> 'email' OR
    id IN (
      SELECT family_id FROM family_memberships 
      WHERE user_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update their own family" ON families
  FOR UPDATE USING (owner_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (owner_email = auth.jwt() ->> 'email');

-- Create RLS policies for family_memberships table
CREATE POLICY "Users can view their family memberships" ON family_memberships
  FOR SELECT USING (
    user_email = auth.jwt() ->> 'email' OR
    family_id IN (
      SELECT id FROM families WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Family owners can manage memberships" ON family_memberships
  FOR ALL USING (
    family_id IN (
      SELECT id FROM families WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can leave families" ON family_memberships
  FOR DELETE USING (user_email = auth.jwt() ->> 'email');
