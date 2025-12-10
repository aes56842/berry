# Student Favorites Implementation Guide

## Overview
This guide explains how the student favorites functionality works in the Berry application. Students can favorite opportunities from both the **Student Feed** and **Student Explore** pages, and these favorites are synced with Supabase.

## Database Setup

### Table Structure
The `student_favorites` table stores the relationship between students and their favorite opportunities:

```sql
CREATE TABLE student_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  opportunity_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, opportunity_id)
);
```

**Key Features:**
- Each row represents one favorite relationship
- `UNIQUE(student_id, opportunity_id)` prevents duplicate favorites
- Automatically deleted if the student is deleted (CASCADE)
- Timestamps track when favorites were added

### Row Level Security (RLS)
The table has RLS enabled with the following policies:
- **Students** can view, insert, and delete their own favorites
- **Admins** can view all favorites
- Each student can only manage their own favorites

## Implementation Files

### 1. **Hook: `src/lib/useFavorites.ts`**

The `useFavorites` hook manages all favorites logic:

```typescript
const {
  favorites,      // Set<string> of favorite opportunity IDs
  toggleFavorite, // (id: string) => Promise<void>
  isFavorite,     // (id: string) => boolean
  clear,          // () => Promise<void>
  loading         // boolean - true while syncing with Supabase
} = useFavorites()
```

**How It Works:**
1. On mount, checks if user is authenticated
2. If authenticated, loads favorites from Supabase
3. If not authenticated, falls back to localStorage
4. When `toggleFavorite` is called:
   - Optimistically updates the UI
   - Syncs to Supabase in the background
   - Reverts on error

**Offline Support:**
- Unauthenticated users can still favorite opportunities using localStorage
- When they log in, their Supabase favorites take precedence

### 2. **API Route: `src/app/api/favorites/route.ts`**

Provides HTTP endpoints for favorite management:

**GET** - Fetch all favorites for a user
```
GET /api/favorites?userId=<student_id>
```
Returns: `{ success: true, data: Array<{opportunity_id, created_at}> }`

**POST** - Add a favorite
```
POST /api/favorites
{ studentId: "uuid", opportunityId: "string" }
```
Returns: `{ success: true, message: "Added to favorites" }`

**DELETE** - Remove a favorite
```
DELETE /api/favorites?studentId=<uuid>&opportunityId=<string>
```
Returns: `{ success: true, message: "Removed from favorites" }`

### 3. **Student Feed: `src/app/(protected)/dashboard/student/student-feed/page.tsx`**

Features:
- ⭐ Displays favorite count
- Toggle favorites by clicking the star icon
- Filter options:
  - **Favorites First**: Moves favorited opportunities to the top
  - **Only Favorites**: Shows only favorited opportunities

**Usage:**
```tsx
const { favorites, toggleFavorite, isFavorite, loading: favLoading } = useFavorites()

// In the star button
<button onClick={(e) => {
  e.stopPropagation()
  toggleFavorite(o.id)
}}>
  <FaStar className={isFavorite(o.id) ? "fill-current text-yellow-400" : "text-white/50"} />
</button>
```

### 4. **Student Explore: `src/app/(protected)/dashboard/student/student-explore/page.tsx`**

Similar features to Student Feed with additional category filtering:
- ⭐ Displays favorite count
- Same toggle and filter options
- Side-by-side layout with category selection

## Workflow

### Adding a Favorite
1. User clicks the star icon on an opportunity card
2. `toggleFavorite(opportunityId)` is called
3. Local state updates immediately (optimistic update)
4. POST request sent to `/api/favorites`
5. If error occurs, local state is reverted

### Removing a Favorite
1. User clicks the filled star icon
2. `toggleFavorite(opportunityId)` is called
3. Local state updates immediately
4. DELETE request sent to `/api/favorites`
5. If error occurs, local state is reverted

### Page Load
1. User navigates to Student Feed or Explore
2. `useFavorites` hook initializes
3. Supabase query fetches all user's favorites
4. Component renders with `isFavorite()` checks
5. Star icons show filled (yellow) if favorited

## Filtering Examples

### Show Favorites First
```tsx
// Moves favorited items to the top, keeps non-favorited below
const sorted = [...items].sort((a, b) => 
  (isFavorite(b.id) ? 1 : 0) - (isFavorite(a.id) ? 1 : 0)
)
```

### Show Only Favorites
```tsx
const favorited = items.filter(it => isFavorite(it.id))
```

## Error Handling

The hook includes robust error handling:
- Network errors don't break the UI
- Optimistic updates are reverted on failure
- Errors are logged to console
- Graceful fallback to localStorage if Supabase fails

## Performance Considerations

1. **Batch Operations**: Favorites are loaded once on component mount
2. **Set-based Lookup**: `isFavorite()` uses Set for O(1) lookups
3. **Optimistic Updates**: UI updates before server sync
4. **Caching**: Favorites remain in memory until page refresh

## Testing

### Manual Testing Checklist
- [ ] Click star to add favorite
- [ ] Star fills with yellow color
- [ ] Favorite count increments
- [ ] Click filled star to remove favorite
- [ ] Favorite count decrements
- [ ] "Favorites First" checkbox works
- [ ] "Only Favorites" checkbox works
- [ ] Refresh page - favorites persist
- [ ] Log out and back in - favorites still there
- [ ] Check Supabase table for correct entries

### API Testing
```bash
# Get favorites
curl "http://localhost:3000/api/favorites?userId=<student_id>"

# Add favorite
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"studentId":"<uuid>","opportunityId":"<string>"}'

# Remove favorite
curl -X DELETE "http://localhost:3000/api/favorites?studentId=<uuid>&opportunityId=<string>"
```

## Migration to Supabase

If you haven't run the migration yet:

1. **Open Supabase SQL Editor**
2. **Copy and paste** the contents of `student_favorites_migration.sql`
3. **Run the migration**
4. **Test** with the checklist above

## Troubleshooting

### Favorites Not Persisting
- Check browser console for errors
- Verify student is logged in (check `auth.uid()`)
- Check Supabase table has rows with your `student_id`

### Stars Not Showing as Filled
- Verify `opportunity_id` matches exactly (case-sensitive if UUID)
- Check if `isFavorite()` is being called with correct ID
- Clear browser cache and reload

### Sync Issues
- Check network tab for failed `/api/favorites` requests
- Verify Supabase environment variables are set
- Check browser console for error messages

## Future Enhancements

1. **Bulk Operations**: Add "Save All" button for filtered results
2. **Folders/Collections**: Let students organize favorites into categories
3. **Sharing**: Share favorite lists with friends or counselors
4. **Notifications**: Alert when new opportunities match favorited categories
5. **Export**: Download list of favorites as PDF/CSV
