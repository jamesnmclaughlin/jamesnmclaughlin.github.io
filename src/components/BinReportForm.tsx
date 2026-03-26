import { useState, type SubmitEvent } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../app/components/ui/button";
import { toast } from "sonner";

interface BinReportFormProps {
  location: { lat: number; lng: number };
  onClose: () => void;
  onSuccess: () => void;
}

const BIN_TYPES = [
  { value: "general", label: "General Waste", icon: "🗑️" },
  { value: "recycling", label: "Recycling", icon: "♻️" },
  { value: "food", label: "Food Waste", icon: "🍎" },
  { value: "glass", label: "Glass", icon: "🍾" },
  { value: "paper", label: "Paper/Cardboard", icon: "📄" },
  { value: "clothes", label: "Clothes/Textiles", icon: "👕" },
  { value: "batteries", label: "Batteries", icon: "🔋" },
];

export function BinReportForm({
  location,
  onClose,
  onSuccess,
}: Readonly<BinReportFormProps>) {
  const { user } = useAuth();
  const [binTypes, setBinTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    if (binTypes.length === 0) {
      toast.error("Please select at least one bin type");
      return;
    }

    setLoading(true);

    try {
      // Create bin report
      const { error } = await supabase.from("bin_reports").insert({
        user_id: user.id,
        latitude: location.lat,
        longitude: location.lng,
        bin_types: binTypes,
        status: "available",
        description,
      });

      if (error) throw error;

      toast.success("Bin location marked successfully!");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting bin report:", error);
      toast.error("Failed to mark bin location. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleBinTypeToggle(type: string) {
    setBinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Mark Bin Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Display */}
          <div className="bg-blue-50 rounded p-3">
            <p className="text-sm text-blue-600 font-medium">Bin Location</p>
            <p className="font-mono text-sm">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>

          {/* Bin Types */}
          <div>
            <label className="block font-medium mb-2">
              Bin Types <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Select all types of bins available at this location
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BIN_TYPES.map((type) => {
                const isSelected = binTypes.includes(type.value);

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleBinTypeToggle(type.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="additionalNotes" className="block font-medium mb-2">
              Additional Notes (optional)
            </label>
            <textarea
              id="additionalNotes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Any additional details about this bin location..."
            />
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
              disabled={loading || binTypes.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Mark Bin
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
