import { PrismaClient } from "@/generated/prisma";
import { Business } from "@/types";

const prisma = new PrismaClient();

export async function saveBusinessContact(business: Business) {
  // Try to find by placeId, else by name+address
  let existing:
    | Awaited<ReturnType<typeof prisma.business.findUnique>>
    | Awaited<ReturnType<typeof prisma.business.findFirst>>
    | null = null;
  if (business.placeId) {
    existing = await prisma.business.findUnique({
        where: { placeId: business.placeId },
    });
  }
  if (!existing) {
    existing = await prisma.business.findFirst({
        where: {
          name: business.name,
          address: business.address,
        },
    });
  }

  // Helper: prefer new value if not null/empty, else keep old
  const prefer = <T>(newVal: T | undefined | null, oldVal: T): T => {
    if (newVal === undefined || newVal === null || newVal === "") return oldVal;
    return newVal;
  };

  if (existing) {
    // Only update fields that are new and non-empty, never overwrite admin edits with empty/old data
    const updated = await prisma.business.update({
        where: { id: existing.id },
        data: {
          name: prefer(business.name, existing.name),
          address: prefer(business.address, existing.address),
          phone: prefer(business.phone, existing.phone),
          website: prefer(business.website, existing.website),
          rating: prefer(business.rating, existing.rating),
          reviews: prefer(business.reviews, existing.reviews),
          user_ratings_total: prefer(
            business.user_ratings_total,
            existing.user_ratings_total
          ),
          price_level: prefer(business.price_level, existing.price_level),
          types:
            business.types && business.types.length > 0
              ? business.types
              : existing.types,
          category: prefer(business.category, existing.category),
          region: prefer(business.prefecture, existing.region),
          area: prefer(business.area, existing.area),
          coordinates: business.location
            ? business.location
            : (existing.coordinates as { lat: number; lng: number }),
          updatedAt: new Date(),
          // Never overwrite admin fields like email, contactPage, isVerified, notes, etc.
        },
    });
    return updated;
  } else {
    // Create new
    return prisma.business.create({
        data: {
          placeId:
            business.placeId ||
            `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: business.name,
          address: business.address,
          phone: business.phone ?? null,
          website: business.website ?? null,
          contactPage: null,
          rating: business.rating ?? null,
          reviews: business.reviews ?? null,
          user_ratings_total: business.user_ratings_total ?? null,
          price_level: business.price_level ?? null,
          types: business.types ?? [],
          category: business.category,
          region: business.prefecture ?? null,
          area: business.area ?? null,
          coordinates: business.location ? business.location : {},
          status: "DISCOVERED",
          isVerified: false,
          lastSearched: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
    });
  }
}

export async function saveSearchHistory(params: {
  userId: string;
  searchType: string;
  category: string;
  keywords?: string;
  regions: string[];
  areas: string[];
  stations: string[];
  maxResults: number;
  timeLimit: number;
  totalFound: number;
  searchTime: number;
  status: string;
  error?: string;
}) {
  return prisma.searchHistory.create({
    data: {
        userId: params.userId,
        searchType: params.searchType as
          | "REGION"
          | "AREA"
          | "STATION"
          | "COMPREHENSIVE",
        category: params.category,
        keywords: params.keywords,
        regions: params.regions,
        areas: params.areas,
        stations: params.stations,
        maxResults: params.maxResults,
        timeLimit: params.timeLimit,
        totalFound: params.totalFound,
        searchTime: params.searchTime,
        status: params.status as
          | "IN_PROGRESS"
          | "COMPLETED"
          | "FAILED"
          | "CANCELLED",
        error: params.error,
        createdAt: new Date(),
    },
  });
}

export async function saveSearchResult(params: {
  searchHistoryId: string;
  businessContactId: string;
  region: string;
  area: string;
  station?: string;
  isFromCache: boolean;
  cacheAge?: number;
}) {
  return prisma.searchResult.create({
    data: {
        searchHistoryId: params.searchHistoryId,
        businessId: params.businessContactId,
        region: params.region,
        area: params.area,
        station: params.station,
        isFromCache: params.isFromCache,
        cacheAge: params.cacheAge,
        searchDate: new Date(),
    },
  });
}

export async function getCachedResults(params: {
  region: string;
  area: string;
  station: string;
  category: string;
  keywords?: string;
  cacheDurationHours: number;
}): Promise<Business[] | null> {
  // Query SearchResult/BusinessContact for recent results
  const since = new Date(
    Date.now() - params.cacheDurationHours * 60 * 60 * 1000
  );
  const results = await prisma.searchResult.findMany({
    where: {
        region: params.region,
        area: params.area,
        station: params.station,
        isFromCache: false,
        searchDate: { gte: since },
        business: {
          category: params.category,
          // Optionally filter by keywords if needed
        },
    },
    include: { business: true },
  });
  if (!results.length) return null;
  return results.map((r) => ({ ...r.business } as Business));
}

export async function editBusinessContact(params: {
  id: string;
  name?: string;
  website?: string;
  email?: string;
  contactPage?: string;
  phone?: string;
  isVerified?: boolean;
  notes?: string;
}) {
  // Update BusinessContact fields
  return prisma.business.update({
    where: { id: params.id },
    data: {
        name: params.name,
        website: params.website,
        contactPage: params.contactPage,
        phone: params.phone,
        isVerified: params.isVerified,
        updatedAt: new Date(),
    },
  });
}
