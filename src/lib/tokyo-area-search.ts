import { Business, SearchConfig } from "@/types";
import { googleMapsService } from "./google-maps";
import { rateLimiter } from "./rate-limiter";

// Tokyo area definitions with coordinates
export interface TokyoArea {
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

export interface TokyoAreaSearchResult {
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
  result?: TokyoAreaSearchResult;
  startTime: number;
  lastUpdate: number;
}

class TokyoAreaSearchService {
  private tokyoAreas: TokyoArea[] = [
    // Central Tokyo - High Priority
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
        coordinates: { lat: 35.7139, lng: 139.4078 },
        radius: 2,
        priority: 4,
    },
    {
        name: "Machida",
        coordinates: { lat: 35.54, lng: 139.4467 },
        radius: 2,
        priority: 4,
    },
    {
        name: "Fuchu",
        coordinates: { lat: 35.6689, lng: 139.4778 },
        radius: 2,
        priority: 4,
    },
  ];

  // Cache for storing search results
  private searchCache: Map<
    string,
    {
        allBusinesses: Business[];
        metrics: SearchMetrics;
        timestamp: number;
    }
  > = new Map();

  // Active search sessions for progress tracking
  private activeSessions: Map<string, SearchSession> = new Map();

  /**
   * Generate cache key for search parameters
   */
  private getCacheKey(
    category: string,
    maxResults: number,
    timeLimit: number,
    keywords?: string
  ): string {
    return `${category}-${maxResults}-${timeLimit}-${
        keywords || "no-keywords"
    }`;
  }

  /**
   * Generate unique search session ID
   */
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get search progress by session ID
   */
  getSearchProgress(searchId: string): SearchProgress | null {
    const session = this.activeSessions.get(searchId);
    if (!session) return null;

    return session.progress;
  }

  /**
   * Get search result by session ID
   */
  getSearchResult(searchId: string): TokyoAreaSearchResult | null {
    const session = this.activeSessions.get(searchId);
    if (!session || !session.result) return null;

    return session.result;
  }

  /**
   * Clean up old sessions (older than 10 minutes)
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    for (const [searchId, session] of this.activeSessions.entries()) {
        if (session.lastUpdate < tenMinutesAgo) {
          this.activeSessions.delete(searchId);
        }
    }
  }

  /**
   * Start a new search session and return the search ID
   */
  async startSearch(
    category: string,
    maxResults: number = 100,
    timeLimit: number = 60000,
    keywords?: string,
    specificAreas?: string[]
  ): Promise<string> {
    // Clean up old sessions
    this.cleanupOldSessions();

    const searchId = this.generateSearchId();
    const totalAreas = specificAreas
        ? specificAreas.length
        : this.tokyoAreas.length;

    // Initialize session
    const session: SearchSession = {
        id: searchId,
        progress: {
          currentArea: "Initializing...",
          areasSearched: 0,
          totalAreas,
          businessesFound: 0,
          progress: 0,
          status: "searching",
        },
        startTime: Date.now(),
        lastUpdate: Date.now(),
    };

    this.activeSessions.set(searchId, session);

    // Start the search in the background
    this.performSearch(
        searchId,
        category,
        maxResults,
        timeLimit,
        keywords,
        specificAreas
    );

    return searchId;
  }

  /**
   * Perform the actual search in the background
   */
  private async performSearch(
    searchId: string,
    category: string,
    maxResults: number,
    timeLimit: number,
    keywords?: string,
    specificAreas?: string[]
  ): Promise<void> {
    const session = this.activeSessions.get(searchId);
    if (!session) return;

    try {
        let result: TokyoAreaSearchResult;

        if (specificAreas && specificAreas.length > 0) {
          result = await this.searchSpecificAreasWithProgress(
            searchId,
            specificAreas,
            category,
            maxResults,
            keywords
          );
        } else {
          result = await this.searchAllTokyoAreasWithProgress(
            searchId,
            category,
            maxResults,
            timeLimit,
            keywords
          );
        }

        // Update session with result
        session.result = result;
        session.progress = {
          currentArea: "Complete",
          areasSearched: result.metrics.areasSearched,
          totalAreas: result.metrics.totalAreas,
          businessesFound: result.totalBusinesses,
          progress: 100,
          status: "completed",
        };
        session.lastUpdate = Date.now();
    } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        session.progress = {
          currentArea: "Error",
          areasSearched: 0,
          totalAreas: 0,
          businessesFound: 0,
          progress: 0,
          status: "error",
          error: errorMessage,
        };
        session.lastUpdate = Date.now();
    }
  }

  /**
   * Search all Tokyo areas with progress tracking
   */
  private async searchAllTokyoAreasWithProgress(
    searchId: string,
    category: string,
    maxResults: number,
    timeLimit: number,
    keywords?: string
  ): Promise<TokyoAreaSearchResult> {
    const session = this.activeSessions.get(searchId);
    if (!session) throw new Error("Search session not found");

    const cacheKey = this.getCacheKey(
        category,
        maxResults,
        timeLimit,
        keywords
    );
    const cached = this.searchCache.get(cacheKey);
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;

    // Use cache if it's less than 5 minutes old
    if (cached && cacheAge < 5 * 60 * 1000) {
        console.log("Using cached search results");
        session.progress = {
          currentArea: "Using cached results",
          areasSearched: cached.metrics.areasSearched,
          totalAreas: cached.metrics.totalAreas,
          businessesFound: cached.metrics.totalBusinesses,
          progress: 100,
          status: "completed",
        };
        session.lastUpdate = Date.now();
        return this.paginateResults(cached.allBusinesses, cached.metrics, 1, 20);
    }

    const startTime = Date.now();
    const metrics: SearchMetrics = {
        totalAreas: this.tokyoAreas.length,
        areasSearched: 0,
        totalBusinesses: 0,
        searchTime: 0,
        averageTimePerArea: 0,
        businessesPerMinute: 0,
        apiCalls: 0,
        errors: [],
    };

    const allBusinesses: Business[] = [];
    const seenBusinessIds = new Set<string>();

    // Sort areas by priority
    const sortedAreas = [...this.tokyoAreas].sort(
        (a, b) => a.priority - b.priority
    );

    console.log(
        `Starting Tokyo area search for "${category}" with ${timeLimit}ms time limit`
    );

    for (const area of sortedAreas) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // Check if we've exceeded time limit
        if (elapsedTime >= timeLimit) {
          console.log(`Time limit reached (${timeLimit}ms). Stopping search.`);
          break;
        }

        // Check if we have enough results
        if (allBusinesses.length >= maxResults) {
          console.log(`Reached max results (${maxResults}). Stopping search.`);
          break;
        }

        try {
          console.log(
            `Searching area: ${area.name} (Priority: ${area.priority})`
          );

          // Update progress
          session.progress = {
            currentArea: area.name,
            areasSearched: metrics.areasSearched,
            totalAreas: this.tokyoAreas.length,
            businessesFound: allBusinesses.length,
            progress: Math.round(
              (metrics.areasSearched / this.tokyoAreas.length) * 100
            ),
            status: "searching",
          };
          session.lastUpdate = Date.now();

          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: area.radius,
            maxResults: Math.min(20, maxResults - allBusinesses.length), // Google API limit
            keywords,
          };

          // Rate limiting
          await rateLimiter.waitForDelay();

          const areaStartTime = Date.now();
          const response = await googleMapsService.searchBusinesses(searchConfig);
          const areaEndTime = Date.now();

          metrics.apiCalls++;
          metrics.areasSearched++;

          // Filter out duplicates and add new businesses
          const newBusinesses = response.businesses.filter((business) => {
            if (seenBusinessIds.has(business.id)) {
              return false;
            }
            seenBusinessIds.add(business.id);
            return true;
          });

          allBusinesses.push(...newBusinesses);
          metrics.totalBusinesses = allBusinesses.length;

          const areaSearchTime = areaEndTime - areaStartTime;
          console.log(
            `  Found ${newBusinesses.length} new businesses in ${areaSearchTime}ms`
          );

          // Calculate and log performance metrics
          const remainingTime = timeLimit - elapsedTime;
          const estimatedAreasLeft = Math.ceil(
            remainingTime / (areaSearchTime + 2000)
          ); // Include rate limit delay
          console.log(
            `  Progress: ${metrics.areasSearched}/${metrics.totalAreas} areas, ${metrics.totalBusinesses} businesses`
          );
          console.log(`  Estimated areas left: ${estimatedAreasLeft}`);
        } catch (error) {
          const errorMessage = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMessage);
          metrics.errors.push(errorMessage);

          // Continue with next area even if one fails
          continue;
        }
    }

    // Calculate final metrics
    const totalSearchTime = Date.now() - startTime;
    metrics.searchTime = totalSearchTime;
    metrics.averageTimePerArea =
        metrics.areasSearched > 0 ? totalSearchTime / metrics.areasSearched : 0;
    metrics.businessesPerMinute =
        totalSearchTime > 0
          ? (metrics.totalBusinesses * 60000) / totalSearchTime
          : 0;

    console.log(`\n=== Search Complete ===`);
    console.log(`Total time: ${totalSearchTime}ms`);
    console.log(
        `Areas searched: ${metrics.areasSearched}/${metrics.totalAreas}`
    );
    console.log(`Total businesses: ${metrics.totalBusinesses}`);
    console.log(
        `Businesses per minute: ${metrics.businessesPerMinute.toFixed(2)}`
    );
    console.log(`API calls: ${metrics.apiCalls}`);
    console.log(`Errors: ${metrics.errors.length}`);

    // Cache the results
    this.searchCache.set(cacheKey, {
        allBusinesses,
        metrics,
        timestamp: Date.now(),
    });

    return this.paginateResults(allBusinesses, metrics, 1, 20);
  }

  /**
   * Search specific Tokyo areas with progress tracking
   */
  private async searchSpecificAreasWithProgress(
    searchId: string,
    areaNames: string[],
    category: string,
    maxResults: number,
    keywords?: string
  ): Promise<TokyoAreaSearchResult> {
    const session = this.activeSessions.get(searchId);
    if (!session) throw new Error("Search session not found");

    const cacheKey =
        this.getCacheKey(category, maxResults, 60000, keywords) +
        `-specific-${areaNames.join(",")}`;
    const cached = this.searchCache.get(cacheKey);
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;

    // Use cache if it's less than 5 minutes old
    if (cached && cacheAge < 5 * 60 * 1000) {
        console.log("Using cached specific area search results");
        session.progress = {
          currentArea: "Using cached results",
          areasSearched: cached.metrics.areasSearched,
          totalAreas: cached.metrics.totalAreas,
          businessesFound: cached.metrics.totalBusinesses,
          progress: 100,
          status: "completed",
        };
        session.lastUpdate = Date.now();
        return this.paginateResults(cached.allBusinesses, cached.metrics, 1, 20);
    }

    const filteredAreas = this.tokyoAreas.filter((area) =>
        areaNames.some(
          (name) =>
            area.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(area.name.toLowerCase())
        )
    );

    if (filteredAreas.length === 0) {
        throw new Error(`No areas found matching: ${areaNames.join(", ")}`);
    }

    console.log(
        `Searching specific areas: ${filteredAreas.map((a) => a.name).join(", ")}`
    );

    const allBusinesses: Business[] = [];
    const seenBusinessIds = new Set<string>();
    const startTime = Date.now();

    const metrics: SearchMetrics = {
        totalAreas: filteredAreas.length,
        areasSearched: 0,
        totalBusinesses: 0,
        searchTime: 0,
        averageTimePerArea: 0,
        businessesPerMinute: 0,
        apiCalls: 0,
        errors: [],
    };

    for (const area of filteredAreas) {
        try {
          // Update progress
          session.progress = {
            currentArea: area.name,
            areasSearched: metrics.areasSearched,
            totalAreas: filteredAreas.length,
            businessesFound: allBusinesses.length,
            progress: Math.round(
              (metrics.areasSearched / filteredAreas.length) * 100
            ),
            status: "searching",
          };
          session.lastUpdate = Date.now();

          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: area.radius,
            maxResults: Math.min(20, maxResults - allBusinesses.length),
            keywords,
          };

          await rateLimiter.waitForDelay();

          const response = await googleMapsService.searchBusinesses(searchConfig);
          metrics.apiCalls++;
          metrics.areasSearched++;

          const newBusinesses = response.businesses.filter((business) => {
            if (seenBusinessIds.has(business.id)) {
              return false;
            }
            seenBusinessIds.add(business.id);
            return true;
          });

          allBusinesses.push(...newBusinesses);
          metrics.totalBusinesses = allBusinesses.length;

          console.log(`Found ${newBusinesses.length} businesses in ${area.name}`);
        } catch (error) {
          const errorMessage = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMessage);
          metrics.errors.push(errorMessage);
        }
    }

    const totalSearchTime = Date.now() - startTime;
    metrics.searchTime = totalSearchTime;
    metrics.averageTimePerArea =
        metrics.areasSearched > 0 ? totalSearchTime / metrics.areasSearched : 0;
    metrics.businessesPerMinute =
        totalSearchTime > 0
          ? (metrics.totalBusinesses * 60000) / totalSearchTime
          : 0;

    // Cache the results
    this.searchCache.set(cacheKey, {
        allBusinesses,
        metrics,
        timestamp: Date.now(),
    });

    return this.paginateResults(allBusinesses, metrics, 1, 20);
  }

  /**
   * Search all Tokyo areas with time management and optimization, with pagination
   */
  async searchAllTokyoAreas(
    category: string,
    maxResults: number = 100,
    timeLimit: number = 60000, // 1 minute default
    keywords?: string,
    page: number = 1,
    pageSize: number = 20,
    onProgress?: (progress: SearchProgress) => void
  ): Promise<TokyoAreaSearchResult> {
    const cacheKey = this.getCacheKey(
        category,
        maxResults,
        timeLimit,
        keywords
    );
    const cached = this.searchCache.get(cacheKey);
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;

    // Use cache if it's less than 5 minutes old
    if (cached && cacheAge < 5 * 60 * 1000) {
        console.log("Using cached search results");
        return this.paginateResults(
          cached.allBusinesses,
          cached.metrics,
          page,
          pageSize
        );
    }

    const startTime = Date.now();
    const metrics: SearchMetrics = {
        totalAreas: this.tokyoAreas.length,
        areasSearched: 0,
        totalBusinesses: 0,
        searchTime: 0,
        averageTimePerArea: 0,
        businessesPerMinute: 0,
        apiCalls: 0,
        errors: [],
    };

    const allBusinesses: Business[] = [];
    const seenBusinessIds = new Set<string>();

    // Sort areas by priority
    const sortedAreas = [...this.tokyoAreas].sort(
        (a, b) => a.priority - b.priority
    );

    console.log(
        `Starting Tokyo area search for "${category}" with ${timeLimit}ms time limit`
    );

    for (const area of sortedAreas) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;

        // Check if we've exceeded time limit
        if (elapsedTime >= timeLimit) {
          console.log(`Time limit reached (${timeLimit}ms). Stopping search.`);
          break;
        }

        // Check if we have enough results
        if (allBusinesses.length >= maxResults) {
          console.log(`Reached max results (${maxResults}). Stopping search.`);
          break;
        }

        try {
          console.log(
            `Searching area: ${area.name} (Priority: ${area.priority})`
          );

          // Update progress
          if (onProgress) {
            onProgress({
              currentArea: area.name,
              areasSearched: metrics.areasSearched,
              totalAreas: this.tokyoAreas.length,
              businessesFound: allBusinesses.length,
              progress: Math.round(
                (metrics.areasSearched / this.tokyoAreas.length) * 100
              ),
              status: "searching",
            });
          }

          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: area.radius,
            maxResults: Math.min(20, maxResults - allBusinesses.length), // Google API limit
            keywords,
          };

          // Rate limiting
          await rateLimiter.waitForDelay();

          const areaStartTime = Date.now();
          const response = await googleMapsService.searchBusinesses(searchConfig);
          const areaEndTime = Date.now();

          metrics.apiCalls++;
          metrics.areasSearched++;

          // Filter out duplicates and add new businesses
          const newBusinesses = response.businesses.filter((business) => {
            if (seenBusinessIds.has(business.id)) {
              return false;
            }
            seenBusinessIds.add(business.id);
            return true;
          });

          allBusinesses.push(...newBusinesses);
          metrics.totalBusinesses = allBusinesses.length;

          const areaSearchTime = areaEndTime - areaStartTime;
          console.log(
            `  Found ${newBusinesses.length} new businesses in ${areaSearchTime}ms`
          );

          // Calculate and log performance metrics
          const remainingTime = timeLimit - elapsedTime;
          const estimatedAreasLeft = Math.ceil(
            remainingTime / (areaSearchTime + 2000)
          ); // Include rate limit delay
          console.log(
            `  Progress: ${metrics.areasSearched}/${metrics.totalAreas} areas, ${metrics.totalBusinesses} businesses`
          );
          console.log(`  Estimated areas left: ${estimatedAreasLeft}`);
        } catch (error) {
          const errorMessage = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMessage);
          metrics.errors.push(errorMessage);

          // Continue with next area even if one fails
          continue;
        }
    }

    // Calculate final metrics
    const totalSearchTime = Date.now() - startTime;
    metrics.searchTime = totalSearchTime;
    metrics.averageTimePerArea =
        metrics.areasSearched > 0 ? totalSearchTime / metrics.areasSearched : 0;
    metrics.businessesPerMinute =
        totalSearchTime > 0
          ? (metrics.totalBusinesses * 60000) / totalSearchTime
          : 0;

    console.log(`\n=== Search Complete ===`);
    console.log(`Total time: ${totalSearchTime}ms`);
    console.log(
        `Areas searched: ${metrics.areasSearched}/${metrics.totalAreas}`
    );
    console.log(`Total businesses: ${metrics.totalBusinesses}`);
    console.log(
        `Businesses per minute: ${metrics.businessesPerMinute.toFixed(2)}`
    );
    console.log(`API calls: ${metrics.apiCalls}`);
    console.log(`Errors: ${metrics.errors.length}`);

    // Cache the results
    this.searchCache.set(cacheKey, {
        allBusinesses,
        metrics,
        timestamp: Date.now(),
    });

    return this.paginateResults(allBusinesses, metrics, page, pageSize);
  }

  /**
   * Search specific Tokyo areas with pagination
   */
  async searchSpecificAreas(
    areaNames: string[],
    category: string,
    maxResults: number = 100,
    keywords?: string,
    page: number = 1,
    pageSize: number = 20,
    onProgress?: (progress: SearchProgress) => void
  ): Promise<TokyoAreaSearchResult> {
    const cacheKey =
        this.getCacheKey(category, maxResults, 60000, keywords) +
        `-specific-${areaNames.join(",")}`;
    const cached = this.searchCache.get(cacheKey);
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;

    // Use cache if it's less than 5 minutes old
    if (cached && cacheAge < 5 * 60 * 1000) {
        console.log("Using cached specific area search results");
        return this.paginateResults(
          cached.allBusinesses,
          cached.metrics,
          page,
          pageSize
        );
    }

    const filteredAreas = this.tokyoAreas.filter((area) =>
        areaNames.some(
          (name) =>
            area.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(area.name.toLowerCase())
        )
    );

    if (filteredAreas.length === 0) {
        throw new Error(`No areas found matching: ${areaNames.join(", ")}`);
    }

    console.log(
        `Searching specific areas: ${filteredAreas.map((a) => a.name).join(", ")}`
    );

    const allBusinesses: Business[] = [];
    const seenBusinessIds = new Set<string>();
    const startTime = Date.now();

    const metrics: SearchMetrics = {
        totalAreas: filteredAreas.length,
        areasSearched: 0,
        totalBusinesses: 0,
        searchTime: 0,
        averageTimePerArea: 0,
        businessesPerMinute: 0,
        apiCalls: 0,
        errors: [],
    };

    for (const area of filteredAreas) {
        try {
          // Update progress
          if (onProgress) {
            onProgress({
              currentArea: area.name,
              areasSearched: metrics.areasSearched,
              totalAreas: filteredAreas.length,
              businessesFound: allBusinesses.length,
              progress: Math.round(
                (metrics.areasSearched / filteredAreas.length) * 100
              ),
              status: "searching",
            });
          }

          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: area.radius,
            maxResults: Math.min(20, maxResults - allBusinesses.length),
            keywords,
          };

          await rateLimiter.waitForDelay();

          const response = await googleMapsService.searchBusinesses(searchConfig);
          metrics.apiCalls++;
          metrics.areasSearched++;

          const newBusinesses = response.businesses.filter((business) => {
            if (seenBusinessIds.has(business.id)) {
              return false;
            }
            seenBusinessIds.add(business.id);
            return true;
          });

          allBusinesses.push(...newBusinesses);
          metrics.totalBusinesses = allBusinesses.length;

          console.log(`Found ${newBusinesses.length} businesses in ${area.name}`);
        } catch (error) {
          const errorMessage = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMessage);
          metrics.errors.push(errorMessage);
        }
    }

    const totalSearchTime = Date.now() - startTime;
    metrics.searchTime = totalSearchTime;
    metrics.averageTimePerArea =
        metrics.areasSearched > 0 ? totalSearchTime / metrics.areasSearched : 0;
    metrics.businessesPerMinute =
        totalSearchTime > 0
          ? (metrics.totalBusinesses * 60000) / totalSearchTime
          : 0;

    // Cache the results
    this.searchCache.set(cacheKey, {
        allBusinesses,
        metrics,
        timestamp: Date.now(),
    });

    return this.paginateResults(allBusinesses, metrics, page, pageSize);
  }

  /**
   * Paginate results from cached data
   */
  private paginateResults(
    allBusinesses: Business[],
    metrics: SearchMetrics,
    page: number,
    pageSize: number
  ): TokyoAreaSearchResult {
    const totalBusinesses = allBusinesses.length;
    const totalPages = Math.ceil(totalBusinesses / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pagedBusinesses = allBusinesses.slice(startIdx, endIdx);

    return {
        businesses: pagedBusinesses,
        metrics,
        totalBusinesses,
        page: currentPage,
        pageSize,
        totalPages,
    };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    console.log("Search cache cleared");
  }

  /**
   * Get cache statistics
   */
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
        entries,
    };
  }

  /**
   * Get all available Tokyo areas
   */
  getAvailableAreas(): TokyoArea[] {
    return [...this.tokyoAreas];
  }

  /**
   * Get area statistics
   */
  getAreaStats(): {
    totalAreas: number;
    byPriority: Record<number, number>;
    totalRadius: number;
  } {
    const byPriority: Record<number, number> = {};
    let totalRadius = 0;

    this.tokyoAreas.forEach((area) => {
        byPriority[area.priority] = (byPriority[area.priority] || 0) + 1;
        totalRadius += area.radius;
    });

    return {
        totalAreas: this.tokyoAreas.length,
        byPriority,
        totalRadius,
    };
  }

  // Comprehensive search methods
  async startComprehensiveSearch(
    category: string,
    maxResultsPerArea: number = 50,
    timeLimitPerArea: number = 30000,
    keywords?: string
  ): Promise<string> {
    const searchId = this.generateSearchId();

    // Initialize session
    this.activeSessions.set(searchId, {
        id: searchId,
        progress: {
          currentArea: "Initializing comprehensive search...",
          areasSearched: 0,
          totalAreas: this.tokyoAreas.length,
          businessesFound: 0,
          progress: 0,
          status: "searching",
        },
        startTime: Date.now(),
        lastUpdate: Date.now(),
    });

    // Start the search in background
    this.performComprehensiveSearch(
        searchId,
        category,
        maxResultsPerArea,
        timeLimitPerArea,
        keywords
    ).catch((error) => {
        console.error(`Comprehensive search error for ${searchId}:`, error);
        const session = this.activeSessions.get(searchId);
        if (session) {
          session.progress.status = "error";
          session.progress.error = error.message;
          session.lastUpdate = Date.now();
        }
    });

    return searchId;
  }

  cancelSearch(searchId: string): boolean {
    const session = this.activeSessions.get(searchId);
    if (session) {
        session.progress.status = "cancelled";
        session.progress.currentArea = "Search cancelled by user";
        session.lastUpdate = Date.now();
        return true;
    }
    return false;
  }

  private async performComprehensiveSearch(
    searchId: string,
    category: string,
    maxResultsPerArea: number,
    timeLimitPerArea: number,
    keywords?: string
  ): Promise<void> {
    const session = this.activeSessions.get(searchId);
    if (!session) return;

    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    let totalApiCalls = 0;
    const errors: string[] = [];
    let areasSearched = 0;

    // Sort areas by priority
    const sortedAreas = [...this.tokyoAreas].sort(
        (a, b) => a.priority - b.priority
    );

    for (const area of sortedAreas) {
        // Check if search was cancelled
        if (session.progress.status === "cancelled") {
          break;
        }

        // Update progress
        session.progress.currentArea = area.name;
        session.progress.areasSearched = areasSearched;
        session.progress.progress = Math.round(
          (areasSearched / sortedAreas.length) * 100
        );
        session.lastUpdate = Date.now();

        try {
          console.log(
            `Searching area: ${area.name} (Priority: ${area.priority})`
          );

          const areaStartTime = Date.now();
          const areaBusinesses = await this.searchAreaWithTimeLimit(
            area,
            category,
            maxResultsPerArea,
            timeLimitPerArea,
            keywords
          );
          const areaSearchTime = Date.now() - areaStartTime;

          // Deduplicate businesses
          const newBusinesses = areaBusinesses.filter(
            (business) =>
              !allBusinesses.some((existing) => existing.id === business.id)
          );

          allBusinesses.push(...newBusinesses);
          totalApiCalls += Math.ceil(areaBusinesses.length / 20); // Estimate API calls
          areasSearched++;

          // Update progress
          session.progress.businessesFound = allBusinesses.length;
          session.progress.areasSearched = areasSearched;
          session.progress.progress = Math.round(
            (areasSearched / sortedAreas.length) * 100
          );
          session.lastUpdate = Date.now();

          console.log(
            `Area ${area.name}: Found ${areaBusinesses.length} businesses (${newBusinesses.length} new) in ${areaSearchTime}ms`
          );

          // Rate limiting between areas
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          const errorMsg = `Error searching ${area.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          errors.push(errorMsg);

          // Continue with next area
          areasSearched++;
          session.progress.areasSearched = areasSearched;
          session.progress.progress = Math.round(
            (areasSearched / sortedAreas.length) * 100
          );
          session.lastUpdate = Date.now();
        }
    }

    // Calculate metrics
    const totalSearchTime = Date.now() - startTime;
    const metrics: SearchMetrics = {
        totalAreas: sortedAreas.length,
        areasSearched,
        totalBusinesses: allBusinesses.length,
        searchTime: totalSearchTime,
        averageTimePerArea:
          areasSearched > 0 ? totalSearchTime / areasSearched : 0,
        businessesPerMinute:
          totalSearchTime > 0
            ? (allBusinesses.length / totalSearchTime) * 60000
            : 0,
        apiCalls: totalApiCalls,
        errors,
    };

    // Create result
    const result: TokyoAreaSearchResult = {
        businesses: allBusinesses,
        metrics,
        totalBusinesses: allBusinesses.length,
        page: 1,
        pageSize: allBusinesses.length,
        totalPages: 1,
    };

    // Update session
    session.result = result;
    session.progress.status =
        session.progress.status === "cancelled" ? "cancelled" : "completed";
    session.progress.currentArea =
        session.progress.status === "cancelled"
          ? "Search cancelled"
          : "Search completed";
    session.progress.progress = 100;
    session.lastUpdate = Date.now();

    console.log(
        `Comprehensive search completed: ${allBusinesses.length} businesses found in ${totalSearchTime}ms`
    );
  }

  private async searchAreaWithTimeLimit(
    area: TokyoArea,
    category: string,
    maxResults: number,
    timeLimit: number,
    keywords?: string
  ): Promise<Business[]> {
    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    let nextPageToken: string | undefined;

    while (
        allBusinesses.length < maxResults &&
        Date.now() - startTime < timeLimit
    ) {
        try {
          const searchConfig: SearchConfig = {
            location: {
              city: area.name,
              country: "Japan",
              coordinates: area.coordinates,
            },
            category,
            radius: area.radius,
            maxResults: Math.min(20, maxResults - allBusinesses.length),
            keywords,
          };

          const result = await googleMapsService.searchBusinesses(searchConfig);

          if (result.businesses.length === 0) {
            break; // No more results
          }

          allBusinesses.push(...result.businesses);
          nextPageToken = result.nextPageToken;

          // Rate limiting
          await rateLimiter.waitForDelay();

          // If no next page token, we've reached the end
          if (!nextPageToken) {
            break;
          }
        } catch (error) {
          console.error(`Error searching area ${area.name}:`, error);
          break;
        }
    }

    return allBusinesses;
  }

  async searchAllTokyoAreasComprehensive(
    category: string,
    maxResultsPerArea: number = 50,
    timeLimitPerArea: number = 30000,
    keywords?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<TokyoAreaSearchResult> {
    const cacheKey = this.getCacheKey(
        category,
        maxResultsPerArea,
        timeLimitPerArea,
        keywords
    );

    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
        console.log(`Using cached comprehensive search results for ${cacheKey}`);
        return this.paginateResults(
          cached.allBusinesses,
          cached.metrics,
          page,
          pageSize
        );
    }

    // Perform comprehensive search
    const searchId = await this.startComprehensiveSearch(
        category,
        maxResultsPerArea,
        timeLimitPerArea,
        keywords
    );

    // Wait for completion
    while (true) {
        const session = this.activeSessions.get(searchId);
        if (!session) {
          throw new Error("Search session not found");
        }

        if (
          session.progress.status === "completed" ||
          session.progress.status === "cancelled"
        ) {
          if (session.result) {
            // Cache the results
            this.searchCache.set(cacheKey, {
              allBusinesses: session.result.businesses,
              metrics: session.result.metrics,
              timestamp: Date.now(),
            });

            return this.paginateResults(
              session.result.businesses,
              session.result.metrics,
              page,
              pageSize
            );
          } else {
            throw new Error("Search completed but no result available");
          }
        }

        if (session.progress.status === "error") {
          throw new Error(session.progress.error || "Search failed");
        }

        // Wait before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Export singleton instance
export const tokyoAreaSearchService = new TokyoAreaSearchService();
