# Clean Streets UK - Community Litter Tracking App

A mobile-first web application for tracking, reporting, and managing litter in UK communities. Built with React, Tailwind CSS, Leaflet maps, and Supabase.

![Clean Streets UK](https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop)

## 🌟 Features

### 📍 Interactive Map
- **Report Litter**: Click anywhere on the map to report litter at that location
- **Visual Indicators**: Larger, more prominent markers for heavily reported issues
- **Hazard Warnings**: Red markers for dangerous materials with safety warnings
- **Status Tracking**: See reported, in-progress, and cleared items
- **Real-time Updates**: Live updates when others report or clear litter

### 🎮 Gamification System
- **Points & Levels**: Earn points for reporting and cleaning up litter
- **Level Progression**: Advance through ranks from Beginner to Legend
- **Achievements**: Unlock badges for milestones (10 reports, 5 cleanups, etc.)
- **Leaderboard Ready**: Profile system tracks all your stats

**Point System:**
- Report litter: 10 points
- First report bonus: 50 points
- Confirm existing report: 5 points
- Clear litter: 25 points
- Clear hazardous litter: 50 points
- Post before/after: 15 points
- Share recycling hack: 10 points

### 👥 Social Features
- **Community Feed**: Share before/after cleanup photos
- **Recycling Hacks**: Post creative reuse and recycling ideas
- **Tips & Advice**: Share helpful cleaning and reporting tips
- **Like & Engage**: Support community members' efforts

### 🛡️ Safety Features
- **Hazardous Material Detection**: Automatic warnings for dangerous items
- **Council Links**: Direct links to report hazardous waste properly
- **Safety Tips**: Built-in guidance for safe cleanup practices
- **No Duplicate Reports**: Prevents multiple reports for the same location (50m radius)

### 📚 Resources Section
- Links to UK recycling services (Recycle Now, Recycle Your Electricals)
- Local council finder
- Fly-tipping reporting guidance
- Emergency contact information
- Safety best practices

## 🚀 Getting Started

### Prerequisites

1. **Node.js & pnpm**: Make sure you have Node.js installed
2. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)

### Supabase Setup

1. **Create a new Supabase project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Fill in your project details

2. **Run the database setup**
   - Open your Supabase project
   - Go to SQL Editor
   - Copy and paste the SQL from `SUPABASE_SETUP.md`
   - Execute the script

3. **Create storage buckets**
   - Go to Storage in Supabase dashboard
   - Create three buckets: `litter-photos`, `post-photos`, `avatars`
   - Make all buckets public
   - Run the storage policies from `SUPABASE_SETUP.md`

4. **Get your credentials**
   - Go to Project Settings > API
   - Copy your project URL
   - Copy your `anon/public` key

5. **Connect to the app**
   - In Figma Make settings, connect your Supabase project
   - Enter your project URL and anon key

### Environment Variables

The app expects these environment variables (automatically configured by Figma Make):

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 How to Use

### For Users

1. **Sign Up**: Create an account with email and password
2. **Report Litter**:
   - Click on the map where litter is located
   - Select size/amount
   - Choose material types
   - Add photos (optional)
   - Submit report
3. **Confirm Reports**: See a report you recognize? Confirm it to increase visibility
4. **Mark as Cleared**: Cleaned up litter? Mark it as cleared to earn points
5. **Share Success**: Post before/after photos in the community feed
6. **Level Up**: Earn points and climb the ranks!

### For Community Leaders

- Use the map to identify problem areas (more reports = bigger marker)
- Share tips and organize cleanup events via the community feed
- Monitor progress through the resources section
- Encourage participation through the gamification system

## 🎨 Design Philosophy

- **Mobile-First**: Optimized for smartphones since most users will report on-the-go
- **UK-Focused**: Links to UK councils, GOV.UK resources, and UK recycling services
- **Safety-Conscious**: Prominent warnings for hazardous materials
- **Community-Driven**: Social features to build engagement and community spirit
- **Gamified**: Makes civic duty fun and rewarding

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: Leaflet + React-Leaflet
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Geospatial**: PostGIS for location queries
- **Real-time**: Supabase real-time subscriptions
- **UI Components**: Radix UI primitives

## 🗺️ Database Schema

**Tables:**
- `profiles` - User profiles with levels, points, and stats
- `litter_reports` - Litter reports with location, materials, status
- `posts` - Community posts (before/after, recycling hacks, tips)
- `post_likes` - User likes on posts
- `report_confirmations` - Multiple users confirming same litter

**Key Features:**
- PostGIS for geographic queries
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates
- Automatic level calculation based on points

## 🔒 Privacy & Security

- User authentication via Supabase Auth
- Row Level Security prevents unauthorized data access
- Photo storage in public buckets (don't upload sensitive content)
- No PII collection beyond email for authentication
- Usernames instead of real names for privacy

## 📈 Future Enhancements

Potential additions:
- Push notifications for nearby litter reports
- Scheduled cleanup events
- Municipal/council admin dashboard
- Export reports for official use
- Photo verification system
- Team challenges and group cleanups
- Carbon impact calculations
- Integration with local council APIs

## 🤝 Contributing

Ideas for contribution:
- Add more UK-specific council links
- Improve hazardous material detection
- Add more achievement types
- Create educational content about recycling
- Improve accessibility
- Add multi-language support

## 📄 License

This is a community project focused on making UK streets cleaner. Use it, improve it, share it!

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Recycle Now for recycling resources
- UK GOV.UK for official reporting links
- The community of volunteers keeping Britain tidy

## 📞 Support

For issues with the app:
1. Check the Resources section for guidance
2. Review the Supabase setup documentation
3. Ensure all database functions are created correctly

For environmental emergencies:
- Environmental Agency: 0800 80 70 60
- Emergency services: 999

---

**Made with 💚 for cleaner communities across the UK**
