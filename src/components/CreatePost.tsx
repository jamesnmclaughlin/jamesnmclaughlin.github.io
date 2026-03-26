import { useState, useRef } from "react";
import { X, Camera, Loader2, Sparkles, Recycle, Lightbulb } from "lucide-react";
import { supabase, uploadPhoto, POINTS, awardPoints } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../app/components/ui/button";
import { toast } from "sonner";

interface CreatePostProps {
  onClose: () => void;
  onSuccess: () => void;
}

const POST_TYPES = [
  {
    value: "before_after",
    label: "Before & After",
    icon: Sparkles,
    points: POINTS.POST_BEFORE_AFTER,
    description: "Show your cleanup success!",
  },
  {
    value: "recycling_hack",
    label: "Recycling Hack",
    icon: Recycle,
    points: POINTS.POST_RECYCLING_HACK,
    description: "Share your creative reuse ideas",
  },
  {
    value: "tip",
    label: "Tip",
    icon: Lightbulb,
    points: POINTS.POST_RECYCLING_HACK,
    description: "Help others with advice",
  },
];

export function CreatePost({ onClose, onSuccess }: Readonly<CreatePostProps>) {
  const { user } = useAuth();
  const [postType, setPostType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Upload photos
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map((photo) =>
          uploadPhoto("post-photos", photo, user.id),
        );
        const results = await Promise.all(uploadPromises);
        photoUrls = results.filter((url): url is string => url !== null);
      }

      // Create post
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        post_type: postType,
        title,
        description,
        photo_urls: photoUrls,
        likes_count: 0,
      });

      if (error) throw error;

      // Award points
      const selectedType = POST_TYPES.find((t) => t.value === postType);
      if (selectedType) {
        await awardPoints(user.id, selectedType.points);
        toast.success(`Post created! +${selectedType.points} points`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 5)); // Max 5 photos
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedType = POST_TYPES.find((t) => t.value === postType);

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Post Type */}
          <div>
            <label className="block font-medium mb-3">
              What would you like to share?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {POST_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostType(type.value)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      postType === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-6 h-6 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{type.label}</p>
                          <span className="text-xs text-green-600 font-semibold">
                            +{type.points}pts
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              placeholder={
                postType === "before_after"
                  ? "e.g., Cleared the park near my house!"
                  : postType === "recycling_hack"
                    ? "e.g., Turn plastic bottles into plant pots"
                    : "e.g., Best way to clean up broken glass safely"
              }
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="Tell us more about your experience..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Photos */}
          <div>
            <label className="block font-medium mb-2">
              Photos{" "}
              {postType === "before_after" && (
                <span className="text-red-500">*</span>
              )}
            </label>
            {postType === "before_after" && (
              <p className="text-sm text-gray-600 mb-3">
                Add before and after photos to inspire others!
              </p>
            )}

            <div className="space-y-2">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
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
                      {postType === "before_after" && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-1">
                          {index === 0
                            ? "Before"
                            : index === 1
                              ? "After"
                              : `Photo ${index + 1}`}
                        </div>
                      )}
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
                    {postType === "before_after" && photos.length === 0
                      ? "Add before photo first"
                      : postType === "before_after" && photos.length === 1
                        ? "Add after photo"
                        : `Add photo (${photos.length}/5)`}
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
                !postType ||
                !title ||
                (postType === "before_after" && photos.length < 2)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                `Post (+${selectedType?.points || 0}pts)`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
