-- Migration script to move images from user-based to family-based storage paths
-- This script updates image_path in recipes table from 'user_email/recipe_id.jpg' to 'family_id/recipe_id.jpg'

-- Step 1: Update image paths in recipes table
UPDATE recipes 
SET image_path = CONCAT(family_id, '/', SUBSTRING(image_path FROM POSITION('/' IN image_path) + 1))
WHERE image_path IS NOT NULL 
  AND image_path LIKE '%/%'
  AND family_id IS NOT NULL;

-- Step 2: Verify the migration
SELECT 
  id,
  name,
  family_id,
  image_path,
  'Updated' as status
FROM recipes 
WHERE image_path IS NOT NULL 
  AND image_path LIKE '%/%'
  AND family_id IS NOT NULL
ORDER BY family_id, name;

-- Step 3: Check for any recipes that still need migration
SELECT 
  id,
  name,
  family_id,
  image_path,
  'Needs Migration' as status
FROM recipes 
WHERE image_path IS NOT NULL 
  AND image_path NOT LIKE CONCAT(family_id, '/%')
  AND family_id IS NOT NULL;
