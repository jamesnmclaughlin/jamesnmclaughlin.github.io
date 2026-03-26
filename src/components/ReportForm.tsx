import { useState, useRef } from "react";
import {
  X,
  AlertTriangle,
  Camera,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  supabase,
  uploadPhoto,
  findNearbyReports,
  HAZARDOUS_MATERIALS,
  COUNCIL_LINKS,
  POINTS,
  awardPoints,
} from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../app/components/ui/button";
import { toast } from "sonner";

interface ReportFormProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: () => void;
}

const MATERIAL_OPTIONS = [
  "plastic",
  "glass",
  "metal",
  "paper",
  "food waste",
  "textiles",
  "electronics",
  "furniture",
  "tyres",
  "construction waste",
  "asbestos",
  "chemicals",
  "batteries",
  "paint",
  "oil",
  "gas cylinders",
  "needles",
  "medical waste",
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small (handful)", icon: "🗑️" },
  { value: "medium", label: "Medium (bag)", icon: "🛍️" },
  {
    value: "large",
    label: "Large (multiple bags)",
    icon: "🚛",
  },
  { value: "fly-tipping", label: "Fly-tipping", icon: "⚠️" },
];

export function ReportForm({
  location,
  onClose,
  onSuccess,
}: ReportFormProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [materials, setMaterials] = useState<string[]>([]);
  const [sizeCategory, setSizeCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [nearbyExists, setNearbyExists] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHazardous = materials.some((m) =>
    HAZARDOUS_MATERIALS.includes(m.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    setChecking(true);

    try {
      // Check for nearby reports (within 50 meters)
      const nearby = await findNearbyReports(
        location.lat,
        location.lng,
        50,
      );

      if (nearby && nearby.length > 0) {
        setNearbyExists(true);
        setChecking(false);
        toast.error(
          "A litter report already exists nearby. Please confirm that report instead.",
        );
        return;
      }

      setChecking(false);

      // Upload photos
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map((photo) =>
          uploadPhoto("litter-photos", photo, user.id),
        );
        const results = await Promise.all(uploadPromises);
        photoUrls = results.filter(
          (url): url is string => url !== null,
        );
      }

      // Create report
      const { error } = await supabase
        .from("litter_reports")
        .insert({
          user_id: user.id,
          latitude: location.lat,
          longitude: location.lng,
          materials,
          size_category: sizeCategory,
          description,
          is_hazardous: isHazardous,
          photo_urls: photoUrls,
          status: "reported",
          report_count: 1,
        });

      if (error) throw error;

      // Award points
      let points = POINTS.REPORT_LITTER;
      if (profile.reports_count === 0) {
        points += POINTS.FIRST_REPORT; // First report bonus
      }
      await awardPoints(user.id, points);

      // Update reports count
      await supabase
        .from("profiles")
        .update({ reports_count: profile.reports_count + 1 })
        .eq("id", user.id);

      await refreshProfile();

      toast.success(
        `Report submitted! +${points} points`,
        isHazardous
          ? {
              description:
                "Hazardous material detected. Please report to your local council.",
            }
          : undefined,
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleMaterialToggle(material: string) {
    setMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material],
    );
  }

  function handlePhotoSelect(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 5)); // Max 5 photos
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Report Litter
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Display */}
          <div className="bg-gray-50 rounded p-3">
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-mono text-sm">
              {location.lat.toFixed(6)},{" "}
              {location.lng.toFixed(6)}
            </p>
          </div>

          {/* Size Category */}
          <div>
            <label className="block font-medium mb-2">
              Size/Amount{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSizeCategory(option.value)}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    sizeCategory === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {option.icon}
                  </div>
                  <div className="text-sm font-medium">
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="block font-medium mb-2">
              Materials <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {MATERIAL_OPTIONS.map((material) => {
                const isSelected = materials.includes(material);
                const isHazardousMaterial =
                  HAZARDOUS_MATERIALS.includes(
                    material.toLowerCase(),
                  );

                return (
                  <button
                    key={material}
                    type="button"
                    onClick={() =>
                      handleMaterialToggle(material)
                    }
                    className={`p-2 border-2 rounded text-sm text-left transition-all ${
                      isSelected
                        ? isHazardousMaterial
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {isHazardousMaterial && "⚠️ "}
                    {material}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hazardous Warning */}
          {isHazardous && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">
                    Hazardous Material Detected
                  </p>
                  <p className="text-sm text-red-800 mb-3">
                    Do not attempt to clean this yourself. This
                    type of waste requires professional
                    handling.
                  </p>
                  <a
                    href={COUNCIL_LINKS.hazardous}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-900 font-medium"
                  >
                    Report to Council
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Additional details about the litter..."
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block font-medium mb-2">
              Photos (optional)
            </label>
            <div className="space-y-2">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Camera className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Add photo ({photos.length}/5)
                  </p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                loading ||
                checking ||
                !sizeCategory ||
                materials.length === 0 ||
                nearbyExists
              }
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Submit Report (+${profile?.reports_count === 0 ? POINTS.REPORT_LITTER + POINTS.FIRST_REPORT : POINTS.REPORT_LITTER}pts)`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}