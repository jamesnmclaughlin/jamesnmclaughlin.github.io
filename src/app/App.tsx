import { useState } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { Auth } from "../components/Auth";
import { LitterMap } from "../components/LitterMap";
import { ReportForm } from "../components/ReportForm";
import { BinReportForm } from "../components/BinReportForm";
import { SocialFeed } from "../components/SocialFeed";
import { CreatePost } from "../components/CreatePost";
import { UserProfile } from "../components/UserProfile";
import { Resources } from "../components/Resources";
import { Toaster } from "./components/ui/sonner";
import {
  MapPin,
  Users,
  BookOpen,
  User,
  Plus,
  LogOut,
  Menu,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "./components/ui/button";
import "./App.css";

type Tab = "map" | "feed" | "resources" | "profile";

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [showReportForm, setShowReportForm] = useState(false);
  const [showBinForm, setShowBinForm] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [reportLocation, setReportLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportMode, setReportMode] = useState<"litter" | "bin">("litter");

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  function handleMapClick(lat: number, lng: number) {
    setReportLocation({ lat, lng });
    if (reportMode === "litter") {
      setShowReportForm(true);
    } else {
      setShowBinForm(true);
    }
  }

  function handleReportSuccess() {
    setReportLocation(null);
  }

  const tabs = [
    { id: "map" as Tab, label: "Map", icon: MapPin },
    { id: "feed" as Tab, label: "Community", icon: Users },
    {
      id: "resources" as Tab,
      label: "Resources",
      icon: BookOpen,
    },
    { id: "profile" as Tab, label: "Profile", icon: User },
  ];

  return (
    <div className="size-full h-screen flex flex-col bg-gray-50 relative">
      {/* Header */}
      <header className="absolute top-0 z-1000 w-screen">
        {" "}
        {/*bg-linear-to-r from-green-600 to-blue-600 text-white shadow-lg */}
        <div className="px-4 py-3 glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 glass-effect rounded-3xl px-4 py-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Clean Streets UK</h1>
                <p className="text-xs text-black/80">
                  Welcome, {profile.username}!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Points Display */}
              <div className="hidden sm:flex items-center gap-2 glass-effect px-3 py-1.5 rounded-full">
                <span className="text-sm font-semibold">
                  {profile.points} pts
                </span>
                <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
                  Lv {profile.level}
                </span>
              </div>

              {/* Sign Out */}
              <Button
                onClick={() => signOut()}
                variant="outline"
                size="sm"
                className="hidden sm:flex glass-effect rounded-3xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 hover:bg-white/10 rounded-lg"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-effect">
                  <span className="text-sm font-semibold">
                    {profile.points} pts
                  </span>
                  <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
                    Lv {profile.level}
                  </span>
                </div>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === "map" && (
          <div className="size-full relative">
            {/* Report Mode Toggle */}
            <div className="absolute top-24 right-4 z-1000 bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <button
                onClick={() => setReportMode("litter")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                  reportMode === "litter"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Report Litter</span>
              </button>
              <button
                onClick={() => setReportMode("bin")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                  reportMode === "bin"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Mark Bin</span>
              </button>
            </div>

            <LitterMap
              onReportClick={handleMapClick}
              newReportLocation={reportLocation}
            />
          </div>
        )}

        {activeTab === "feed" && (
          <div className="size-full overflow-y-auto p-4  pt-24">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Community Feed</h2>
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
              <SocialFeed />
            </div>
          </div>
        )}

        {activeTab === "resources" && (
          <div className="size-full overflow-y-auto p-4  pt-24">
            <div className="max-w-4xl mx-auto">
              <Resources />
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="size-full overflow-y-auto p-4 pt-24">
            <div className="max-w-2xl mx-auto">
              <UserProfile />
            </div>
          </div>
        )}

        {/* Floating Action Button (Map only) */}
        {activeTab === "map" && (
          <div className="absolute bottom-6 right-6 z-500">
            <button
              onClick={() => {
                if (reportLocation) {
                  if (reportMode === "litter") {
                    setShowReportForm(true);
                  } else {
                    setShowBinForm(true);
                  }
                } else {
                  alert("Click on the map to select a location first");
                }
              }}
              className={`w-16 h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform ${
                reportMode === "litter"
                  ? "bg-linear-to-r from-green-500 to-blue-500"
                  : "bg-linear-to-r from-blue-500 to-purple-500"
              }`}
            >
              {reportMode === "litter" ? (
                <Plus className="w-8 h-8" />
              ) : (
                <Trash2 className="w-8 h-8" />
              )}
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showReportForm && reportLocation && (
        <ReportForm
          location={reportLocation}
          onClose={() => {
            setShowReportForm(false);
            setReportLocation(null);
          }}
          onSuccess={handleReportSuccess}
        />
      )}

      {showBinForm && reportLocation && (
        <BinReportForm
          location={reportLocation}
          onClose={() => {
            setShowBinForm(false);
            setReportLocation(null);
          }}
          onSuccess={handleReportSuccess}
        />
      )}

      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />

      <footer className="absolute bottom-0 z-1000 w-screen pb-8">
        {/* Tabs */}
        <div className="glass-effect rounded-3xl w-fit mx-auto">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-3xl font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-green-600 shadow-md"
                      : "text-black/80 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-6 h-6 lg:w-4 lg:h-4" />
                  <span className="hidden lg:block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
