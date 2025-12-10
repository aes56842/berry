# Quick Start: Setting Up Student Favorites

## Step 1: Run the Database Migration

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `student_favorites_migration.sql` from this project
5. Click **Run**

You should see the message: `Query executed successfully`

## Step 2: Verify Table Creation

1. In Supabase, go to **Table Editor**
2. Look for `student_favorites` in the table list
3. Click it to verify the columns:
   - `id` (UUID)
   - `student_id` (UUID, Foreign Key to students)
   - `opportunity_id` (TEXT)
   - `created_at` (Timestamp)

## Step 3: Test the Features

### Local Testing
1. Start your development server: `npm run dev`
2. Navigate to `/dashboard/student/student-feed` or `/dashboard/student/student-explore`
3. Click the star icon on any opportunity card to add/remove favorites

### What You Should See
- ⭐ Count of favorites updates
- Star fills with yellow when favorited
- Favorites persist after page refresh
- "Favorites First" and "Only Favorites" filters work

## Step 4: Verify Data in Supabase

1. In Supabase Table Editor, click **student_favorites**
2. Add a favorite as a logged-in student
3. You should see a new row with:
   - Your `student_id`
   - The `opportunity_id` you favorited
   - Current timestamp

## That's It! 🎉

Your favorites system is now fully functional and synced with Supabase.

### Key Files to Reference
- **Hook**: `src/lib/useFavorites.ts` - All the logic
- **API**: `src/app/api/favorites/route.ts` - Backend endpoints
- **Student Feed**: `src/app/(protected)/dashboard/student/student-feed/page.tsx`
- **Student Explore**: `src/app/(protected)/dashboard/student/student-explore/page.tsx`
- **Full Guide**: `FAVORITES_IMPLEMENTATION.md`

### Need Help?
Check the **Troubleshooting** section in `FAVORITES_IMPLEMENTATION.md`
