import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Trophy,
  Target,
  Zap,
  Award,
  TrendingUp,
  MapPin,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { geocodeUKPostcode, supabase } from "../lib/supabase";
import { toast } from "sonner";
import { Button } from "../app/components/ui/button";

export function UserProfile() {
  const { profile, refreshProfile } = useAuth();
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationArea, setLocationArea] = useState(
    profile?.location_area || "",
  );
  const [savingLocation, setSavingLocation] = useState(false);

  if (!profile) return null;

  async function handleSaveLocation() {
    setSavingLocation(true);

    try {
      if (!profile) return;
      let location = null;
      if (locationArea.trim()) {
        location = await geocodeUKPostcode(locationArea);
        if (!location) {
          toast.error("Could not find location. Please check your input.");
          setSavingLocation(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          location_area: locationArea.trim() || null,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditingLocation(false);
      toast.success("Location updated successfully!");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  }

  if (!profile) return null;

  // Calculate progress to next level
  const pointsForCurrentLevel = (profile.level - 1) ** 2 * 100;
  const pointsForNextLevel = profile.level ** 2 * 100;
  const pointsInCurrentLevel = profile.points - pointsForCurrentLevel;
  const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel;
  const levelProgress = (pointsInCurrentLevel / pointsNeededForLevel) * 100;

  // Calculate rank based on level
  const getRank = (level: number) => {
    if (level >= 50)
      return { name: "Legend", color: "from-purple-500 to-pink-500" };
    if (level >= 30)
      return { name: "Champion", color: "from-yellow-500 to-orange-500" };
    if (level >= 20)
      return { name: "Hero", color: "from-blue-500 to-cyan-500" };
    if (level >= 10)
      return { name: "Guardian", color: "from-green-500 to-emerald-500" };
    if (level >= 5)
      return { name: "Helper", color: "from-teal-500 to-green-500" };
    return { name: "Beginner", color: "from-gray-500 to-gray-600" };
  };

  const rank = getRank(profile.level);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* User Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-16 h-16 bg-linear-to-br ${rank.color} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
        >
          {profile.username[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{profile.username}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-3 py-1 bg-linear-to-r ${rank.color} text-white text-sm font-semibold rounded-full`}
            >
              {rank.name}
            </span>
            <span className="text-sm text-gray-500">Level {profile.level}</span>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Your Area</h3>
          </div>
          {!isEditingLocation && (
            <button
              onClick={() => {
                setLocationArea(profile.location_area || "");
                setIsEditingLocation(true);
              }}
              className="p-1 hover:bg-blue-100 rounded"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </button>
          )}
        </div>

        {isEditingLocation ? (
          <div className="space-y-2">
            <input
              type="text"
              value={locationArea}
              onChange={(e) => setLocationArea(e.target.value)}
              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., SW1, Manchester, Birmingham"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveLocation}
                disabled={savingLocation}
                size="sm"
                className="flex-1"
              >
                {savingLocation ? (
                  <>
                    <Save className="w-4 h-4 mr-1 animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setIsEditingLocation(false);
                  setLocationArea(profile.location_area || "");
                }}
                disabled={savingLocation}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
            <p className="text-xs text-blue-700">
              This sets your initial map location when you open the app
            </p>
          </div>
        ) : (
          <p className="text-sm text-blue-700">
            {profile.location_area || "Not set - click edit to add your area"}
          </p>
        )}
      </div>

      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Level Progress</span>
          <span className="text-gray-600">
            {pointsInCurrentLevel}/{pointsNeededForLevel} pts
          </span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 bg-linear-to-r ${rank.color} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(levelProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {pointsNeededForLevel - pointsInCurrentLevel} points to Level{" "}
          {profile.level + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Total Points
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{profile.points}</p>
        </div>

        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Reports</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {profile.reports_count}
          </p>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Cleanups
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {profile.cleanups_count}
          </p>
        </div>

        <div className="bg-linear-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Level</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{profile.level}</p>
        </div>
      </div>

      {/* Achievements Preview */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Recent Milestones
        </h3>
        <div className="space-y-2">
          {profile.reports_count >= 10 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                🎯
              </div>
              <div>
                <p className="font-medium text-sm">Reporter</p>
                <p className="text-xs text-gray-600">10+ litter reports</p>
              </div>
            </div>
          )}

          {profile.cleanups_count >= 5 && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                ✨
              </div>
              <div>
                <p className="font-medium text-sm">Cleaner</p>
                <p className="text-xs text-gray-600">5+ cleanups completed</p>
              </div>
            </div>
          )}

          {profile.level >= 5 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                🚀
              </div>
              <div>
                <p className="font-medium text-sm">Rising Star</p>
                <p className="text-xs text-gray-600">Reached Level 5</p>
              </div>
            </div>
          )}

          {profile.reports_count === 0 && profile.cleanups_count === 0 && (
            <div className="text-center py-4">
              <TrendingUp className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Complete actions to unlock achievements!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
