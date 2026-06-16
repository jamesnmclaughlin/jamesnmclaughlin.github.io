import { type LatLng, latLngBounds, routing } from "leaflet";
import "leaflet-routing-machine";
import { useEffect, type FC } from "react";
import { useMap } from "react-leaflet";
import "./RoutingMachine.css";

// Create provider
// Set latlngs via provider?
// Use context for layer?

const Routing: FC<{
  points: LatLng[];
  bounds: [latitude: number, longitude: number][];
}> = ({ points, bounds }) => {
  const map = useMap();
  let markerBounds = latLngBounds([]);

  useEffect(() => {
    if (!map) return;

    const routingControl = routing
      .control({
        waypoints: points,
        addWaypoints: false,
        fitSelectedRoutes: false,
      })
      .addTo(map);

    if (bounds?.length > 0) {
      bounds.forEach((marker) => {
        markerBounds.extend(marker);
      });
      map.fitBounds(markerBounds);
    }

    return () => {
      map.removeControl(routingControl);
    };
  }, [points, map, bounds]);

  return null;
};

export default Routing;
