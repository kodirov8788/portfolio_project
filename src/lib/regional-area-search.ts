import { Business, SearchConfig } from "@/types";
import { googleMapsService } from "./google-maps";
import { rateLimiter } from "./rate-limiter";

// Regional area definitions with coordinates
export interface RegionalArea {
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number; // in km
  priority: number; // 1 = highest priority (central areas)
}

// Search performance metrics
export interface SearchMetrics {
  totalAreas: number;
  areasSearched: number;
  totalBusinesses: number;
  searchTime: number; // in milliseconds
  averageTimePerArea: number;
  businessesPerMinute: number;
  apiCalls: number;
  errors: string[];
}

// Progress callback interface
export interface SearchProgress {
  currentArea: string;
  areasSearched: number;
  totalAreas: number;
  businessesFound: number;
  progress: number; // 0-100
  status: "searching" | "completed" | "error" | "cancelled";
  error?: string;
}

export interface RegionalAreaSearchResult {
  businesses: Business[];
  metrics: SearchMetrics;
  totalBusinesses: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Progress tracking for polling
interface SearchSession {
  id: string;
  progress: SearchProgress;
  result?: RegionalAreaSearchResult;
  startTime: number;
  lastUpdate: number;
}

class RegionalAreaSearchService {
  private regionalAreas: RegionalArea[] = [
    // Major Cities - High Priority
    {
        name: "Tokyo",
        coordinates: { lat: 35.6762, lng: 139.6503 },
        radius: 3,
        priority: 1,
    },
    {
        name: "Osaka",
        coordinates: { lat: 34.6937, lng: 135.5023 },
        radius: 3,
        priority: 1,
    },
    {
        name: "Kyoto",
        coordinates: { lat: 35.0116, lng: 135.7681 },
        radius: 3,
        priority: 1,
    },
    {
        name: "Yokohama",
        coordinates: { lat: 35.4437, lng: 139.638 },
        radius: 3,
        priority: 1,
    },
    {
        name: "Nagoya",
        coordinates: { lat: 35.1815, lng: 136.9066 },
        radius: 3,
        priority: 1,
    },
    {
        name: "Sapporo",
        coordinates: { lat: 43.0618, lng: 141.3545 },
        radius: 3,
        priority: 1,
    },

    // Tokyo Areas - High Priority
    {
        name: "Shibuya",
        coordinates: { lat: 35.6586, lng: 139.7016 },
        radius: 2,
        priority: 1,
    },
    {
        name: "Shinjuku",
        coordinates: { lat: 35.6895, lng: 139.6917 },
        radius: 2,
        priority: 1,
    },
    {
        name: "Ginza",
        coordinates: { lat: 35.6722, lng: 139.7673 },
        radius: 2,
        priority: 1,
    },
    {
        name: "Roppongi",
        coordinates: { lat: 35.6626, lng: 139.731 },
        radius: 2,
        priority: 1,
    },
    {
        name: "Harajuku",
        coordinates: { lat: 35.6702, lng: 139.7016 },
        radius: 1.5,
        priority: 1,
    },
    {
        name: "Omotesando",
        coordinates: { lat: 35.6654, lng: 139.712 },
        radius: 1.5,
        priority: 1,
    },

    // Major Business Districts - Medium Priority
    {
        name: "Marunouchi",
        coordinates: { lat: 35.6812, lng: 139.7671 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Akasaka",
        coordinates: { lat: 35.6654, lng: 139.732 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Ebisu",
        coordinates: { lat: 35.6467, lng: 139.71 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Meguro",
        coordinates: { lat: 35.6333, lng: 139.7167 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Nakameguro",
        coordinates: { lat: 35.6444, lng: 139.7033 },
        radius: 1.5,
        priority: 2,
    },
    {
        name: "Daikanyama",
        coordinates: { lat: 35.6483, lng: 139.7033 },
        radius: 1.5,
        priority: 2,
    },

    // Popular Areas - Medium Priority
    {
        name: "Asakusa",
        coordinates: { lat: 35.7148, lng: 139.7967 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Ueno",
        coordinates: { lat: 35.7142, lng: 139.7774 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Ikebukuro",
        coordinates: { lat: 35.7295, lng: 139.7109 },
        radius: 2,
        priority: 2,
    },
    {
        name: "Shibuya Station",
        coordinates: { lat: 35.6586, lng: 139.7016 },
        radius: 1.5,
        priority: 2,
    },
    {
        name: "Tokyo Station",
        coordinates: { lat: 35.6812, lng: 139.7671 },
        radius: 1.5,
        priority: 2,
    },

    // Other Major Japanese Cities - Medium Priority
    {
        name: "Fukuoka",
        coordinates: { lat: 33.5902, lng: 130.4017 },
        radius: 3,
        priority: 2,
    },
    {
        name: "Kobe",
        coordinates: { lat: 34.6901, lng: 135.1955 },
        radius: 3,
        priority: 2,
    },
    {
        name: "Hiroshima",
        coordinates: { lat: 34.3853, lng: 132.4553 },
        radius: 3,
        priority: 2,
    },
    {
        name: "Sendai",
        coordinates: { lat: 38.2688, lng: 140.8721 },
        radius: 3,
        priority: 2,
    },
    {
        name: "Chiba",
        coordinates: { lat: 35.6073, lng: 140.1065 },
        radius: 3,
        priority: 2,
    },

    // Residential/Commercial Mix - Lower Priority
    {
        name: "Setagaya",
        coordinates: { lat: 35.6467, lng: 139.6533 },
        radius: 3,
        priority: 3,
    },
    {
        name: "Suginami",
        coordinates: { lat: 35.6997, lng: 139.6367 },
        radius: 3,
        priority: 3,
    },
    {
        name: "Nakano",
        coordinates: { lat: 35.7075, lng: 139.6658 },
        radius: 2,
        priority: 3,
    },
    {
        name: "Koenji",
        coordinates: { lat: 35.7056, lng: 139.6494 },
        radius: 1.5,
        priority: 3,
    },
    {
        name: "Kichijoji",
        coordinates: { lat: 35.7022, lng: 139.5794 },
        radius: 2,
        priority: 3,
    },

    // Outer Areas - Lowest Priority
    {
        name: "Hachioji",
        coordinates: { lat: 35.6667, lng: 139.3167 },
        radius: 3,
        priority: 4,
    },
    {
        name: "Tachikawa",
        coordinates: { lat: 35.7289, lng: 139.4184 },
        radius: 3,
        priority: 4,
    },
    {
        name: "Machida",
        coordinates: { lat: 35.5404, lng: 139.4462 },
        radius: 3,
        priority: 4,
    },
    {
        name: "Kawasaki",
        coordinates: { lat: 35.5206, lng: 139.7172 },
        radius: 3,
        priority: 4,
    },
    {
        name: "Saitama",
        coordinates: { lat: 35.8616, lng: 139.6455 },
        radius: 3,
        priority: 4,
    },
  ];

  private searchCache: Map<
    string,
    {
        allBusinesses: Business[];
        metrics: SearchMetrics;
        timestamp: number;
    }
  > = new Map();

  private activeSessions: Map<string, SearchSession> = new Map();

  private getCacheKey(
    category: string,
    maxResults: number,
    timeLimit: number,
    keywords?: string
  ): string {
    const parts = [category, maxResults.toString(), timeLimit.toString()];
    if (keywords) {
        parts.push(keywords.toLowerCase().trim());
    }
    return parts.join("|");
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSearchProgress(searchId: string): SearchProgress | null {
    const session = this.activeSessions.get(searchId);
    if (!session) return null;

    // Update last access time
    session.lastUpdate = Date.now();
    return session.progress;
  }

  getSearchResult(searchId: string): RegionalAreaSearchResult | null {
    const session = this.activeSessions.get(searchId);
    if (!session || !session.result) return null;

    // Update last access time
    session.lastUpdate = Date.now();
    return session.result;
  }

  getPaginatedSearchResult(
    searchId: string,
    page: number = 1,
    pageSize: number = 20
  ): RegionalAreaSearchResult | null {
    const session = this.activeSessions.get(searchId);
    if (!session || !session.result) return null;

    // Update last access time
    session.lastUpdate = Date.now();

    // Get the full result and paginate it
    const fullResult = session.result;
    return this.paginateResults(
        fullResult.businesses,
        fullResult.metrics,
        page,
        pageSize
    );
  }

  stopSearch(searchId: string): boolean {
    const session = this.activeSessions.get(searchId);
    if (!session) return false;

    // Update session status to cancelled
    session.progress = {
        ...session.progress,
        status: "cancelled",
        progress: Math.min(session.progress.progress, 100),
    };
    session.lastUpdate = Date.now();

    console.log(`Search ${searchId} stopped by user`);
    return true;
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [id, session] of this.activeSessions.entries()) {
        if (now - session.lastUpdate > maxAge) {
          this.activeSessions.delete(id);
        }
    }
  }

  async startSearch(
    category: string,
    maxResults: number = 100,
    keywords?: string,
    specificArea?: string
  ): Promise<string> {
    this.cleanupOldSessions();

    const searchId = this.generateSearchId();

    // Create initial session
    const session: SearchSession = {
        id: searchId,
        progress: {
          currentArea: "Initializing...",
          areasSearched: 0,
          totalAreas: 1, // Always 1 for single area search
          businessesFound: 0,
          progress: 0,
          status: "searching",
        },
        startTime: Date.now(),
        lastUpdate: Date.now(),
    };

    this.activeSessions.set(searchId, session);

    // Start the search in the background
    this.performSearch(searchId, category, maxResults, keywords, specificArea);

    return searchId;
  }

  private async performSearch(
    searchId: string,
    category: string,
    maxResults: number,
    keywords?: string,
    specificArea?: string
  ): Promise<void> {
    try {
        const session = this.activeSessions.get(searchId);
        if (!session) return;

        let result: RegionalAreaSearchResult;

        if (specificArea) {
          result = await this.searchSpecificAreaWithProgress(
            searchId,
            specificArea,
            category,
            maxResults,
            keywords
          );
        } else {
          result = await this.searchAllRegionalAreasWithProgress(
            searchId,
            category,
            maxResults,
            keywords
          );
        }

        // Store the full result without pagination
        const fullResult = {
          businesses: result.businesses,
          metrics: result.metrics,
          totalBusinesses: result.totalBusinesses,
          // Store pagination info for the first page
          page: 1,
          pageSize: result.businesses.length,
          totalPages: 1,
        };

        // Update session with full result
        session.result = fullResult;
        session.progress = {
          ...session.progress,
          status: "completed",
          progress: 100,
          businessesFound: result.totalBusinesses,
        };
        session.lastUpdate = Date.now();
    } catch (error) {
        const session = this.activeSessions.get(searchId);
        if (session) {
          session.progress = {
            ...session.progress,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          session.lastUpdate = Date.now();
        }
    }
  }

  private async searchAllRegionalAreasWithProgress(
    searchId: string,
    category: string,
    maxResults: number,
    keywords?: string
  ): Promise<RegionalAreaSearchResult> {
    const session = this.activeSessions.get(searchId);
    if (!session) {
        throw new Error("Search session not found");
    }

    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;

    // Sort areas by priority
    const sortedAreas = [...this.regionalAreas].sort(
        (a, b) => a.priority - b.priority
    );
    const totalAreas = sortedAreas.length;

    for (let i = 0; i < sortedAreas.length; i++) {
        const area = sortedAreas[i];
        const elapsed = Date.now() - startTime;

        // Check if we've exceeded the time limit
        if (elapsed >= 60000) {
          // 1 minute default time limit for deep search
          console.log(`Time limit reached after ${elapsed}ms, stopping search`);
          break;
        }

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress
        session.progress = {
          currentArea: area.name,
          areasSearched: i,
          totalAreas,
          businessesFound: allBusinesses.length,
          progress: Math.round((i / totalAreas) * 100),
          status: "searching",
        };
        session.lastUpdate = Date.now();

        try {
          // Calculate remaining time for this area
          const remainingTime = 60000 - elapsed; // 1 minute remaining
          const timePerArea = Math.max(remainingTime / (totalAreas - i), 5000); // At least 5 seconds per area

          console.log(
            `Searching area: ${area.name} (${timePerArea}ms remaining)`
          );

          const areaBusinesses = await this.searchAreaWithTimeLimit(
            area,
            category,
            maxResults - allBusinesses.length,
            timePerArea,
            keywords
          );

          allBusinesses.push(...areaBusinesses);
          apiCalls++;

          // Rate limiting
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
    }

    // Remove duplicates
    const uniqueBusinesses = this.removeDuplicates(allBusinesses);
    const searchTime = Date.now() - startTime;

    const metrics: SearchMetrics = {
        totalAreas,
        areasSearched: Math.min(sortedAreas.length, totalAreas),
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerArea: searchTime / Math.min(sortedAreas.length, totalAreas),
        businessesPerMinute: (uniqueBusinesses.length / searchTime) * 60000,
        apiCalls,
        errors,
    };

    return {
        businesses: uniqueBusinesses,
        metrics,
        totalBusinesses: uniqueBusinesses.length,
        page: 1,
        pageSize: uniqueBusinesses.length,
        totalPages: 1,
    };
  }

  private async searchSpecificAreaWithProgress(
    searchId: string,
    areaName: string,
    category: string,
    maxResults: number,
    keywords?: string
  ): Promise<RegionalAreaSearchResult> {
    const session = this.activeSessions.get(searchId);
    if (!session) {
        throw new Error("Search session not found");
    }

    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;

    // Find area by name
    const areaToSearch = this.regionalAreas.find((area) =>
        area.name.toLowerCase().includes(areaName.toLowerCase())
    );

    if (!areaToSearch) {
        throw new Error(`Area not found matching: ${areaName}`);
    }

    const totalAreas = 1; // Always 1 for single area search

    // Update progress
    session.progress = {
        currentArea: areaToSearch.name,
        areasSearched: 0,
        totalAreas,
        businessesFound: allBusinesses.length,
        progress: 0,
        status: "searching",
    };
    session.lastUpdate = Date.now();

    try {
        console.log(`Starting deep search for area: ${areaToSearch.name}`);

        // Perform deep search for the single area
        const areaBusinesses = await this.deepSearchArea(
          areaToSearch,
          category,
          maxResults,
          keywords,
          (progress) => {
            // Update progress during deep search
            session.progress = {
              currentArea: areaToSearch.name,
              areasSearched: 0,
              totalAreas,
              businessesFound: progress.businessesFound,
              progress: progress.progress,
              status: "searching",
            };
            session.lastUpdate = Date.now();
          },
          searchId
        );

        allBusinesses.push(...areaBusinesses);
        apiCalls++;
    } catch (error) {
        const errorMsg = `Error searching ${areaToSearch.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(errorMsg);
        errors.push(errorMsg);
    }

    // Remove duplicates
    const uniqueBusinesses = this.removeDuplicates(allBusinesses);
    const searchTime = Date.now() - startTime;

    const metrics: SearchMetrics = {
        totalAreas,
        areasSearched: totalAreas,
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerArea: searchTime / totalAreas,
        businessesPerMinute: (uniqueBusinesses.length / searchTime) * 60000,
        apiCalls,
        errors,
    };

    return {
        businesses: uniqueBusinesses,
        metrics,
        totalBusinesses: uniqueBusinesses.length,
        page: 1,
        pageSize: uniqueBusinesses.length,
        totalPages: 1,
    };
  }

  private async deepSearchArea(
    area: RegionalArea,
    category: string,
    maxResults: number,
    keywords?: string,
    onProgress?: (progress: {
        businessesFound: number;
        progress: number;
    }) => void,
    searchId?: string
  ): Promise<Business[]> {
    const businesses: Business[] = [];
    let pageToken: string | undefined;
    const maxPages = 20; // Limit to prevent infinite loops
    let currentPage = 0;

    do {
        currentPage++;

        // Check if search was cancelled
        if (searchId) {
          const session = this.activeSessions.get(searchId);
          if (session && session.progress.status === "cancelled") {
            console.log(`Search ${searchId} was cancelled, stopping deep search`);
            break;
          }
        }

        try {
          console.log(
            `Deep searching ${area.name} - Page ${currentPage}, Found: ${businesses.length}`
          );

          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: Math.min(area.radius, 50), // Keep in km, max 50km
            maxResults: Math.min(20, maxResults - businesses.length), // 20 per page
            keywords,
          };

          const result = await googleMapsService.searchBusinesses(searchConfig);
          businesses.push(...result.businesses);

          // Update progress
          if (onProgress) {
            onProgress({
              businessesFound: businesses.length,
              progress: Math.min((businesses.length / maxResults) * 100, 100),
            });
          }

          // Get next page token from response
          pageToken = result.nextPageToken;

          // Rate limiting
          await rateLimiter.waitForDelay();

          // Check if we've reached max results or pages
          if (businesses.length >= maxResults || currentPage >= maxPages) {
            console.log(
              `Deep search completed for ${area.name}: ${businesses.length} businesses found`
            );
            break;
          }

          // If no next page token, we've reached the end
          if (!pageToken) {
            console.log(`No more pages available for ${area.name}`);
            break;
          }
        } catch (error) {
          const errorMsg = `Error on page ${currentPage} for ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          break; // Stop on error
        }
    } while (
        pageToken &&
        businesses.length < maxResults &&
        currentPage < maxPages
    );

    return businesses;
  }

  async searchAllRegionalAreas(
    category: string,
    maxResults: number = 100,
    timeLimit: number = 60000, // 1 minute default
    keywords?: string,
    page: number = 1,
    pageSize: number = 20,
    onProgress?: (progress: SearchProgress) => void
  ): Promise<RegionalAreaSearchResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(
        category,
        maxResults,
        timeLimit,
        keywords
    );
    const cached = this.searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        // 30 minutes cache
        console.log("Returning cached regional search results");
        return this.paginateResults(
          cached.allBusinesses,
          cached.metrics,
          page,
          pageSize
        );
    }

    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;

    // Sort areas by priority
    const sortedAreas = [...this.regionalAreas].sort(
        (a, b) => a.priority - b.priority
    );
    const totalAreas = sortedAreas.length;

    for (let i = 0; i < sortedAreas.length; i++) {
        const area = sortedAreas[i];
        const elapsed = Date.now() - startTime;

        // Check if we've exceeded the time limit
        if (elapsed >= timeLimit) {
          console.log(`Time limit reached after ${elapsed}ms, stopping search`);
          break;
        }

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress
        if (onProgress) {
          onProgress({
            currentArea: area.name,
            areasSearched: i,
            totalAreas,
            businessesFound: allBusinesses.length,
            progress: Math.round((i / totalAreas) * 100),
            status: "searching",
          });
        }

        try {
          // Calculate remaining time for this area
          const remainingTime = timeLimit - elapsed;
          const timePerArea = Math.max(remainingTime / (totalAreas - i), 5000); // At least 5 seconds per area

          console.log(
            `Searching area: ${area.name} (${timePerArea}ms remaining)`
          );

          const areaBusinesses = await this.searchAreaWithTimeLimit(
            area,
            category,
            maxResults - allBusinesses.length,
            timePerArea,
            keywords
          );

          allBusinesses.push(...areaBusinesses);
          apiCalls++;

          // Rate limiting
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
    }

    // Remove duplicates
    const uniqueBusinesses = this.removeDuplicates(allBusinesses);
    const searchTime = Date.now() - startTime;

    const metrics: SearchMetrics = {
        totalAreas,
        areasSearched: Math.min(sortedAreas.length, totalAreas),
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerArea: searchTime / Math.min(sortedAreas.length, totalAreas),
        businessesPerMinute: (uniqueBusinesses.length / searchTime) * 60000,
        apiCalls,
        errors,
    };

    // Cache the results
    this.searchCache.set(cacheKey, {
        allBusinesses: uniqueBusinesses,
        metrics,
        timestamp: Date.now(),
    });

    return this.paginateResults(uniqueBusinesses, metrics, page, pageSize);
  }

  async searchSpecificAreas(
    areaNames: string[],
    category: string,
    maxResults: number = 100,
    keywords?: string,
    page: number = 1,
    pageSize: number = 20,
    onProgress?: (progress: SearchProgress) => void
  ): Promise<RegionalAreaSearchResult> {
    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;

    // Find areas by name
    const areasToSearch = this.regionalAreas.filter((area) =>
        areaNames.some(
          (name) =>
            area.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(area.name.toLowerCase())
        )
    );

    if (areasToSearch.length === 0) {
        throw new Error(`No areas found matching: ${areaNames.join(", ")}`);
    }

    const totalAreas = areasToSearch.length;

    for (let i = 0; i < areasToSearch.length; i++) {
        const area = areasToSearch[i];

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress
        if (onProgress) {
          onProgress({
            currentArea: area.name,
            areasSearched: i,
            totalAreas,
            businessesFound: allBusinesses.length,
            progress: Math.round((i / totalAreas) * 100),
            status: "searching",
          });
        }

        try {
          console.log(`Searching specific area: ${area.name}`);

          const areaBusinesses = await googleMapsService.searchBusinesses({
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: Math.min(area.radius, 50), // Keep in km, max 50km
            maxResults: maxResults - allBusinesses.length,
            keywords,
          });

          allBusinesses.push(...areaBusinesses.businesses);
          apiCalls++;

          // Rate limiting
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
    }

    // Remove duplicates
    const uniqueBusinesses = this.removeDuplicates(allBusinesses);
    const searchTime = Date.now() - startTime;

    const metrics: SearchMetrics = {
        totalAreas,
        areasSearched: areasToSearch.length,
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerArea: searchTime / areasToSearch.length,
        businessesPerMinute: (uniqueBusinesses.length / searchTime) * 60000,
        apiCalls,
        errors,
    };

    return this.paginateResults(uniqueBusinesses, metrics, page, pageSize);
  }

  private paginateResults(
    allBusinesses: Business[],
    metrics: SearchMetrics,
    page: number,
    pageSize: number
  ): RegionalAreaSearchResult {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBusinesses = allBusinesses.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allBusinesses.length / pageSize);

    return {
        businesses: paginatedBusinesses,
        metrics,
        totalBusinesses: allBusinesses.length,
        page,
        pageSize,
        totalPages,
    };
  }

  clearCache(): void {
    this.searchCache.clear();
    console.log("Regional search cache cleared");
  }

  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.searchCache.entries()).map(
        ([key, value]) => ({
          key,
          age: now - value.timestamp,
        })
    );

    return {
        size: this.searchCache.size,
        entries: entries.sort((a, b) => b.age - a.age), // Sort by age, newest first
    };
  }

  getAvailableAreas(): RegionalArea[] {
    return [...this.regionalAreas];
  }

  getAreaStats(): {
    totalAreas: number;
    byPriority: Record<number, number>;
    totalRadius: number;
  } {
    const byPriority: Record<number, number> = {};
    let totalRadius = 0;

    for (const area of this.regionalAreas) {
        byPriority[area.priority] = (byPriority[area.priority] || 0) + 1;
        totalRadius += area.radius;
    }

    return {
        totalAreas: this.regionalAreas.length,
        byPriority,
        totalRadius,
    };
  }

  private removeDuplicates(businesses: Business[]): Business[] {
    const seen = new Set<string>();
    return businesses.filter((business) => {
        const key = `${business.name}-${business.address}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
    });
  }

  private async searchAreaWithTimeLimit(
    area: RegionalArea,
    category: string,
    maxResults: number,
    timeLimit: number,
    keywords?: string
  ): Promise<Business[]> {
    const startTime = Date.now();
    const businesses: Business[] = [];

    do {
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeLimit) {
          console.log(
            `Time limit reached for area ${area.name} after ${elapsed}ms`
          );
          break;
        }

        if (businesses.length >= maxResults) {
          console.log(
            `Max results reached for area ${area.name} (${maxResults})`
          );
          break;
        }

        try {
          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: Math.min(area.radius, 50), // Keep in km, max 50km
            maxResults: maxResults - businesses.length,
            keywords,
          };
          const result = await googleMapsService.searchBusinesses(searchConfig);
          businesses.push(...result.businesses);
          // apiCalls++; // This line was removed as per the edit hint
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          // errors.push(errorMsg); // This line was removed as per the edit hint
        }
    } while (businesses.length < maxResults);

    return businesses;
  }
}

export const regionalAreaSearchService = new RegionalAreaSearchService();
