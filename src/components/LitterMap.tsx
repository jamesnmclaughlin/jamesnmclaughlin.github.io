import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L, { LatLng } from "leaflet";
import { supabase, type BinReport, type LitterReport } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import Routing from "./RoutingMachine";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LitterMapProps {
  onReportClick: (lat: number, lng: number) => void;
  newReportLocation?: { lat: number; lng: number } | null;
}

export function LitterMap({
  onReportClick,
  newReportLocation,
}: Readonly<LitterMapProps>) {
  const [reports, setReports] = useState<LitterReport[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [bins, setBins] = useState<BinReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const [navigateToPoint, setNavigateToPoint] = useState<LatLng>();

  // Use user's preferred location if available, otherwise default to London, UK
  const [center] = useState<[number, number]>(() => {
    if (profile?.location_lat && profile?.location_lng) {
      return [profile.location_lat, profile.location_lng];
    }
    return [51.5074, -0.1278]; // London default
  });

  useEffect(() => {
    fetchReports();
    fetchBins();

    // Subscribe to real-time updates
    const reportsSub = supabase
      .channel("litter_reports_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "litter_reports" },
        () => {
          fetchReports();
        },
      )
      .subscribe();

    const binsSub = supabase
      .channel("bin_reports_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bin_reports" },
        () => {
          fetchBins();
        },
      )
      .subscribe();

    // Watch user's current position
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting current position:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        },
      );
      setWatchId(id);
    }

    return () => {
      reportsSub.unsubscribe();
      binsSub.unsubscribe();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from("litter_reports")
        .select(
          `
          *,
          profiles!litter_reports_user_id_fkey(username)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBins() {
    try {
      const { data, error } = await supabase
        .from("bin_reports")
        .select(
          `
          *,
          profiles!bin_reports_user_id_fkey(username)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBins(data || []);
    } catch (error) {
      console.error("Error fetching bin reports:", error);
    }
  }

  async function markAsCleared(reportId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("litter_reports")
        .update({
          status: "cleared",
          cleared_by: user.id,
          cleared_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      // Award points for cleanup
      const report = reports.find((r) => r.id === reportId);
      if (report) {
        const points = report.is_hazardous ? 50 : 25;
        await supabase.rpc("award_points", {
          user_uuid: user.id,
          points_to_add: points,
        });

        // Update cleanup count
        await supabase.rpc("increment_cleanups_count", {
          user_uuid: user.id,
        });
      }

      fetchReports();
    } catch (error) {
      console.error("Error marking as cleared:", error);
    }
  }

  async function confirmReport(reportId: string) {
    if (!user) return;

    try {
      // Check if already confirmed
      const { data: existing } = await supabase
        .from("report_confirmations")
        .select("id")
        .eq("report_id", reportId)
        .eq("user_id", user.id)
        .single();

      if (existing) return; // Already confirmed

      // Add confirmation
      const { error: confirmError } = await supabase
        .from("report_confirmations")
        .insert({ report_id: reportId, user_id: user.id });

      if (confirmError) throw confirmError;

      // Increment report count
      const { error: updateError } = await supabase.rpc(
        "increment_report_count",
        { report_id: reportId },
      );

      if (updateError) throw updateError;

      // Award points
      await supabase.rpc("award_points", {
        user_uuid: user.id,
        points_to_add: 5,
      });

      fetchReports();
    } catch (error) {
      console.error("Error confirming report:", error);
    }
  }

  async function updateBinStatus(
    binId: string,
    newStatus: "available" | "full" | "missing" | "damaged",
  ) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("bin_reports")
        .update({ status: newStatus })
        .eq("id", binId);

      if (error) throw error;

      fetchBins();
    } catch (error) {
      console.error("Error updating bin status:", error);
    }
  }

  // Create custom icons based on report severity
  const createCustomIcon = (report: LitterReport, isOwnReport: boolean) => {
    // User's own reports are smaller and more subtle
    const baseSize = isOwnReport ? 20 : 25;
    const size = Math.min(
      baseSize + report.report_count * (isOwnReport ? 2 : 3),
      isOwnReport ? 35 : 50,
    );
    const opacity = isOwnReport ? 0.5 : 1;

    const color = report.is_hazardous
      ? "#ef4444"
      : report.status === "cleared"
        ? "#22c55e"
        : "#f59e0b";

    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${isOwnReport ? "2px" : "3px"} solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px ${isOwnReport ? "4px" : "8px"} rgba(0,0,0,${isOwnReport ? "0.15" : "0.3"});
        font-size: ${Math.max(10, size / 3)}px;
        color: white;
        font-weight: bold;
        opacity: ${opacity};
      ">${report.report_count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Create bin icons based on status
  const createBinIcon = (bin: BinReport) => {
    const size = 30;
    const color =
      bin.status === "available"
        ? "#3b82f6"
        : bin.status === "full"
          ? "#f59e0b"
          : bin.status === "missing"
            ? "#ef4444"
            : "#6b7280";

    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">🗑️</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  };

  const directions: LatLng[] | undefined = useMemo(() => {
    if (!navigateToPoint) return;

    let start = new LatLng(center[0], center[1]);

    if (currentPosition)
      start = new LatLng(currentPosition.lat, currentPosition.lng);

    return [start, navigateToPoint];
  }, [navigateToPoint, center, currentPosition]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-black/20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full"
        style={{ background: "#f0f0f0" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {directions !== undefined && (
          <Routing
            points={directions}
            bounds={[
              [51.486898, -3.204137],
              [51.4816546, -3.1791934],
            ]}
          />
        )}

        <MapClickHandler onMapClick={onReportClick} />

        <MarkerClusterGroup
          maxClusterRadius={(zoom: number) => (zoom > 5 ? 10 : 60)}
        >
          {/* Existing reports */}
          {reports.map((report) => {
            const isOwnReport = report.user_id === user?.id;

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createCustomIcon(report, !!isOwnReport)}
              >
                <Popup>
                  <div className="p-2 min-w-62.5">
                    <div className="flex items-start gap-2 mb-2">
                      {report.is_hazardous && (
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      {report.status === "cleared" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">
                          {report.size_category.charAt(0).toUpperCase() +
                            report.size_category.slice(1)}{" "}
                          litter
                        </p>
                        <p className="text-sm text-gray-600">
                          Reported by {report.profiles?.username || "Anonymous"}
                        </p>
                      </div>
                    </div>

                    {report.description && (
                      <p className="text-sm mb-2">{report.description}</p>
                    )}

                    <div>
                      {report.photo_urls?.map((url: string) => (
                        <img src={url} />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {report.materials.map((material) => (
                        <span
                          key={material}
                          className="px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {material}
                        </span>
                      ))}
                    </div>

                    {report.is_hazardous && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                        <p className="text-xs text-red-800 font-semibold">
                          ⚠️ Hazardous Material
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Do not attempt to clean. Report to council.
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mb-2">
                      {report.report_count}{" "}
                      {report.report_count === 1 ? "report" : "reports"}
                    </p>

                    {user && report.status !== "cleared" && (
                      <div className="flex gap-2">
                        {report.user_id !== user.id && (
                          <button
                            onClick={() => confirmReport(report.id)}
                            className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Confirm (+5pts)
                          </button>
                        )}
                        {!report.is_hazardous && (
                          <button
                            onClick={() => markAsCleared(report.id)}
                            className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Cleared (+25pts)
                          </button>
                        )}
                      </div>
                    )}

                    {report.status === "cleared" && report.cleared_at && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ Cleared on{" "}
                        {new Date(report.cleared_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Bin reports */}
          {bins.map((bin) => (
            <Marker
              key={bin.id}
              position={[bin.latitude, bin.longitude]}
              icon={createBinIcon(bin)}
            >
              <Popup>
                <div className="p-2 min-w-62.5">
                  <div className="flex items-start gap-2 mb-2">
                    <Trash2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">Public Bin</p>
                      <p className="text-sm text-gray-600">
                        Marked by{" "}
                        {bin.profiles?.username === profile?.username ? (
                          <strong>You</strong>
                        ) : (
                          bin.profiles?.username || "Anonymous"
                        )}
                      </p>
                    </div>
                  </div>

                  {bin.description && (
                    <p className="text-sm mb-2">{bin.description}</p>
                  )}

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Bin Types:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bin.bin_types.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Status:
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        bin.status === "available"
                          ? "bg-green-100 text-green-700"
                          : bin.status === "full"
                            ? "bg-orange-100 text-orange-700"
                            : bin.status === "missing"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {bin.status.charAt(0).toUpperCase() + bin.status.slice(1)}
                    </span>
                  </div>

                  {user && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">
                        Update Status:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateBinStatus(bin.id, "available")}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          disabled={bin.status === "available"}
                        >
                          Available
                        </button>
                        <button
                          onClick={() => updateBinStatus(bin.id, "full")}
                          className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                          disabled={bin.status === "full"}
                        >
                          Full
                        </button>
                        <button
                          onClick={() => updateBinStatus(bin.id, "missing")}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          disabled={bin.status === "missing"}
                        >
                          Missing
                        </button>
                        <button
                          onClick={() => updateBinStatus(bin.id, "damaged")}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                          disabled={bin.status === "damaged"}
                        >
                          Damaged
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setNavigateToPoint(
                            new LatLng(bin.latitude, bin.longitude),
                          )
                        }
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        disabled={bin.status === "damaged"}
                      >
                        Directions
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* New report location marker */}
          {newReportLocation && (
            <Marker
              position={[newReportLocation.lat, newReportLocation.lng]}
              icon={L.divIcon({
                className: "custom-marker",
                html: `<div style="
                width: 30px;
                height: 30px;
                background-color: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                animation: pulse 2s infinite;
              "></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              })}
            />
          )}
        </MarkerClusterGroup>

        {/* Current position marker */}
        {currentPosition && (
          <Marker
            position={[currentPosition.lat, currentPosition.lng]}
            icon={L.divIcon({
              className: "custom-marker",
              html: `<div style="position: relative;">
                <div style="
                  width: 20px;
                  height: 20px;
                  margin: auto;
                  background-color: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                "></div>
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 50px;
                  height: 50px;
                  background-color: rgba(59, 130, 246, 0.2);
                  border: 2px solid rgba(59, 130, 246, 0.4);
                  border-radius: 50%;
                  animation: pulse 2s infinite;
                "></div>
              </div>`,
              iconSize: [50, 50],
              iconAnchor: [25, 25],
            })}
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-blue-600">
                  Your Current Location
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {currentPosition.lat.toFixed(6)},{" "}
                  {currentPosition.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
