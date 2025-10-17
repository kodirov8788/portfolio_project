import { Business, SearchConfig } from "@/types";
import { googleMapsService } from "./google-maps";
import { rateLimiter } from "./rate-limiter";
import {
  saveBusinessContact,
  getCachedResults,
  saveSearchHistory,
  saveSearchResult,
} from "./station-search-db";

// Tokyo station definitions with coordinates and train lines
export interface TokyoStation {
  name: string;
  englishName: string;
  coordinates: { lat: number; lng: number };
  lines: string[];
  area: string;
  priority: number; // 1 = highest priority (major stations)
  searchRadius: number; // in km
}

// Search performance metrics
export interface SearchMetrics {
  totalStations: number;
  stationsSearched: number;
  totalBusinesses: number;
  searchTime: number; // in milliseconds
  averageTimePerStation: number;
  businessesPerMinute: number;
  apiCalls: number;
  errors: string[];
}

// Progress callback interface
export interface SearchProgress {
  currentStation: string;
  stationsSearched: number;
  totalStations: number;
  businessesFound: number;
  progress: number; // 0-100
  status: "searching" | "completed" | "error" | "cancelled";
  error?: string;
  currentStationProgress?: number; // 0-100 for current station
  currentStationPages?: number;
  totalPagesSearched?: number;
}

export interface TokyoStationsSearchResult {
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
  result?: TokyoStationsSearchResult;
  startTime: number;
  lastUpdate: number;
}

class TokyoStationsSearchService {
  private tokyoStations: TokyoStation[] = [
    // Major Hub Stations (Priority 1)
    {
        name: "東京駅",
        englishName: "Tokyo Station",
        coordinates: { lat: 35.6812, lng: 139.7671 },
        lines: [
          "JR Yamanote",
          "JR Chuo",
          "JR Keihin-Tohoku",
          "JR Tokaido",
          "JR Yokosuka",
          "Tokyo Metro Marunouchi",
        ],
        area: "Marunouchi",
        priority: 1,
        searchRadius: 1.5,
    },
    {
        name: "新宿駅",
        englishName: "Shinjuku Station",
        coordinates: { lat: 35.6895, lng: 139.6917 },
        lines: [
          "JR Yamanote",
          "JR Chuo",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Tokyo Metro Marunouchi",
          "Tokyo Metro Shinjuku",
          "Toei Shinjuku",
          "Toei Oedo",
          "Keio",
          "Odakyu",
        ],
        area: "Shinjuku",
        priority: 1,
        searchRadius: 1.5,
    },
    {
        name: "渋谷駅",
        englishName: "Shibuya Station",
        coordinates: { lat: 35.6586, lng: 139.7016 },
        lines: [
          "JR Yamanote",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Tokyo Metro Ginza",
          "Tokyo Metro Hanzomon",
          "Tokyo Metro Fukutoshin",
          "Toei Den-en-toshi",
          "Keio Inokashira",
          "Tokyu Toyoko",
          "Tokyu Den-en-toshi",
        ],
        area: "Shibuya",
        priority: 1,
        searchRadius: 1.5,
    },
    {
        name: "池袋駅",
        englishName: "Ikebukuro Station",
        coordinates: { lat: 35.7295, lng: 139.7109 },
        lines: [
          "JR Yamanote",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Tokyo Metro Marunouchi",
          "Tokyo Metro Yurakucho",
          "Tokyo Metro Fukutoshin",
          "Toei Mita",
          "Seibu Ikebukuro",
          "Tobu Tojo",
        ],
        area: "Ikebukuro",
        priority: 1,
        searchRadius: 1.5,
    },

    // Major Business District Stations (Priority 2)
    {
        name: "銀座駅",
        englishName: "Ginza Station",
        coordinates: { lat: 35.6722, lng: 139.7673 },
        lines: [
          "Tokyo Metro Ginza",
          "Tokyo Metro Marunouchi",
          "Tokyo Metro Hibiya",
        ],
        area: "Ginza",
        priority: 2,
        searchRadius: 1.2,
    },
    {
        name: "新橋駅",
        englishName: "Shimbashi Station",
        coordinates: { lat: 35.6662, lng: 139.7596 },
        lines: [
          "JR Yamanote",
          "JR Keihin-Tohoku",
          "JR Tokaido",
          "JR Yokosuka",
          "Tokyo Metro Ginza",
          "Toei Asakusa",
          "Yurikamome",
        ],
        area: "Shimbashi",
        priority: 2,
        searchRadius: 1.2,
    },
    {
        name: "有楽町駅",
        englishName: "Yurakucho Station",
        coordinates: { lat: 35.6751, lng: 139.7633 },
        lines: ["JR Yamanote", "JR Keihin-Tohoku", "Tokyo Metro Yurakucho"],
        area: "Yurakucho",
        priority: 2,
        searchRadius: 1.2,
    },
    {
        name: "六本木駅",
        englishName: "Roppongi Station",
        coordinates: { lat: 35.6626, lng: 139.731 },
        lines: ["Tokyo Metro Hibiya", "Toei Oedo"],
        area: "Roppongi",
        priority: 2,
        searchRadius: 1.2,
    },

    // Popular Shopping/Entertainment Stations (Priority 3)
    {
        name: "原宿駅",
        englishName: "Harajuku Station",
        coordinates: { lat: 35.6702, lng: 139.7016 },
        lines: ["JR Yamanote"],
        area: "Harajuku",
        priority: 3,
        searchRadius: 1.0,
    },
    {
        name: "表参道駅",
        englishName: "Omotesando Station",
        coordinates: { lat: 35.6654, lng: 139.712 },
        lines: [
          "Tokyo Metro Ginza",
          "Tokyo Metro Chiyoda",
          "Tokyo Metro Hanzomon",
        ],
        area: "Omotesando",
        priority: 3,
        searchRadius: 1.0,
    },
    {
        name: "青山一丁目駅",
        englishName: "Aoyama-itchome Station",
        coordinates: { lat: 35.6726, lng: 139.7239 },
        lines: ["Tokyo Metro Ginza", "Tokyo Metro Hanzomon", "Toei Oedo"],
        area: "Aoyama",
        priority: 3,
        searchRadius: 1.0,
    },
    {
        name: "代々木駅",
        englishName: "Yoyogi Station",
        coordinates: { lat: 35.6831, lng: 139.702 },
        lines: [
          "JR Yamanote",
          "JR Chuo",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Toei Oedo",
        ],
        area: "Yoyogi",
        priority: 3,
        searchRadius: 1.0,
    },

    // Residential/Commercial Mix Stations (Priority 4)
    {
        name: "恵比寿駅",
        englishName: "Ebisu Station",
        coordinates: { lat: 35.6467, lng: 139.71 },
        lines: [
          "JR Yamanote",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Tokyo Metro Hibiya",
        ],
        area: "Ebisu",
        priority: 4,
        searchRadius: 1.0,
    },
    {
        name: "目黒駅",
        englishName: "Meguro Station",
        coordinates: { lat: 35.6333, lng: 139.7167 },
        lines: [
          "JR Yamanote",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Tokyo Metro Namboku",
          "Toei Mita",
          "Tokyu Meguro",
        ],
        area: "Meguro",
        priority: 4,
        searchRadius: 1.0,
    },
    {
        name: "中目黒駅",
        englishName: "Nakameguro Station",
        coordinates: { lat: 35.6444, lng: 139.7033 },
        lines: ["Tokyo Metro Hibiya", "Tokyu Toyoko", "Tokyu Den-en-toshi"],
        area: "Nakameguro",
        priority: 4,
        searchRadius: 1.0,
    },
    {
        name: "代官山駅",
        englishName: "Daikanyama Station",
        coordinates: { lat: 35.6483, lng: 139.7033 },
        lines: ["Tokyu Toyoko", "Tokyu Den-en-toshi"],
        area: "Daikanyama",
        priority: 4,
        searchRadius: 1.0,
    },

    // Additional Major Stations (Priority 5)
    {
        name: "品川駅",
        englishName: "Shinagawa Station",
        coordinates: { lat: 35.6284, lng: 139.7388 },
        lines: [
          "JR Yamanote",
          "JR Keihin-Tohoku",
          "JR Tokaido",
          "JR Yokosuka",
          "JR Shonan-Shinjuku",
          "JR Saikyo",
          "Keikyu",
        ],
        area: "Shinagawa",
        priority: 5,
        searchRadius: 1.2,
    },
    {
        name: "上野駅",
        englishName: "Ueno Station",
        coordinates: { lat: 35.7142, lng: 139.7774 },
        lines: [
          "JR Yamanote",
          "JR Keihin-Tohoku",
          "JR Tokaido",
          "JR Utsunomiya",
          "JR Takasaki",
          "JR Joban",
          "Tokyo Metro Ginza",
          "Tokyo Metro Hibiya",
          "Keisei",
        ],
        area: "Ueno",
        priority: 5,
        searchRadius: 1.2,
    },
    {
        name: "浅草駅",
        englishName: "Asakusa Station",
        coordinates: { lat: 35.7148, lng: 139.7967 },
        lines: [
          "Tokyo Metro Ginza",
          "Toei Asakusa",
          "Tobu Skytree",
          "Tsukuba Express",
        ],
        area: "Asakusa",
        priority: 5,
        searchRadius: 1.2,
    },
    {
        name: "秋葉原駅",
        englishName: "Akihabara Station",
        coordinates: { lat: 35.6984, lng: 139.7731 },
        lines: [
          "JR Yamanote",
          "JR Keihin-Tohoku",
          "JR Chuo",
          "Tokyo Metro Hibiya",
          "Tsukuba Express",
        ],
        area: "Akihabara",
        priority: 5,
        searchRadius: 1.2,
    },

    // Additional stations for comprehensive coverage
    {
        name: "赤坂駅",
        englishName: "Akasaka Station",
        coordinates: { lat: 35.6654, lng: 139.732 },
        lines: ["Tokyo Metro Chiyoda"],
        area: "Akasaka",
        priority: 6,
        searchRadius: 0.8,
    },
    {
        name: "永田町駅",
        englishName: "Nagatacho Station",
        coordinates: { lat: 35.6789, lng: 139.7404 },
        lines: [
          "Tokyo Metro Ginza",
          "Tokyo Metro Marunouchi",
          "Tokyo Metro Hanzomon",
          "Tokyo Metro Namboku",
          "Tokyo Metro Yurakucho",
        ],
        area: "Nagatacho",
        priority: 6,
        searchRadius: 0.8,
    },
    {
        name: "霞ヶ関駅",
        englishName: "Kasumigaseki Station",
        coordinates: { lat: 35.6736, lng: 139.7505 },
        lines: [
          "Tokyo Metro Chiyoda",
          "Tokyo Metro Marunouchi",
          "Tokyo Metro Hibiya",
        ],
        area: "Kasumigaseki",
        priority: 6,
        searchRadius: 0.8,
    },
    {
        name: "虎ノ門駅",
        englishName: "Toranomon Station",
        coordinates: { lat: 35.6701, lng: 139.7492 },
        lines: ["Tokyo Metro Ginza"],
        area: "Toranomon",
        priority: 6,
        searchRadius: 0.8,
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
    keywords?: string,
    stations?: string[]
  ): string {
    const parts = [category, maxResults.toString()];
    if (keywords) {
        parts.push(keywords.toLowerCase().trim());
    }
    if (stations && stations.length > 0) {
        parts.push(stations.sort().join(","));
    }
    return parts.join("|");
  }

  private generateSearchId(): string {
    return `tokyo_search_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
  }

  getSearchProgress(searchId: string): SearchProgress | null {
    const session = this.activeSessions.get(searchId);
    if (!session) return null;

    // Update last access time
    session.lastUpdate = Date.now();
    return session.progress;
  }

  getSearchResult(searchId: string): TokyoStationsSearchResult | null {
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
  ): TokyoStationsSearchResult | null {
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
    maxResults: number = 500,
    keywords?: string,
    stationNames?: string[],
    userId?: string,
    region?: string,
    areas?: string[]
  ): Promise<string> {
    this.cleanupOldSessions();

    const searchId = this.generateSearchId();

    // Find stations to search
    const stationsToSearch = stationNames
        ? this.tokyoStations.filter((station) =>
            stationNames.some(
              (name) =>
                station.englishName.toLowerCase().includes(name.toLowerCase()) ||
                station.name.includes(name)
            )
          )
        : this.tokyoStations;

    // Create initial session
    const session: SearchSession = {
        id: searchId,
        progress: {
          currentStation: "Initializing...",
          stationsSearched: 0,
          totalStations: stationsToSearch.length,
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
        keywords,
        stationsToSearch,
        userId,
        region,
        areas
    );

    return searchId;
  }

  private async performSearch(
    searchId: string,
    category: string,
    maxResults: number,
    keywords?: string,
    stationsToSearch?: TokyoStation[],
    userId?: string,
    region?: string,
    areas?: string[]
  ): Promise<void> {
    try {
        const session = this.activeSessions.get(searchId);
        if (!session) return;

        let result: TokyoStationsSearchResult;

        if (stationsToSearch && stationsToSearch.length > 0) {
          result = await this.searchSpecificStationsWithProgress(
            searchId,
            stationsToSearch,
            category,
            maxResults,
            keywords
          );
        } else {
          result = await this.searchAllStationsWithProgress(
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

        // Save search history with actual user data
        let searchHistoryId: string | null = null;
        try {
          const searchHistory = await saveSearchHistory({
            userId: userId || "temp-user-id",
            searchType: "STATION",
            category: category,
            keywords: keywords,
            regions: region ? [region] : ["Tokyo"],
            areas: areas || [],
            stations: stationsToSearch?.map((s) => s.englishName) || [],
            maxResults: maxResults,
            timeLimit: 60000,
            totalFound: result.totalBusinesses,
            searchTime: result.metrics.searchTime,
            status: "COMPLETED",
          });
          searchHistoryId = searchHistory.id;
          console.log("Created searchHistoryId:", searchHistoryId);
        } catch (error) {
          console.error("Error saving search history:", error);
        }

        // Save search results if we have a search history ID
        if (searchHistoryId && result.businesses.length > 0) {
          console.log(
            `Attempting to save ${result.businesses.length} businesses to SearchResult for searchHistoryId:`,
            searchHistoryId
          );
          try {
            // Save each business contact and create search result entries
            for (const business of result.businesses) {
              // Save or update business contact
              const businessContact = await saveBusinessContact(business);
              console.log(
                "Saved businessContact:",
                businessContact?.id,
                businessContact?.name
              );
              // Create search result entry
              try {
                await saveSearchResult({
                  searchHistoryId: searchHistoryId,
                  businessContactId: businessContact.id,
                  region: region || "Tokyo",
                  area: business.area || "",
                  station: "", // Station info is not stored in Business type
                  isFromCache: false,
                });
                console.log(
                  "Saved search result for businessContactId:",
                  businessContact.id
                );
              } catch (err) {
                console.error(
                  "Error saving search result for businessContactId:",
                  businessContact.id,
                  err
                );
              }
            }
            console.log(
              `Saved ${result.businesses.length} search results to database`
            );
          } catch (error) {
            console.error("Error saving search results:", error);
          }
        } else {
          console.warn(
            "No search results saved: searchHistoryId or businesses missing",
            { searchHistoryId, businessCount: result.businesses.length }
          );
        }
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

  private async searchAllStationsWithProgress(
    searchId: string,
    category: string,
    maxResults: number,
    keywords?: string
  ): Promise<TokyoStationsSearchResult> {
    const session = this.activeSessions.get(searchId);
    if (!session) {
        throw new Error("Search session not found");
    }

    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;

    // Sort stations by priority
    const sortedStations = [...this.tokyoStations].sort(
        (a, b) => a.priority - b.priority
    );
    const totalStations = sortedStations.length;

    for (let i = 0; i < sortedStations.length; i++) {
        const station = sortedStations[i];

        // Check if search was cancelled
        if (session.progress.status === "cancelled") {
          console.log(`Search ${searchId} was cancelled, stopping`);
          break;
        }

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress
        session.progress = {
          currentStation: station.englishName,
          stationsSearched: i,
          totalStations,
          businessesFound: allBusinesses.length,
          progress: Math.round((i / totalStations) * 100),
          status: "searching",
        };
        session.lastUpdate = Date.now();

        try {
          console.log(`Searching station: ${station.englishName}`);

          const stationBusinesses = await this.searchStationArea(
            station,
            category,
            maxResults - allBusinesses.length,
            keywords
          );

          allBusinesses.push(...stationBusinesses);
          apiCalls++;

          // Rate limiting
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${station.englishName}: ${
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
        totalStations,
        stationsSearched: Math.min(sortedStations.length, totalStations),
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerStation:
          searchTime / Math.min(sortedStations.length, totalStations),
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

  private async searchSpecificStationsWithProgress(
    searchId: string,
    stationsToSearch: TokyoStation[],
    category: string,
    maxResults: number,
    keywords?: string
  ): Promise<TokyoStationsSearchResult> {
    const session = this.activeSessions.get(searchId);
    if (!session) {
        throw new Error("Search session not found");
    }

    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;
    let totalPagesSearched = 0;

    const totalStations = stationsToSearch.length;

    for (let i = 0; i < stationsToSearch.length; i++) {
        const station = stationsToSearch[i];

        // Check if search was cancelled
        if (session.progress.status === "cancelled") {
          console.log(`Search ${searchId} was cancelled, stopping`);
          break;
        }

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress for new station
        session.progress = {
          currentStation: station.englishName,
          stationsSearched: i,
          totalStations,
          businessesFound: allBusinesses.length,
          progress: Math.round((i / totalStations) * 100),
          status: "searching",
          currentStationProgress: 0,
          currentStationPages: 0,
          totalPagesSearched,
        };
        session.lastUpdate = Date.now();

        try {
          console.log(`Starting deep search for station: ${station.englishName}`);

          const stationBusinesses = await this.searchStationArea(
            station,
            category,
            maxResults - allBusinesses.length,
            keywords,
            (stationProgress) => {
              // Update progress for current station
              session.progress = {
                ...session.progress,
                currentStationProgress: stationProgress.progress,
                currentStationPages: stationProgress.currentPage,
                businessesFound:
                  allBusinesses.length + stationProgress.businessesFound,
                totalPagesSearched:
                  totalPagesSearched + stationProgress.currentPage,
              };
              session.lastUpdate = Date.now();
            }
          );

          allBusinesses.push(...stationBusinesses);
          apiCalls += Math.ceil(stationBusinesses.length / 20); // Estimate API calls
          totalPagesSearched += Math.ceil(stationBusinesses.length / 20);

          console.log(
            `Completed ${station.englishName}: ${stationBusinesses.length} businesses found`
          );

          // Rate limiting between stations
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${station.englishName}: ${
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
        totalStations,
        stationsSearched: stationsToSearch.length,
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerStation: searchTime / stationsToSearch.length,
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

  async searchAllStations(
    category: string,
    maxResults: number = 500,
    keywords?: string,
    page: number = 1,
    pageSize: number = 20,
    onProgress?: (progress: SearchProgress) => void
  ): Promise<TokyoStationsSearchResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(category, maxResults, keywords);
    const cached = this.searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        // 30 minutes cache
        console.log("Returning cached Tokyo stations search results");
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

    // Sort stations by priority
    const sortedStations = [...this.tokyoStations].sort(
        (a, b) => a.priority - b.priority
    );
    const totalStations = sortedStations.length;

    for (let i = 0; i < sortedStations.length; i++) {
        const station = sortedStations[i];

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress
        if (onProgress) {
          onProgress({
            currentStation: station.englishName,
            stationsSearched: i,
            totalStations,
            businessesFound: allBusinesses.length,
            progress: Math.round((i / totalStations) * 100),
            status: "searching",
          });
        }

        try {
          console.log(`Searching station: ${station.englishName}`);

          const stationBusinesses = await this.searchStationArea(
            station,
            category,
            maxResults - allBusinesses.length,
            keywords
          );

          allBusinesses.push(...stationBusinesses);
          apiCalls++;

          // Rate limiting
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${station.englishName}: ${
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
        totalStations,
        stationsSearched: Math.min(sortedStations.length, totalStations),
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerStation:
          searchTime / Math.min(sortedStations.length, totalStations),
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

  async searchStations(
    stationNames: string[],
    category: string,
    maxResults: number = 500,
    keywords?: string,
    page: number = 1,
    pageSize: number = 20,
    onProgress?: (progress: SearchProgress) => void
  ): Promise<TokyoStationsSearchResult> {
    const startTime = Date.now();
    const allBusinesses: Business[] = [];
    const errors: string[] = [];
    let apiCalls = 0;

    // Find stations by name
    const stationsToSearch = this.tokyoStations.filter((station) =>
        stationNames.some(
          (name) =>
            station.englishName.toLowerCase().includes(name.toLowerCase()) ||
            station.name.includes(name)
        )
    );

    if (stationsToSearch.length === 0) {
        throw new Error(`No stations found matching: ${stationNames.join(", ")}`);
    }

    const totalStations = stationsToSearch.length;

    for (let i = 0; i < stationsToSearch.length; i++) {
        const station = stationsToSearch[i];

        // Check if we've reached the max results
        if (allBusinesses.length >= maxResults) {
          console.log(`Max results reached (${maxResults}), stopping search`);
          break;
        }

        // Update progress
        if (onProgress) {
          onProgress({
            currentStation: station.englishName,
            stationsSearched: i,
            totalStations,
            businessesFound: allBusinesses.length,
            progress: Math.round((i / totalStations) * 100),
            status: "searching",
          });
        }

        try {
          console.log(`Searching specific station: ${station.englishName}`);

          const stationBusinesses = await this.searchStationArea(
            station,
            category,
            maxResults - allBusinesses.length,
            keywords
          );

          allBusinesses.push(...stationBusinesses);
          apiCalls++;

          // Rate limiting
          await rateLimiter.waitForDelay();
        } catch (error) {
          const errorMsg = `Error searching ${station.englishName}: ${
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
        totalStations,
        stationsSearched: stationsToSearch.length,
        totalBusinesses: uniqueBusinesses.length,
        searchTime,
        averageTimePerStation: searchTime / stationsToSearch.length,
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
  ): TokyoStationsSearchResult {
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
    console.log("Tokyo stations search cache cleared");
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

  getAvailableStations(): TokyoStation[] {
    return [...this.tokyoStations];
  }

  getStationStats(): {
    totalStations: number;
    byPriority: Record<number, number>;
    totalLines: number;
  } {
    const byPriority: Record<number, number> = {};
    const allLines = new Set<string>();

    for (const station of this.tokyoStations) {
        byPriority[station.priority] = (byPriority[station.priority] || 0) + 1;
        station.lines.forEach((line) => allLines.add(line));
    }

    return {
        totalStations: this.tokyoStations.length,
        byPriority,
        totalLines: allLines.size,
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

  private async searchStationArea(
    station: TokyoStation,
    category: string,
    maxResults: number,
    keywords?: string,
    onStationProgress?: (progress: {
        currentPage: number;
        businessesFound: number;
        progress: number;
        searchPhase: string;
        totalSearches: number;
    }) => void
  ): Promise<Business[]> {
    // Check database cache first (24 hours default)
    const cacheDurationHours = 24; // TODO: Make this configurable by admin
    const cachedResults = await getCachedResults({
        region: "Tokyo", // TODO: Get from station data
        area: station.area,
        station: station.englishName,
        category,
        keywords,
        cacheDurationHours,
    });

    if (cachedResults && cachedResults.length > 0) {
        console.log(
          `Using cached results for ${station.englishName}: ${cachedResults.length} businesses`
        );
        return cachedResults.slice(0, maxResults);
    }

    console.log(
        `No cache found for ${station.englishName}, performing new search`
    );

    const allBusinesses: Business[] = [];
    const startTime = Date.now();
    let totalSearches = 0;
    let totalPages = 0;

    console.log(
        `Starting comprehensive multi-search for ${station.englishName} (Priority ${station.priority}, Radius ${station.searchRadius}km)`
    );

    // Search strategies for each station
    const searchStrategies = this.getSearchStrategies(
        station,
        category,
        keywords
    );

    for (
        let strategyIndex = 0;
        strategyIndex < searchStrategies.length;
        strategyIndex++
    ) {
        const strategy = searchStrategies[strategyIndex];
        totalSearches++;

        console.log(
          `\n=== Search Strategy ${strategyIndex + 1}/${
            searchStrategies.length
          }: ${strategy.name} ===`
        );
        console.log(`Strategy details: ${JSON.stringify(strategy, null, 2)}`);

        const strategyBusinesses = await this.executeSearchStrategy(
          station,
          strategy,
          totalSearches,
          strategyIndex,
          searchStrategies.length,
          onStationProgress
        );

        // Add new businesses from this strategy
        const newBusinesses = strategyBusinesses.filter((newBusiness) => {
          const key = `${newBusiness.name}-${newBusiness.address}`;
          return !allBusinesses.some(
            (existing) => `${existing.name}-${existing.address}` === key
          );
        });

        allBusinesses.push(...newBusinesses);
        totalPages += strategy.pagesSearched || 0;

        console.log(
          `Strategy ${strategy.name} completed: +${newBusinesses.length} new businesses (${strategyBusinesses.length} total found)`
        );

        // Update progress
        if (onStationProgress) {
          const overallProgress = Math.round(
            ((strategyIndex + 1) / searchStrategies.length) * 100
          );
          onStationProgress({
            currentPage: totalPages,
            businessesFound: allBusinesses.length,
            progress: overallProgress,
            searchPhase: strategy.name,
            totalSearches: totalSearches,
          });
        }

        // Check if we have enough businesses
        if (allBusinesses.length >= maxResults) {
          console.log(
            `Reached max results (${maxResults}) for ${station.englishName}`
          );
          break;
        }

        // Rate limiting between strategies
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Save results to database
    console.log(
        `Saving ${allBusinesses.length} businesses to database for ${station.englishName}`
    );
    for (const business of allBusinesses) {
        try {
          await saveBusinessContact(business);
        } catch (error) {
          console.error(`Error saving business ${business.name}:`, error);
        }
    }

    const searchTime = Date.now() - startTime;
    console.log(
        `\n=== Comprehensive search completed for ${station.englishName} ===`
    );
    console.log(`Total searches: ${totalSearches}`);
    console.log(`Total pages: ${totalPages}`);
    console.log(`Total businesses: ${allBusinesses.length}`);
    console.log(`Search time: ${searchTime}ms`);

    return allBusinesses;
  }

  private getSearchStrategies(
    station: TokyoStation,
    category: string,
    keywords?: string
  ): Array<{
    name: string;
    searchConfig: SearchConfig;
    maxPages: number;
    pagesSearched?: number;
  }> {
    const strategies = [];

    // Strategy 1: Standard search with station name
    strategies.push({
        name: "Standard Station Search",
        searchConfig: {
          location: {
            city: station.englishName,
            country: "Japan",
            coordinates: station.coordinates,
          },
          category,
          radius: station.searchRadius,
          maxResults: 20,
          keywords,
        },
        maxPages: 20,
    });

    // Strategy 2: Search with area name
    strategies.push({
        name: "Area-Based Search",
        searchConfig: {
          location: {
            city: station.area,
            country: "Japan",
            coordinates: station.coordinates,
          },
          category,
          radius: station.searchRadius,
          maxResults: 20,
          keywords,
        },
        maxPages: 15,
    });

    // Strategy 3: Search with Japanese station name
    strategies.push({
        name: "Japanese Name Search",
        searchConfig: {
          location: {
            city: station.name,
            country: "Japan",
            coordinates: station.coordinates,
          },
          category,
          radius: station.searchRadius,
          maxResults: 20,
          keywords,
        },
        maxPages: 15,
    });

    // Strategy 4: Broader radius search
    strategies.push({
        name: "Extended Radius Search",
        searchConfig: {
          location: {
            city: station.englishName,
            country: "Japan",
            coordinates: station.coordinates,
          },
          category,
          radius: Math.min(station.searchRadius * 1.5, 3), // 50% larger radius, max 3km
          maxResults: 20,
          keywords,
        },
        maxPages: 10,
    });

    // Strategy 5: Search with train line keywords
    if (station.lines.length > 0) {
        const mainLine = station.lines[0]; // Use the first/main line
        strategies.push({
          name: `Train Line Search (${mainLine})`,
          searchConfig: {
            location: {
              city: station.englishName,
              country: "Japan",
              coordinates: station.coordinates,
            },
            category,
            radius: station.searchRadius,
            maxResults: 20,
            keywords: keywords ? `${keywords} ${mainLine}` : mainLine,
          },
          maxPages: 10,
        });
    }

    // Strategy 6: Category-specific variations
    if (category === "restaurant") {
        strategies.push({
          name: "Restaurant Variations",
          searchConfig: {
            location: {
              city: station.englishName,
              country: "Japan",
              coordinates: station.coordinates,
            },
            category: "restaurant",
            radius: station.searchRadius,
            maxResults: 20,
            keywords: keywords ? `${keywords} レストラン` : "レストラン",
          },
          maxPages: 10,
        });
    }

    // Strategy 7: Search without keywords (broader results)
    if (keywords) {
        strategies.push({
          name: "Broad Category Search",
          searchConfig: {
            location: {
              city: station.englishName,
              country: "Japan",
              coordinates: station.coordinates,
            },
            category,
            radius: station.searchRadius,
            maxResults: 20,
            keywords: undefined, // No keywords for broader results
          },
          maxPages: 15,
        });
    }

    // Strategy 8: Search with area + station combination
    strategies.push({
        name: "Area + Station Search",
        searchConfig: {
          location: {
            city: `${station.area} ${station.englishName}`,
            country: "Japan",
            coordinates: station.coordinates,
          },
          category,
          radius: station.searchRadius,
          maxResults: 20,
          keywords,
        },
        maxPages: 10,
    });

    return strategies;
  }

  private async executeSearchStrategy(
    station: TokyoStation,
    strategy: {
        name: string;
        searchConfig: SearchConfig;
        maxPages: number;
        pagesSearched?: number;
    },
    totalSearches: number,
    strategyIndex: number,
    totalStrategies: number,
    onStationProgress?: (progress: {
        currentPage: number;
        businessesFound: number;
        progress: number;
        searchPhase: string;
        totalSearches: number;
    }) => void
  ): Promise<Business[]> {
    const businesses: Business[] = [];
    let pageToken: string | undefined;
    let currentPage = 0;
    const strategyStartTime = Date.now();

    console.log(`Executing strategy: ${strategy.name}`);

    do {
        currentPage++;
        const pageStartTime = Date.now();

        try {
          console.log(
            `  ${strategy.name} - Page ${currentPage}, Found: ${businesses.length} businesses`
          );

          const result = await googleMapsService.searchBusinesses(
            strategy.searchConfig
          );
          const newBusinesses = result.businesses;

          // Check if we got new businesses
          if (newBusinesses.length === 0) {
            console.log(
              `  No more businesses found for ${strategy.name} on page ${currentPage}`
            );
            break;
          }

          businesses.push(...newBusinesses);

          // Get next page token from response
          pageToken = result.nextPageToken;

          // Calculate response time and apply adaptive delay
          const responseTime = Date.now() - pageStartTime;
          const delay = this.getAdaptiveDelay(responseTime);

          // Update progress callback if provided
          if (onStationProgress) {
            const overallProgress = Math.round(
              ((strategyIndex + currentPage / strategy.maxPages) /
                totalStrategies) *
                100
            );
            onStationProgress({
              currentPage: currentPage,
              businessesFound: businesses.length,
              progress: overallProgress,
              searchPhase: `${strategy.name} (Page ${currentPage})`,
              totalSearches: totalSearches,
            });
          }

          console.log(
            `  Page ${currentPage} completed: +${newBusinesses.length} businesses, Response time: ${responseTime}ms, Delay: ${delay}ms`
          );

          // Rate limiting with adaptive delay
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Check if we've reached page limit for this strategy
          if (currentPage >= strategy.maxPages) {
            console.log(
              `  Reached max pages (${strategy.maxPages}) for ${strategy.name}`
            );
            break;
          }

          // If no next page token, we've reached the end
          if (!pageToken) {
            console.log(
              `  No more pages available for ${strategy.name} - strategy complete`
            );
            break;
          }

          // Check if we have enough businesses for this strategy
          const maxBusinessesPerStrategy = 100;
          if (businesses.length >= maxBusinessesPerStrategy) {
            console.log(
              `  Reached max businesses (${maxBusinessesPerStrategy}) for ${strategy.name}`
            );
            break;
          }
        } catch (error) {
          const errorMsg = `Error on page ${currentPage} for ${strategy.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);

          // On error, wait longer and retry once
          await new Promise((resolve) => setTimeout(resolve, 500));

          // If it's a rate limit error, wait even longer
          if (error instanceof Error && error.message.includes("rate limit")) {
            console.log(
              `  Rate limit hit for ${strategy.name}, waiting 2 seconds...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          // Continue to next page instead of breaking
          continue;
        }
    } while (pageToken && currentPage < strategy.maxPages);

    strategy.pagesSearched = currentPage;
    const strategyTime = Date.now() - strategyStartTime;
    console.log(
        `  Strategy ${strategy.name} completed: ${businesses.length} businesses in ${strategyTime}ms (${currentPage} pages)`
    );

    return businesses;
  }

  private getAdaptiveDelay(responseTime: number): number {
    if (responseTime > 2000) return 200; // Slow response - longer delay
    if (responseTime < 500) return 50; // Fast response - shorter delay
    return 100; // Default delay
  }
}

export const tokyoStationsSearchService = new TokyoStationsSearchService();
