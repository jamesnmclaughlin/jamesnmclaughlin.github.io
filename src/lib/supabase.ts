import { createClient } from "@supabase/supabase-js";

// These will be automatically provided by the Figma Make Supabase integration
// If you see errors, make sure you've connected Supabase in the Make settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  level: number;
  points: number;
  reports_count: number;
  cleanups_count: number;
  location_area?: string; // Approximate location (e.g., first part of postcode)
  location_lat?: number;
  location_lng?: number;
  created_at: string;
  updated_at: string;
}

export interface LitterReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  materials: string[];
  size_category: "small" | "medium" | "large" | "fly-tipping";
  description?: string;
  is_hazardous: boolean;
  status: "reported" | "in-progress" | "cleared";
  photo_urls?: string[];
  report_count: number;
  cleared_by?: string;
  cleared_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Post {
  id: string;
  user_id: string;
  post_type: "before_after" | "recycling_hack" | "tip";
  title: string;
  description?: string;
  photo_urls?: string[];
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  is_liked?: boolean;
}

export interface BinReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  bin_types: string[]; // e.g., ['general', 'recycling', 'clothes']
  status: "available" | "full" | "missing" | "damaged";
  description?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

// Helper functions
export async function uploadPhoto(
  bucket: "litter-photos" | "post-photos" | "avatars",
  file: File,
  userId?: string,
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId || "public"}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function findNearbyReports(
  lat: number,
  lng: number,
  radiusMeters: number = 50,
) {
  const { data, error } = await supabase.rpc("find_nearby_reports", {
    lat,
    lng,
    radius_meters: radiusMeters,
  });

  if (error) {
    console.error("Error finding nearby reports:", error);
    return [];
  }

  return data;
}

export async function awardPoints(userId: string, points: number) {
  const { error } = await supabase.rpc("award_points", {
    user_uuid: userId,
    points_to_add: points,
  });

  if (error) {
    console.error("Error awarding points:", error);
  }
}

// Geocode UK postcode to lat/lng using Nominatim (OpenStreetMap)
export async function geocodeUKPostcode(
  postcode: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const cleanPostcode = postcode.trim().toUpperCase();
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanPostcode)},UK&limit=1`,
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding postcode:", error);
    return null;
  }
}

// Points awarded for different actions
export const POINTS = {
  REPORT_LITTER: 10,
  CONFIRM_REPORT: 5,
  CLEAR_LITTER: 25,
  CLEAR_HAZARDOUS: 50,
  POST_BEFORE_AFTER: 15,
  POST_RECYCLING_HACK: 10,
  FIRST_REPORT: 50, // Bonus for first report
};

// Hazardous materials that trigger warnings
export const HAZARDOUS_MATERIALS = [
  "asbestos",
  "chemicals",
  "batteries",
  "paint",
  "oil",
  "gas cylinders",
  "needles",
  "medical waste",
  "electronics with batteries",
];

// UK Council reporting links
export const COUNCIL_LINKS = {
  general: "https://www.gov.uk/report-flytipping",
  hazardous: "https://www.gov.uk/hazardous-waste-disposal",
};

// Recycling resources
export const RECYCLING_RESOURCES = [
  {
    name: "Recycle Now",
    url: "https://www.recyclenow.com/",
    description: "Find out what you can recycle and where",
  },
  {
    name: "Recycle Your Electricals",
    url: "https://www.recycleyourelectricals.org.uk/",
    description: "Recycling information for electrical items",
  },
  {
    name: "GOV.UK Waste Services",
    url: "https://www.gov.uk/find-local-council",
    description: "Find your local council for waste collection",
  },
];
