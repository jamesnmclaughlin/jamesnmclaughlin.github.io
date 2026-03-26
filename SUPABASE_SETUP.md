# Supabase Database Setup for UK Litter Tracker

## Database Schema

Run these SQL commands in your Supabase SQL Editor to set up the database:

```sql
-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 0,
  cleanups_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Litter reports table
CREATE TABLE litter_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  materials TEXT[] NOT NULL, -- e.g., ['plastic', 'glass', 'metal']
  size_category TEXT NOT NULL, -- 'small', 'medium', 'large', 'fly-tipping'
  description TEXT,
  is_hazardous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'reported', -- 'reported', 'in-progress', 'cleared'
  photo_urls TEXT[],
  report_count INTEGER DEFAULT 1, -- Number of users who reported this location
  cleared_by UUID REFERENCES profiles(id),
  cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table (before/after, recycling hacks)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_type TEXT NOT NULL, -- 'before_after', 'recycling_hack', 'tip'
  title TEXT NOT NULL,
  description TEXT,
  photo_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes table
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Report confirmations (when multiple users report same location)
CREATE TABLE report_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES litter_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_litter_reports_location ON litter_reports USING GIST (location);
CREATE INDEX idx_litter_reports_status ON litter_reports (status);
CREATE INDEX idx_litter_reports_created_at ON litter_reports (created_at DESC);
CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_posts_type ON posts (post_type);
CREATE INDEX idx_profiles_points ON profiles (points DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE litter_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Litter Reports: anyone can read, authenticated users can create
CREATE POLICY "Litter reports are viewable by everyone" ON litter_reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON litter_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON litter_reports
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = cleared_by);

-- Posts: anyone can read, authenticated users can create own
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post Likes
CREATE POLICY "Likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Report Confirmations
CREATE POLICY "Confirmations are viewable by everyone" ON report_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can confirm reports" ON report_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to update location geography from lat/lng
CREATE OR REPLACE FUNCTION update_report_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_report_location
  BEFORE INSERT OR UPDATE ON litter_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_report_location();

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(user_uuid UUID, points_to_add INTEGER)
RETURNS void AS $$
DECLARE
  new_points INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE profiles
  SET points = points + points_to_add,
      updated_at = NOW()
  WHERE id = user_uuid
  RETURNING points INTO new_points;

  -- Level calculation: level = floor(sqrt(points / 100)) + 1
  new_level := FLOOR(SQRT(new_points::FLOAT / 100)) + 1;

  UPDATE profiles
  SET level = new_level
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to increment cleanup count
CREATE OR REPLACE FUNCTION increment_cleanups_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET cleanups_count = cleanups_count + 1,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby reports
CREATE OR REPLACE FUNCTION find_nearby_reports(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lr.id,
    ST_Distance(
      lr.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) as distance_meters
  FROM litter_reports lr
  WHERE ST_DWithin(
    lr.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_meters
  )
  AND lr.status != 'cleared'
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;
```

## Storage Buckets

Create these storage buckets in Supabase Storage:

1. **litter-photos**: For litter report images
   - Public bucket
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Max file size: 5MB

2. **post-photos**: For community post images
   - Public bucket
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Max file size: 5MB

3. **avatars**: For user profile pictures
   - Public bucket
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Max file size: 2MB

## Storage Policies

```sql
-- Litter Photos
CREATE POLICY "Anyone can view litter photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'litter-photos');

CREATE POLICY "Authenticated users can upload litter photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'litter-photos' AND
    auth.role() = 'authenticated'
  );

-- Post Photos
CREATE POLICY "Anyone can view post photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-photos');

CREATE POLICY "Authenticated users can upload post photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-photos' AND
    auth.role() = 'authenticated'
  );

-- Avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Next Steps

1. Run the SQL commands in your Supabase SQL Editor
2. Create the storage buckets
3. Get your Supabase URL and anon key from Project Settings > API
4. The app will automatically connect using the Supabase configuration
