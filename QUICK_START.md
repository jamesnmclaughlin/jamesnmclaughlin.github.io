# Quick Start Guide - Clean Streets UK

## ⚡ Get Your App Running in 5 Steps

### Step 1: Set Up Supabase (5-10 minutes)

1. **Create a Supabase Project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Fill in:
     - Project name: "clean-streets-uk" (or your choice)
     - Database password: Choose a strong password
     - Region: Select closest to UK
   - Click "Create new project"
   - Wait ~2 minutes for project setup

2. **Set Up the Database**
   - In your Supabase project, go to "SQL Editor" (left sidebar)
   - Click "New Query"
   - Open the `SUPABASE_SETUP.md` file in this project
   - Copy ALL the SQL code from the "Database Schema" section
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - You should see "Success. No rows returned"

3. **Create Storage Buckets**
   - Go to "Storage" in the left sidebar
   - Click "Create a new bucket"
   - Create THREE buckets with these exact names:
     - `litter-photos` (make it Public)
     - `post-photos` (make it Public)
     - `avatars` (make it Public)

   For each bucket:
   - Click the bucket name
   - Go to "Policies"
   - Click "New Policy"
   - Choose "For full customization"
   - Copy the storage policies from `SUPABASE_SETUP.md`
   - Or use these simple policies for testing:
     - SELECT: `true` (anyone can view)
     - INSERT: `auth.role() = 'authenticated'` (signed-in users can upload)

4. **Get Your Credentials**
   - Go to "Project Settings" (gear icon in sidebar)
   - Click "API"
   - Copy these two values:
     - Project URL (looks like: `https://xxxxx.supabase.co`)
     - `anon` `public` key (long string starting with `eyJ...`)

### Step 2: Connect to Your App

**In Figma Make:**
1. Open the Make settings page
2. Find "Supabase" section
3. Click "Connect Supabase"
4. Paste your Project URL
5. Paste your anon key
6. Click "Save"

**OR, if running locally:**
1. Create a `.env` file in the project root
2. Add these lines (using your credentials from Step 1.4):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 3: Test the App

1. **Sign Up**
   - Open the app
   - You'll see the authentication screen
   - Click "Sign Up"
   - Enter:
     - Username: Something you'll remember
     - Email: Your email
     - Password: At least 6 characters
   - Click "Create Account"
   - Check your email and verify (if required)

2. **Make Your First Report**
   - Sign in if not already
   - Click anywhere on the map
   - The report form will open
   - Select a size (e.g., "Small")
   - Select at least one material (e.g., "plastic")
   - Click "Submit Report"
   - You should see "+60 points" (10 for report + 50 first report bonus!)

3. **Check Your Profile**
   - Click the "Profile" tab at the top
   - You should see:
     - Your username
     - Level 1, Beginner rank
     - 60 points
     - 1 report

### Step 4: Explore Features

**Try These:**
- ✅ Report different types of litter
- ✅ Add photos to a report
- ✅ Mark a report as "cleared" (earn 25 points)
- ✅ Create a before/after post in Community tab
- ✅ Check out the Resources tab for UK recycling links
- ✅ Try reporting hazardous materials (see the warning!)

### Step 5: Share & Invite

The app is ready! Share with friends or community members:
- Send them the app URL
- They can sign up and start reporting
- Work together to keep your area clean
- Compete on the leaderboard (coming soon)

## 🔧 Troubleshooting

### "Authentication failed"
- Check your Supabase project is running (green status in dashboard)
- Verify your environment variables are correct
- Try signing in instead of signing up if account exists

### "Failed to submit report"
- Make sure you're signed in
- Check that you selected both size AND materials
- Verify database setup completed successfully

### Map not showing
- Check internet connection
- Leaflet CSS should be imported (check `src/styles/index.css`)
- Try refreshing the page

### Photos not uploading
- Verify storage buckets are created and PUBLIC
- Check storage policies are set correctly
- Try with smaller image files (< 5MB)

### No points awarded
- Check the `award_points` function exists in Supabase
- Go to SQL Editor and run: `SELECT * FROM profiles WHERE id = auth.uid();`
- Verify the points column is updating

## 🎯 Next Steps

**Customize for Your Community:**
- Update council links in `src/lib/supabase.ts`
- Add local landmarks to the map
- Create custom achievement badges
- Set up community cleanup events

**Spread the Word:**
- Share on local Facebook groups
- Contact your local council
- Print QR codes for notice boards
- Organize a community cleanup day

**Monitor Usage:**
- Use Supabase dashboard to see:
  - Number of users (Table Editor > profiles)
  - Total reports (Table Editor > litter_reports)
  - Most active areas (check lat/lng clustering)
  - Popular post types

## 📊 Database Quick Checks

Open Supabase SQL Editor and run these to check everything:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show: profiles, litter_reports, posts, post_likes, report_confirmations

-- Check if functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- Should show: award_points, increment_cleanups_count, find_nearby_reports

-- Check PostGIS is enabled
SELECT PostGIS_Version();

-- Should return a version number
```

## 🆘 Still Need Help?

1. **Check the full `SUPABASE_SETUP.md`** - has complete SQL code
2. **Read `README.md`** - full feature documentation
3. **Verify Supabase logs** - go to Logs > PostgreSQL Logs in dashboard
4. **Test with sample data** - insert a test report via SQL Editor

## 🎉 You're All Set!

Your UK litter tracking app is now live and ready to make a difference in your community. Every piece of litter reported and cleared helps keep Britain beautiful! 🇬🇧✨

---

**Quick Links:**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GOV.UK Report Fly-Tipping](https://www.gov.uk/report-flytipping)
- [Recycle Now](https://www.recyclenow.com/)
