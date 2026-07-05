# MNNIT Robotics Club - Official Website

The official website of the Robotics Club at MNNIT Allahabad. A dynamic community of robotics enthusiasts from all departments, building innovative robots and competing at national and international levels.

## Features

- **Landing Page**: Showcase of the club, events, and latest projects
- **Projects System**: Detailed project pages with hardware, software, tech stack, and team information
- **Events Management**: Information about flagship events like ROBOMANIA and BoTRUSH
- **User Authentication**: Sign up and sign in for members
- **Team Formation**: Create and manage teams for competitions and projects
- **Admin Dashboard**: Manage projects, media uploads, and team approvals
- **Media Library**: Upload and manage images via Cloudinary integration

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt password hashing
- **Media Storage**: Cloudinary
- **Markdown**: react-markdown for project content rendering

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
\`\`\`

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

### User Authentication
- Sign up with email, name, roll number, and department
- Secure login with JWT tokens
- Password hashing with bcrypt
- User profiles with customizable information

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
