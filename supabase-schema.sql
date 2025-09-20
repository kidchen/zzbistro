-- ZZBistro Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create recipes table
CREATE TABLE recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    instructions TEXT[] NOT NULL DEFAULT '{}',
    image TEXT,
    cooking_time INTEGER NOT NULL DEFAULT 30,
    servings INTEGER NOT NULL DEFAULT 4,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ingredients table
CREATE TABLE ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    expiry_date DATE,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_in_stock ON ingredients(in_stock);
CREATE INDEX idx_ingredients_expiry_date ON ingredients(expiry_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON recipes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at 
    BEFORE UPDATE ON ingredients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since it's a family app)
-- You can make this more restrictive later if needed
CREATE POLICY "Enable read access for all users" ON recipes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON recipes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON recipes FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ingredients FOR DELETE USING (true);