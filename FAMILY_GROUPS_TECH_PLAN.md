# Family Groups Feature - Technical Implementation Plan

## Overview
Implement family groups to enable shared content (recipes, ingredients, images) within families while maintaining privacy between different families.

## Database Schema Changes

### 1. Create Family Tables
```sql
-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255), -- Optional, defaults to "[owner_name]'s family"
  owner_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Family memberships table  
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
```

### 2. Update Row Level Security (RLS)
- Update RLS policies to filter by `family_id` instead of user email
- Ensure users can only access data from their family

## Implementation Phases

### Phase 1: Database Foundation ✅ COMPLETED
- [x] Create family tables SQL script
- [x] Update existing table schemas
- [x] Create RLS policies for family-based access
- [x] Update TypeScript types for Family and FamilyMembership
- [x] Update Supabase client types

### Phase 2: Family Management Backend ✅ COMPLETED
- [x] Create family management functions in `lib/storage.ts`:
  - [x] `families.create(ownerEmail, name?)`
  - [x] `families.getByUserEmail(userEmail)`
  - [x] `families.updateName(familyId, name)`
  - [x] `families.addMember(familyId, userEmail)`
  - [x] `families.removeMember(familyId, userEmail)`
  - [x] `families.getMembers(familyId)`
  - [x] `families.leave(userEmail)`
- [x] Update existing storage functions to use `family_id`

### Phase 3: Family Onboarding Flow ✅ COMPLETED
- [x] Create family setup page (`/family/setup`)
- [x] Add family status check to main layout
- [x] Implement "Create New Family" flow
- [x] Add information banner about joining existing families
- [x] Auto-redirect new users to family setup

### Phase 4: Family Management UI ✅ COMPLETED
- [x] Create family page (`/family`)
- [x] Family overview with name and member list
- [x] Edit family name (owner only)
- [x] Add member by email (owner only)
- [x] Remove member functionality (owner only)
- [x] Leave family button (non-owners)
- [x] Family settings and permissions

### Phase 5: Data Migration ✅ COMPLETED
- [x] Create migration script for existing users:
  - [x] Auto-create family for existing users
  - [x] Set them as family owner
  - [x] Migrate their recipes/ingredients to family
- [x] Update all data queries to include `family_id` filter
- [x] Test data isolation between families

### Phase 6: Image Storage Migration ✅ COMPLETED
- [x] Update image upload API to use `family_id` instead of user email
- [x] Update image upload helper function to accept familyId parameter
- [x] Update recipe creation form to use family context
- [x] Update recipe editing form to use family context
- [x] Create image migration script: `user_email/file` → `family_id/file`
- [x] Update image access logic (CachedImage component already uses paths correctly)
- [x] Update image URL generation API (already works with any path format)
- [x] Test image sharing within family

### Phase 7: UI Updates ✅ COMPLETED
- [x] Add family context to navigation (FamilyProvider integrated)
- [x] Update user menu to show family info (Family Settings link added)
- [x] Add family link to main navigation (accessible via user dropdown)
- [x] Update loading states to handle family data (FamilyProvider handles loading)
- [x] Error handling for family-related operations (auto-redirect to setup)
- [x] Remove emoji from user dropdown menu

### Phase 8: Testing & Polish ✅ TODO
- [ ] Test multi-family isolation
- [ ] Test family member permissions
- [ ] Test image sharing within family
- [ ] Performance testing with family queries
- [ ] Update README with family features

## Technical Considerations

### Security
- RLS policies ensure family data isolation
- Owner permissions enforced at database level
- Email-based membership prevents unauthorized access

### Performance
- Index on `family_id` for all tables
- Efficient queries with family context
- Cache family membership data

### Migration Strategy
- Backward compatible during transition
- Graceful handling of users without families
- Data integrity checks during migration

### Future Enhancements (Post-MVP)
- Email invitation system
- Family invitation codes
- Multiple family support
- Family activity logs
- Family-specific settings

## Default Values
- **Family Name**: `"[email_prefix]'s family"` (e.g., "john's family")
- **Owner**: User who creates the family
- **Initial Members**: Just the owner

## User Flows

### New User Flow
1. Sign in with Google OAuth
2. Redirect to `/family/setup`
3. Show options: "Create Family" or "Contact household to join"
4. If create: auto-create family with default name
5. Redirect to main app

### Existing User Migration
1. Auto-create family on first login after deployment
2. Migrate existing data to new family
3. Set user as family owner
4. Continue normal app usage

### Family Management Flow
1. Navigate to `/family` page
2. View family name and members
3. Owner can: edit name, add/remove members
4. Members can: view info, leave family

This plan provides a clear roadmap for implementing the family groups feature while maintaining data integrity and user experience.

## Progress Tracking

### Completed Tasks
- [x] Created technical implementation plan
- [x] Defined database schema
- [x] Outlined user flows and requirements
- [x] Created family tables in Supabase database
- [x] Added family_id columns to existing tables (recipes, ingredients)
- [x] Set up Row Level Security (RLS) policies for family data isolation
- [x] Updated TypeScript interfaces (Family, FamilyMembership)
- [x] Updated Supabase client types with new table schemas
- [x] Created performance indexes for family queries

### Current Status
✅ **Phase 1 COMPLETED**: Database Foundation
✅ **Phase 2 COMPLETED**: Family Management Backend  
✅ **Phase 3 COMPLETED**: Family Onboarding Flow
✅ **Phase 4 COMPLETED**: Family Management UI
✅ **Phase 5 COMPLETED**: Data Migration
✅ **Phase 6 COMPLETED**: Image Storage Migration
🚀 **Ready for Phase 8**: Testing & Polish

### Next Steps
1. Update image upload API to use family_id instead of user email
2. Create image migration script
3. Update image access logic
