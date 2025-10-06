-- Migration script for existing users to family system
-- Create families for allowed email addresses

-- Step 1: Create family for the primary user
INSERT INTO families (name, owner_email)
VALUES ('zhch''s family', 'zhch1990@gmail.com');

-- Step 2: Add primary user as member of their family
INSERT INTO family_memberships (family_id, user_email)
SELECT id, 'zhch1990@gmail.com'
FROM families 
WHERE owner_email = 'zhch1990@gmail.com';

-- Step 3: Add Victoria as member of the same family
INSERT INTO family_memberships (family_id, user_email)
SELECT id, 'victoria.zhaoup@gmail.com'
FROM families 
WHERE owner_email = 'zhch1990@gmail.com';

-- Step 4: Update existing recipes to belong to the family
UPDATE recipes 
SET family_id = (SELECT id FROM families WHERE owner_email = 'zhch1990@gmail.com')
WHERE family_id IS NULL;

-- Step 5: Update existing ingredients to belong to the family
UPDATE ingredients 
SET family_id = (SELECT id FROM families WHERE owner_email = 'zhch1990@gmail.com')
WHERE family_id IS NULL;

-- Verification
SELECT 'Family created' as type, name, owner_email FROM families;
SELECT 'Family members' as type, user_email FROM family_memberships fm JOIN families f ON fm.family_id = f.id;
SELECT 'Recipes updated' as type, COUNT(*) as count FROM recipes WHERE family_id IS NOT NULL;
SELECT 'Ingredients updated' as type, COUNT(*) as count FROM ingredients WHERE family_id IS NOT NULL;
