export interface GeographicalSearchResult {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance_meters: number;
  category: string;
}

export interface SearchParameters {
  centerLat: number;
  centerLng: number;
  radiusMeters?: number;
}

/**
 * Search for businesses within a specified radius using API endpoint
 */
export async function searchBusinessesNearby(
  params: SearchParameters
): Promise<{
  data: GeographicalSearchResult[] | null;
  error: string | null;
}> {
  try {
    const { centerLat, centerLng, radiusMeters = 5000 } = params;

    // Call the API endpoint
    const response = await fetch("/api/geographical-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          centerLat,
          centerLng,
          radiusMeters,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: errorData.error || `HTTP error! status: ${response.status}`,
        };
    }

    const result = await response.json();
    return result;
  } catch (err: unknown) {
    console.error("Unexpected error during geographical search:", err);
    return {
        data: null,
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during search",
    };
  }
}

/**
 * Calculate distance between two points (fallback for client-side calculation)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
