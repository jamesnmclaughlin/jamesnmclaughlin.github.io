import { useEffect, useState } from "react";
import { supabase, type Post } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Heart,
  MessageCircle,
  Sparkles,
  Recycle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          fetchPosts();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles(username, level, avatar_url)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserLikes() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setLikedPosts(new Set(data.map((like) => like.post_id)));
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  }

  async function toggleLike(postId: string, currentlyLiked: boolean) {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update likes count
        await supabase
          .from("posts")
          .update({ likes_count: supabase.sql`likes_count - 1` })
          .eq("id", postId);

        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        // Update likes count
        await supabase
          .from("posts")
          .update({ likes_count: supabase.sql`likes_count + 1` })
          .eq("id", postId);

        setLikedPosts((prev) => new Set(prev).add(postId));
      }

      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  }

  function getPostIcon(postType: string) {
    switch (postType) {
      case "before_after":
        return <Sparkles className="w-5 h-5 text-green-500" />;
      case "recycling_hack":
        return <Recycle className="w-5 h-5 text-blue-500" />;
      case "tip":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  }

  function getPostTypeLabel(postType: string) {
    switch (postType) {
      case "before_after":
        return "Cleanup Complete";
      case "recycling_hack":
        return "Recycling Hack";
      case "tip":
        return "Tip";
      default:
        return postType;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const isLiked = likedPosts.has(post.id);

        return (
          <div
            key={post.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {post.profiles?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {post.profiles?.username || "Anonymous"}
                  </p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Lv {post.profiles?.level || 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {getPostIcon(post.post_type)}
                  <span>{getPostTypeLabel(post.post_type)}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <h3 className="font-semibold mb-2">{post.title}</h3>
              {post.description && (
                <p className="text-gray-700 text-sm mb-3">{post.description}</p>
              )}
            </div>

            {/* Photos */}
            {post.photo_urls && post.photo_urls.length > 0 && (
              <div
                className={`grid gap-1 ${
                  post.photo_urls.length === 1
                    ? "grid-cols-1"
                    : post.photo_urls.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2"
                }`}
              >
                {post.photo_urls.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className={`relative ${
                      post.photo_urls!.length === 3 && index === 0
                        ? "col-span-2"
                        : ""
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Reported litter photograph ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    {index === 3 && post.photo_urls!.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                        +{post.photo_urls!.length - 4} more
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-100">
              <button
                onClick={() => toggleLike(post.id, isLiked)}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">{post.likes_count}</span>
              </button>

              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
