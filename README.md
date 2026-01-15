# School - AI Learning Platform

A modern Learning Management System (LMS) focused on AI education. Built with Next.js, Supabase, and Tailwind CSS.

![School LMS](https://school.cornelabs.com/og-image.png)

## Features

- **Student Portal**: Browse courses, enroll, track progress
- **Video Lessons**: Watch course content with progress tracking
- **Admin Panel**: Create courses, manage content, upload videos
- **Authentication**: Secure signup/login with role-based access

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/bolasbanjo/school.git
cd school
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema in SQL Editor:
   ```bash
   # Copy contents of supabase/schema.sql
   ```
3. Create storage buckets:
   - `course-videos` (public)
   - `thumbnails` (public)

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard & course management
│   ├── auth/           # Auth callback
│   ├── courses/        # Public course catalog
│   ├── dashboard/      # Student dashboard
│   ├── learn/          # Video player
│   ├── login/          # Login page
│   └── signup/         # Signup page
├── components/         # Reusable components
├── lib/supabase/       # Supabase client & queries
└── types/              # TypeScript definitions
```

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

## License

MIT
