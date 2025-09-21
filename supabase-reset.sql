-- ZZBistro Database Reset Script
-- Run this in your Supabase SQL Editor to clean up and recreate all tables

-- Drop all existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;

-- Drop the update function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop the UUID extension and recreate it (to ensure it's available)
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Now run the full schema creation
-- (Copy and paste the entire content of supabase-schema.sql after running this reset)