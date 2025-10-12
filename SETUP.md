# Quick Setup Guide

## Environment Variables

Create a `.env.local` file with the following variables:

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Setup

1. Create a PostgreSQL database on NeonDB or any PostgreSQL provider
2. Run the schema:
   ```bash
   psql "your-database-url" -f database/schema.sql
   ```

## Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy credentials to `.env.local`

## First Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000
4. Sign in with your @yournextcampus.com email
5. Update your role to admin in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@yournextcampus.com';
   ```

## Testing the System

### Test Public Lead API
```bash
curl -X POST http://localhost:3000/api/leads/submit \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "acquisition": {
      "platform": "Google Ads",
      "campaign": "Fall 2026 Admissions",
      "landingPageUrl": "https://example.com"
    }
  }'
```

### Key URLs
- Dashboard: http://localhost:3000/dashboard
- Leads List: http://localhost:3000/leads
- Login: http://localhost:3000/login

## Common Issues

### "Database connection failed"
- Check DATABASE_URL is correct
- Ensure database accepts connections from your IP
- Verify SSL mode if required

### "Sign in failed"
- Verify Google OAuth credentials
- Check redirect URI matches exactly
- Ensure email ends with @yournextcampus.com

### "Access denied"
- Verify user exists in database
- Check user's `is_active` is true
- Confirm role is set correctly

## Production Deployment

### Vercel
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Update NEXTAUTH_URL to production URL
5. Update Google OAuth redirect URI

### Environment Variables for Production
```env
DATABASE_URL=<production-db-url>
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>
```

## Next Steps

1. Create admin users by updating their role in the database
2. Create agent users through first-time Google sign-in
3. Test lead submission from your landing pages
4. Configure filters and test bulk operations
5. Export sample data to verify CSV export functionality
6. Customize the forms in `/components/leads/profile-forms/` as needed

## Extending the System

### Adding More Profile Forms
1. Create form component in `/src/components/leads/profile-forms/`
2. Use `EnrichedDetailsForm` as a template
3. Add to `LeadDetailActions` component

### Adding New Lead Stages
Update the STAGES array in:
- `/src/types/index.ts` (LeadStage type)
- `/src/components/leads/lead-filters.tsx`
- `/src/components/leads/bulk-actions.tsx`
- `/src/app/api/leads/bulk-status/route.ts`

### Rule-Based Assignment (Future)
The architecture supports adding rule-based assignment:
1. Create `/src/lib/assignment/rules.ts`
2. Implement assignment logic (Round Robin, field-based, etc.)
3. Add API endpoint `/api/leads/auto-assign`
4. Integrate with lead creation flow

