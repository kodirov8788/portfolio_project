import { Business, Location, SearchConfig, SearchResponse } from "@/types";
import { allJapaneseBusinessData } from "@/mock-data/japanese-business-data";

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
}

interface GooglePlaceDetails {
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
}

class GoogleMapsService {
  private apiKey: string;
  private isMockMode: boolean;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
    this.isMockMode = !this.apiKey;

    if (this.isMockMode) {
        console.warn(
          "Google Maps API key not found. Running in mock mode for development."
        );
    }
  }

  /**
   * Search for businesses using Google Places API (New)
   */
  async searchBusinesses(
    config: SearchConfig,
    maxResults: number = 20
  ): Promise<SearchResponse> {
    // Always use mock data when API is disabled
    if (this.isMockMode) {
        return this.getMockBusinesses(config, maxResults);
    }

    try {
        const result = await this.callSearchAPI(config, maxResults);

        return {
          businesses: result.businesses,
          totalFound: result.businesses.length,
          nextPageToken: result.nextPageToken,
        };
    } catch (error) {
        console.error(
          "Error searching businesses with Google Places API:",
          error
        );
        return this.getMockBusinesses(config, maxResults);
    }
  }

  /**
   * Get Japanese businesses for development/testing
   */
  private getMockBusinesses(
    config: SearchConfig,
    maxResults: number
  ): SearchResponse {
    const { location, category } = config;

    // Filter businesses based on search criteria
    let filteredBusinesses = allJapaneseBusinessData;

    // Filter by prefecture if location is specified
    if (location && location.city) {
        const cityMap: { [key: string]: string } = {
          Tokyo: "東京都",
          Osaka: "大阪府",
          Hyogo: "兵庫県",
          Kobe: "神戸市",
        };

        const targetPrefecture = cityMap[location.city] || location.city;
        filteredBusinesses = filteredBusinesses.filter(
          (b) =>
            b.prefecture === targetPrefecture ||
            (b.prefecture && b.prefecture.includes(targetPrefecture)) ||
            targetPrefecture.includes(b.prefecture || "")
        );
    }

    // Filter by category if specified
    if (category && category !== "all") {
        filteredBusinesses = filteredBusinesses.filter(
          (b) =>
            b.category === category || (b.types && b.types.includes(category))
        );
    }

    // Shuffle and limit results
    const shuffled = [...filteredBusinesses].sort(() => Math.random() - 0.5);
    const limitedResults = shuffled.slice(0, maxResults);

    return {
        businesses: limitedResults,
        totalFound: filteredBusinesses.length,
        nextPageToken: undefined,
    };
  }

  /**
   * Get additional details for a specific place with concurrency limiting
   */
  private async getPlaceDetails(
    placeId: string,
    fields: string[] = ["websiteUri", "internationalPhoneNumber"]
  ): Promise<GooglePlaceDetails> {
    try {
        const baseUrl = `https://places.googleapis.com/v1/places/${placeId}`;

        const response = await fetch(baseUrl, {
          headers: {
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": fields.join(","),
          },
        });

        if (!response.ok) {
          console.warn(
            `Failed to get details for place ${placeId}: ${response.status}`
          );
          return {};
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`Failed to get details for place ${placeId}:`, error);
        return {};
    }
  }

  /**
   * Helper to make a single search request to Google Places API
   */
  private async callSearchAPI(
    config: SearchConfig,
    maxResults: number,
    pageToken?: string
  ): Promise<{
    businesses: Business[];
    nextPageToken?: string;
    hasMore: boolean;
  }> {
    const { location, category, radius, keywords } = config;

    // Get coordinates for the location if not provided
    let searchLocation = location;
    if (!location.coordinates) {
        try {
          const coordinates = await this.getLocationCoordinates();
          searchLocation = { ...location, coordinates };
        } catch (error) {
          console.warn(
            "Could not get coordinates for location, proceeding without location bias:",
            error
          );
        }
    }

    // Build query string with location context
    const locationString = this.buildLocationString(searchLocation);
    const query = `${this.buildSearchQuery(
        category,
        keywords
    )} in ${locationString}`;

    // Build the API URL for Places API (New)
    const baseUrl = "https://places.googleapis.com/v1/places:searchText";

    const requestBody: Record<string, unknown> = {
        textQuery: query,
        maxResultCount: Math.min(maxResults, 20), // Google API limit
        locationBias: searchLocation.coordinates
          ? {
              circle: {
                center: {
                  latitude: searchLocation.coordinates.lat,
                  longitude: searchLocation.coordinates.lng,
                },
                radius: radius * 1000, // Convert km to meters
              },
            }
          : undefined,
    };

    // Add page token if provided
    if (pageToken) {
        requestBody.pageToken = pageToken;
    }

    // Make the API request
    const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,nextPageToken",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Google Places API error: ${response.status} ${response.statusText} - ${
            errorData.error?.message || ""
          }`
        );
    }

    const data = await response.json();
    const places = data.places || [];

    // Get additional details for each place with concurrency limiting
    const businesses = await this.getBusinessesWithDetails(places, category);

    return {
        businesses,
        nextPageToken: data.nextPageToken || data.next_page_token,
        hasMore: !!(data.nextPageToken || data.next_page_token),
    };
  }

  /**
   * Get business details with concurrency limiting (max 5 concurrent requests)
   */
  private async getBusinessesWithDetails(
    places: GooglePlace[],
    category: string
  ): Promise<Business[]> {
    const concurrencyLimit = 5;
    const results: Business[] = [];

    // Process places in batches to limit concurrency
    for (let i = 0; i < places.length; i += concurrencyLimit) {
        const batch = places.slice(i, i + concurrencyLimit);

        const batchPromises = batch.map(async (place) => {
          try {
            const details = await this.getPlaceDetails(place.id);
            return this.transformPlaceToBusiness(place, details, category);
          } catch (error) {
            console.warn(`Failed to process place ${place.id}:`, error);
            // Return a basic business object without details
            return this.transformPlaceToBusiness(place, {}, category);
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }

    return results;
  }

  /**
   * Transform Google Places result to our Business interface
   */
  private transformPlaceToBusiness(
    place: GooglePlace,
    details: GooglePlaceDetails,
    category: string
  ): Business {
    return {
        id: place.id,
        name: place.displayName?.text || "Unknown",
        address: place.formattedAddress || "",
        phone: details.internationalPhoneNumber,
        website: details.websiteUri,
        rating: place.rating,
        reviews: place.userRatingCount,
        category,
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
        placeId: place.id,
    };
  }

  /**
   * Build location string for search
   */
  private buildLocationString(location: Location): string {
    const parts = [location.city];
    if (location.state) parts.push(location.state);
    parts.push(location.country);
    return parts.join(", ");
  }

  /**
   * Build search query string
   */
  private buildSearchQuery(category: string, keywords?: string): string {
    let query = category;
    if (keywords) {
        query = `${keywords} ${category}`;
    }
    return query;
  }

  /**
   * Get Google Places type from category
   */
  private getPlaceType(category: string): string | undefined {
    const categoryMap: { [key: string]: string } = {
        restaurant: "restaurant",
        cafe: "restaurant",
        bar: "bar",
        salon: "beauty_salon",
        spa: "spa",
        gym: "gym",
        dentist: "dentist",
        doctor: "doctor",
        lawyer: "lawyer",
        "real estate": "real_estate_agency",
        hotel: "lodging",
        retail: "store",
        shop: "store",
        "auto repair": "car_repair",
        plumber: "plumber",
        electrician: "electrician",
        contractor: "general_contractor",
    };

    return categoryMap[category.toLowerCase()];
  }

  async getLocationCoordinates(): Promise<{ lat: number; lng: number }> {
    // Return mock coordinates when API is disabled
    if (this.isMockMode) {
        console.warn("Geocoding API disabled - using mock coordinates");
        return { lat: 35.6762, lng: 139.6503 }; // Tokyo coordinates
    }

    // TODO: Implement real geocoding API call
    // For now, return mock coordinates
    return { lat: 35.6762, lng: 139.6503 };
  }

  /**
   * Search with pagination support
   */
  async searchBusinessesWithPagination(
    config: SearchConfig,
    maxResults: number
  ): Promise<Business[]> {
    const allBusinesses: Business[] = [];
    const seenPlaceIds = new Set<string>();
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = Math.min(3, Math.ceil(maxResults / 20));

    do {
        try {
          let response;
          if (!nextPageToken) {
            // First request
            response = await this.searchBusinesses(
              config,
              Math.min(20, maxResults)
            );
          } else {
            // Wait before using next page token (Google API requirement)
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Subsequent requests with nextPageToken
            const result = await this.callSearchAPI(config, 20, nextPageToken);
            response = {
              businesses: result.businesses,
              totalFound: result.businesses.length,
              nextPageToken: result.nextPageToken,
            };
          }

          // Deduplicate businesses by placeId
          const newBusinesses = response.businesses.filter(
            (business) => !seenPlaceIds.has(business.placeId || business.id)
          );

          // Add placeIds to seen set
          newBusinesses.forEach((business) => {
            seenPlaceIds.add(business.placeId || business.id);
          });

          allBusinesses.push(...newBusinesses);
          nextPageToken = response.nextPageToken;
          pageCount++;

          // Stop if we have enough results or no more pages
          if (allBusinesses.length >= maxResults || !nextPageToken) {
            break;
          }
        } catch (error) {
          console.error(`Error on page ${pageCount + 1}:`, error);
          // Continue with next page if possible, or break if first page failed
          if (pageCount === 0) {
            throw error;
          }
          break;
        }
    } while (nextPageToken && pageCount < maxPages);

    return allBusinesses.slice(0, maxResults);
  }

  /**
   * Search for businesses in multiple regions and aggregate results
   */
  async searchBusinessesMultiRegion(
    configs: SearchConfig[],
    maxResults: number
  ): Promise<Business[]> {
    const allBusinesses: Business[] = [];
    for (const config of configs) {
        const businesses = await this.searchBusinessesWithPagination(
          config,
          Math.min(maxResults, 60) // Google API max per region
        );
        allBusinesses.push(...businesses);
        if (allBusinesses.length >= maxResults) break;
    }
    return allBusinesses.slice(0, maxResults);
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
