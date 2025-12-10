# Category Filter Mapping

This document explains how category filters are converted between the UI display format and the database format.

## Display Names → Database Values

The UI shows friendly category names, but they're converted to database format when filtering:

| UI Display Name | Database Value |
|---|---|
| STEM & Innovation | stem_innovation |
| Arts & Design | arts_design |
| Civic Engagement & Leadership | civic_engagement_leadership |
| Trades & Technical Careers | trades_technical |
| Business & Entrepreneurship | business_entrepreneurship |
| Health, Wellness & Environment | health_sports_sustainability |
| Humanities & Social Sciences | humanities_social_sciences |

## How It Works

### Student Explore Page
1. User clicks category button (e.g., "STEM & Innovation")
2. `convertCategoryToDb()` converts it to `stem_innovation`
3. Sent to `/api/opportunities/student-explore?category=stem_innovation`
4. API validates it's in the `VALID_CATEGORIES` list
5. Query filters opportunities where `category = 'stem_innovation'`

### Conversion Logic
```javascript
const convertCategoryToDb = (displayName: string): string => {
  return displayName
    .toLowerCase()
    .replace(/\s+&\s+/g, "_")  // "& " → "_"
    .replace(/\s+/g, "_")       // spaces → "_"
    .trim();
};
```

Example: `"STEM & Innovation"` → `"stem_innovation"`

### API Validation
The API also includes a fallback validation:
- Checks if the category is in `VALID_CATEGORIES`
- If not, tries to normalize it using the same conversion logic
- Only applies the filter if the final result is valid

This ensures:
✅ Typos are caught early
✅ Invalid categories are ignored (no results, no errors)
✅ Both frontend and backend validate independently

## Adding New Categories

To add a new category:

1. **Add to database** - Update opportunities table constraints
2. **Add to `VALID_CATEGORIES`** in `/src/app/api/opportunities/student-explore/route.ts`
3. **Add UI button** in student-explore page's `BERRY_CATEGORIES` array
4. **The conversion automatically works!** No additional code needed

Example: If adding "Sports & Athletics":
- Database: `sports_athletics`
- UI: `"Sports & Athletics"`
- Conversion: Automatic via `convertCategoryToDb()`
