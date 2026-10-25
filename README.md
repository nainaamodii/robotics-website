# MNNIT Robotics Club - Official Website

The official website of the Robotics Club at MNNIT Allahabad. A dynamic community of robotics enthusiasts from all departments, building innovative robots and competing at national and international levels.

## Features

- **Landing Page**: Showcase of the club, events, and latest projects
- **Projects System**: Detailed project pages with hardware, software, tech stack, and team information
- **Events Management**: Information about flagship events like ROBOMANIA and BoTRUSH
- **Email OTP Authentication**: Passwordless sign-in with a 6-digit code emailed to the user; every account is email-verified
- **Team Formation**: Create and manage teams for competitions and projects
- **Admin Dashboard**: Manage projects, media uploads, and team approvals
- **Media Library**: Upload and manage images via Cloudinary integration

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Next.js API Routes
- **Database**: MongoDB
- **Authentication**: Email one-time codes (SMTP) + JWT session cookie
- **Media Storage**: Cloudinary
- **Markdown**: react-markdown for project content rendering

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
\`\`\`

See `.env.example`. **SMTP credentials are not env vars** — after signing in to `/admin`, open
**Email / SMTP**, enter your host/port/user/password, and use *Send test*. The password is
encrypted (AES-256-GCM, key derived from `JWT_SECRET`) before it is stored in MongoDB. Until SMTP is
configured, production refuses to send codes; in development the code is printed to the server log.

## Getting Started

### Install dependencies
\`\`\`bash
npm install
\`\`\`

### Run development server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build for production
\`\`\`bash
npm run build
npm run start
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/           # API routes for backend
│   ├── auth/          # Authentication pages (signin, signup)
│   ├── admin/         # Admin dashboard
│   ├── projects/      # Projects listing and details
│   ├── events/        # Events page
│   └── page.tsx       # Home page
├── components/        # Reusable React components
├── lib/
│   ├── models/        # MongoDB models
│   ├── db.ts          # MongoDB connection
│   └── auth-context.ts # Auth context
└── public/            # Static assets
\`\`\`

## Features in Detail

### Authentication & registration flow
- Sign in with Google (when `GOOGLE_CLIENT_ID/SECRET` are set) or email → 6-digit code (10 min expiry, single use, 5 attempts, 45 s resend cooldown)
- Only `@mnnit.ac.in` addresses can sign in (`ALLOWED_EMAIL_DOMAIN`); mobile numbers must be 10 digits starting 6-9
- First sign-in creates the account; onboarding collects name, branch, phone and (optionally) codename
- Registering for a competition or accepting a team invitation requires a verified email
- Admins see every team registration — full roster, contact details, verification status — under
  **Admin → Team Registrations** (approve / reject / export CSV)

### Project Management
- Add, edit, delete, and publish projects
- Full project details including:
  - Hardware used
  - Software/tools
  - Tech stack
  - Contributors and mentors
  - Markdown-based content
  - GitHub links and documentation
  - Achievement tracking

### Media Management
- Upload images to Cloudinary
- Manage media library
- Generate markdown image syntax for easy insertion

### Team Formation
- Create teams with a leader
- Add/remove team members
- Assign teams to projects
- Track team composition

### Admin Dashboard
- Project management interface
- Media library management
- Team approval system
- Analytics and statistics

## Contributing

Members can contribute by:
1. Signing up on the website
2. Joining or creating teams
3. Contributing to projects
4. Participating in events

## Contact

For inquiries, reach out to the Robotics Club at MNNIT Allahabad.

## Deployment & CI

This is a full-stack Next.js app (API routes, MongoDB, server-side sessions), so it **cannot run on
GitHub Pages**, which only serves static files. Deploy it to a Node host (Vercel, Hostinger Node.js
hosting, Render, …) and set the variables from `.env.example` in that host's environment settings.

`.github/workflows/ci.yml` runs type-check, tests and a production build on every push/PR. Add the
values it reads under **Settings → Secrets and variables → Actions** (secrets: `MONGO_URL`,
`JWT_SECRET`, `ADMIN_PASSWORD`, `CLOUDINARY_*`, `GOOGLE_CLIENT_*`, `GROQ_API_KEY`, `GEMINI_API_KEY`;
variables: `APP_URL`, `ALLOWED_EMAIL_DOMAIN`). **Never commit a filled-in `.env` to the repo** — anyone
who can read the repository can read it, and GitHub history keeps it forever.
