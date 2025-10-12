# Lead Management System - Your Next Campus

A comprehensive lead management system built with Next.js 15, TypeScript, PostgreSQL, and NextAuth.js for managing educational leads from various marketing platforms.

## Features

- **Authentication**: Google OAuth with domain restriction (@yournextcampus.com)
- **Role-Based Access Control**: Admin and Agent roles with different permissions
- **Dashboard**: Overview metrics, leads by stage, platform analytics, and agent performance
- **Lead Management**: Create, view, edit, and track leads through various stages
- **Advanced Filtering**: Filter leads by stage, platform, date range, assigned agent, and search
- **Bulk Operations**: Assign multiple leads, update statuses, and export to CSV
- **Lead Profiles**: Acquisition, enriched details, demographic, academic, work, and test scores
- **Server-Side Pagination**: Efficient handling of large datasets
- **Responsive Design**: Modern UI with ShadCN components

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI Library**: ShadCN UI, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with postgres.js (no ORM)
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Form Validation**: Zod + React Hook Form
- **Date Formatting**: date-fns
- **CSV Export**: json2csv

## Database Schema

The system uses 9 PostgreSQL tables:
- `users` - User accounts with role-based access
- `leads` - Core lead information
- `lead_acquisition` - Marketing acquisition data
- `lead_enriched_details` - Educational preferences
- `lead_process` - Lead stage and notes
- `demographic_profile` - Demographic information
- `academic_profile` - Academic background
- `work_profile` - Work experience
- `standardized_test_scores` - Test scores

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (NeonDB recommended)
- Google OAuth credentials
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ync-lead-mgmt-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   
   Create a PostgreSQL database (e.g., on NeonDB) and run the schema:
   ```bash
   psql <your-database-url> < database/schema.sql
   ```

4. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database Configuration (NeonDB)
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   ```

5. **Generate NextAuth Secret**
   ```bash
   openssl rand -base64 32
   ```

6. **Set up Google OAuth**
   
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env.local`

7. **Create an admin user**
   
   After first login, update the user's role in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@yournextcampus.com';
   ```

8. **Run the development server**
   ```bash
   npm run dev
   ```

9. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/src
  /app
    /api                      # API routes
      /auth/[...nextauth]     # NextAuth endpoint
      /leads                  # Lead APIs
      /dashboard              # Dashboard API
      /users                  # User APIs
    /dashboard               # Dashboard page
    /leads                   # Leads pages
      /[id]                  # Lead detail page
    /login                   # Login page
    layout.tsx               # Root layout
    page.tsx                 # Home (redirects to dashboard)
  /components
    /layout                  # Layout components
    /leads                   # Lead-specific components
    /providers               # Context providers
    /ui                      # ShadCN UI components
  /lib
    /auth                    # Auth configuration and middleware
    /db                      # Database connection and queries
    utils.ts                 # Utility functions
  /types
    index.ts                 # TypeScript types
    next-auth.d.ts           # NextAuth type extensions
/database
  schema.sql                 # Database schema
```

## API Endpoints

### Public Endpoints
- `POST /api/leads/submit` - Submit a new lead (no auth required)

### Protected Endpoints
- `GET /api/leads` - Get paginated leads with filters
- `GET /api/leads/[id]` - Get single lead details
- `PATCH /api/leads/[id]` - Update lead
- `POST /api/leads/bulk-assign` - Bulk assign leads (admin only)
- `POST /api/leads/bulk-status` - Bulk update lead statuses
- `POST /api/leads/export` - Export leads to CSV
- `POST /api/leads/[id]/enriched-details` - Upsert enriched details
- `POST /api/leads/[id]/demographic-profile` - Upsert demographic profile
- `POST /api/leads/[id]/academic-profile` - Upsert academic profile
- `POST /api/leads/[id]/work-profile` - Upsert work profile
- `POST /api/leads/[id]/test-scores` - Upsert test scores
- `POST /api/leads/[id]/process` - Upsert lead process
- `GET /api/dashboard` - Get dashboard metrics
- `GET /api/users/agents` - Get all agents

## User Roles

### Admin
- View all leads
- Assign leads to agents
- Update lead statuses
- View agent performance
- Full CRUD access to all records

### Agent
- View only assigned leads
- Update assigned lead information
- Update lead statuses
- Limited to their own leads

## Key Features

### Dashboard
- Total leads count
- New leads (today and this week)
- Leads distribution by stage
- Leads distribution by platform
- Agent performance (admin only)

### Lead List
- Server-side pagination (10/20/50 records)
- Multi-column filtering
- Search by name, email, or mobile
- Bulk selection and actions
- Export selected leads to CSV
- Create new leads

### Lead Detail
- Complete lead information display
- 6 tabbed profiles (Acquisition, Enriched, Demographic, Academic, Work, Test Scores)
- Edit capabilities for each profile
- Stage tracking and notes

## Future Enhancements

The system is architected to support:
- Rule-based lead assignment (Round Robin, field-based routing)
- Activity timeline for lead interactions
- Email integration for communication tracking
- Advanced analytics and reporting
- Mobile application
- Integration with CRM systems

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- AWS Amplify
- Netlify
- Railway
- Render
- Digital Ocean App Platform

## Database Maintenance

### Backup
```bash
pg_dump <database-url> > backup.sql
```

### Restore
```bash
psql <database-url> < backup.sql
```

## Troubleshooting

### Authentication Issues
- Verify Google OAuth credentials
- Check authorized redirect URIs
- Ensure email domain is @yournextcampus.com

### Database Connection
- Verify DATABASE_URL is correct
- Check firewall/security group settings
- Ensure SSL mode is configured properly

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Support

For issues or questions, please contact the Your Next Campus technical team.

## License

Proprietary - Your Next Campus © 2024
