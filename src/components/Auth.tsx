import { useState, type SubmitEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../app/components/ui/button";
import { Loader2, Sparkles, MapPin } from "lucide-react";
import { toast } from "sonner";
import { geocodeUKPostcode } from "../lib/supabase";

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (username.length < 3) {
          toast.error("Username must be at least 3 characters");
          setLoading(false);
          return;
        }

        // Geocode location if provided
        let location = null;
        if (locationArea.trim()) {
          location = await geocodeUKPostcode(locationArea);
          if (!location) {
            toast.error("Could not find location. Please check your postcode.");
            setLoading(false);
            return;
          }
        }

        await signUp(
          email,
          password,
          username,
          locationArea.trim() || undefined,
          location,
        );
        toast.success("Account created! Please check your email to verify.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <MapPin className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Clean Streets UK
          </h1>
          <p className="text-white/90 text-lg">
            Join the community keeping Britain tidy
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isSignUp
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-green-500 text-white shadow-md"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isSignUp
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label
                    htmlFor="usernameInput"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="usernameInput"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Choose a username"
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label
                    htmlFor="locationInput"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Area (Optional)
                  </label>
                  <input
                    id="locationInput"
                    type="text"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="e.g., SW1, Manchester, Birmingham"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This helps set your initial map location
                  </p>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="emailInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="emailInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="passwordInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="passwordInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isSignUp ? "Create Account" : "Sign In"}
                </>
              )}
            </Button>
          </form>

          {isSignUp && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                🎁 New User Bonus
              </h4>
              <p className="text-sm text-green-800">
                Get 50 bonus points for your first litter report!
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-white">
          <div>
            <div className="text-3xl mb-2">📍</div>
            <p className="text-sm font-medium">Report Litter</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-sm font-medium">Earn Rewards</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🌍</div>
            <p className="text-sm font-medium">Clean Streets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
