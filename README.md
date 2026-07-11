# Spaced Spelling App

A web application for teachers to manage spelling lists and create spaced repetition review schedules.

## Features

### Stage 1 (Current)
- User authentication (email/password)
- Class/group management
- Spelling list creation (up to 20 words)
- Automatic spaced repetition schedule calculation
- Review schedule view by week

### Upcoming Stages
- Worksheet generation (multiple choice, definitions)
- PDF downloads
- Dictionary integration for definitions
- Word list editing during review
- Review history tracking

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SNichol27/spaced-spelling-app.git
cd spaced-spelling-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project at https://supabase.com
   - Get your project URL and anon key
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials

4. Set up the database:
   - In Supabase dashboard, go to SQL Editor
   - Run the SQL schema setup (see Database Schema section below)

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Database Schema

Run this SQL in your Supabase dashboard:

```sql
-- Create tables
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  weeks INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spelling_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  words TEXT[] NOT NULL,
  week_introduced INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spelling_list_id UUID NOT NULL REFERENCES spelling_lists(id),
  review_week INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_spelling_lists_class_id ON spelling_lists(class_id);
CREATE INDEX idx_review_schedules_list_id ON review_schedules(spelling_list_id);
```

## Project Structure

```
.
├── pages/
│   ├── _app.tsx          # App wrapper with auth
│   ├── auth/
│   │   ├── login.tsx     # Login page
│   │   └── signup.tsx    # Sign up page
│   ├── dashboard.tsx     # Main dashboard
│   ├── classes/
│   │   ├── new.tsx       # Create class
│   │   ├── [id].tsx      # Class detail
│   │   └── [id]/
│   │       ├── spelling-lists/
│   │       │   └── new.tsx  # Create spelling list
│   │       ├── review-schedule.tsx  # View schedule
│   │       └── review/
│   │           └── [listId].tsx     # Review page
│   └── api/
│       └── health.ts     # Health check endpoint
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── styles/
│   └── globals.css       # Global styles
└── README.md
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Deployment

This app is designed to run on Vercel:

1. Push your repo to GitHub
2. Connect it to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

## Development

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter

## Next Steps (Stage 2)

- [ ] Improve review page UI
- [ ] Add word list editing functionality
- [ ] Begin worksheet generation implementation
- [ ] Integrate dictionary API

## License

MIT
