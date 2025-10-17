/**
 * Reverse Geocoding Utility
 * Converts coordinates to Japanese location names using Nominatim (OpenStreetMap) - FREE
 */

export interface ReverseGeocodeResult {
  locationName: string;
  success: boolean;
  error?: string;
}

/**
 * Reverse geocode coordinates to Japanese location name using Nominatim
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise<ReverseGeocodeResult>
 */
export async function reverseGeocodeToJapanese(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    console.log(`📍 [REVERSE_GEOCODE] Geocoding coordinates: ${lat}, ${lng}`);

    // Use Nominatim (OpenStreetMap) - FREE geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ja&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AutoReachPro/1.0", // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data && data.display_name) {
      // Extract concise Japanese location name
      let locationName = extractJapaneseLocationNameFromNominatim(data);

      // Fallback to display_name if extraction fails
      if (!locationName) {
        locationName =
          data.display_name ||
          `マップ検索 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }

      // Convert English names to Japanese if needed
      const japaneseLocationName = convertEnglishToJapanese(locationName || "");

      console.log(
        `✅ [REVERSE_GEOCODE] Success: ${locationName} -> ${japaneseLocationName}`
      );

      return {
        locationName: japaneseLocationName,
        success: true,
      };
    } else {
      console.warn(`⚠️ [REVERSE_GEOCODE] No results found from Nominatim`);
      return {
        locationName: `マップ検索 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        success: false,
        error: "No results from Nominatim",
      };
    }
  } catch (error) {
    console.error(`❌ [REVERSE_GEOCODE] Error:`, error);
    return {
      locationName: `マップ検索 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract concise Japanese location name from Nominatim response
 * @param data - Nominatim reverse geocoding response
 * @returns string | null
 */
function extractJapaneseLocationNameFromNominatim(data: {
  address?: Record<string, string>;
  display_name?: string;
}): string | null {
  if (!data || !data.address) {
    return null;
  }

  const address = data.address;
  const locationParts: string[] = [];

  // Priority order for Japanese location components - prioritize Japanese names
  const componentPriority = [
    "city", // 市
    "town", // 町
    "village", // 村
    "suburb", // 区
    "county", // 郡
    "state", // 都道府県
    "prefecture", // 都道府県 (alternative)
  ];

  // Extract components in priority order
  for (const component of componentPriority) {
    if (address[component]) {
      locationParts.push(address[component]);
    }
  }

  // Return the most specific location (first 2 parts)
  if (locationParts.length >= 2) {
    return `${locationParts[0]}, ${locationParts[1]}`;
  } else if (locationParts.length === 1) {
    return locationParts[0];
  }

  // Fallback: try to extract from display_name
  if (data.display_name) {
    const parts = data.display_name.split(",");
    if (parts.length >= 2) {
      // Take first two parts and clean them
      const firstPart = parts[0].trim();
      const secondPart = parts[1].trim();

      // Filter out common non-location terms
      const filteredParts = [firstPart, secondPart].filter(
        (part) =>
          !part.includes("日本") &&
          !part.includes("Japan") &&
          !part.includes("〒") &&
          part.length > 0
      );

      if (filteredParts.length >= 2) {
        return `${filteredParts[0]}, ${filteredParts[1]}`;
      } else if (filteredParts.length === 1) {
        return filteredParts[0];
      }
    }
  }

  return null;
}

/**
 * Convert English location names to Japanese equivalents
 * @param locationName - English location name
 * @returns Japanese location name
 */
function convertEnglishToJapanese(locationName: string): string {
  // Common English to Japanese mappings for Tokyo areas
  const englishToJapanese: Record<string, string> = {
    // Tokyo wards
    "Suginami-ku": "杉並区",
    "Shibuya-ku": "渋谷区",
    "Shinjuku-ku": "新宿区",
    "Chiyoda-ku": "千代田区",
    "Chuo-ku": "中央区",
    "Minato-ku": "港区",
    "Toshima-ku": "豊島区",
    "Kita-ku": "北区",
    "Arakawa-ku": "荒川区",
    "Itabashi-ku": "板橋区",
    "Nerima-ku": "練馬区",
    "Adachi-ku": "足立区",
    "Katsushika-ku": "葛飾区",
    "Edogawa-ku": "江戸川区",
    "Sumida-ku": "墨田区",
    "Koto-ku": "江東区",
    "Taito-ku": "台東区",
    "Bunkyo-ku": "文京区",
    "Meguro-ku": "目黒区",
    "Ota-ku": "大田区",
    "Setagaya-ku": "世田谷区",
    "Nakano-ku": "中野区",
    Shibuya: "渋谷区",
    Shinjuku: "新宿区",
    Chiyoda: "千代田区",
    Chuo: "中央区",
    Minato: "港区",
    Toshima: "豊島区",
    Kita: "北区",
    Arakawa: "荒川区",
    Itabashi: "板橋区",
    Nerima: "練馬区",
    Adachi: "足立区",
    Katsushika: "葛飾区",
    Edogawa: "江戸川区",
    Sumida: "墨田区",
    Koto: "江東区",
    Taito: "台東区",
    Bunkyo: "文京区",
    Meguro: "目黒区",
    Ota: "大田区",
    Setagaya: "世田谷区",
    Nakano: "中野区",
    Suginami: "杉並区",

    // Prefectures
    Tokyo: "東京都",
    "Tokyo Prefecture": "東京都",
    "Tokyo Metropolis": "東京都",
    Osaka: "大阪府",
    "Osaka Prefecture": "大阪府",
    Kyoto: "京都府",
    "Kyoto Prefecture": "京都府",
    Hyogo: "兵庫県",
    "Hyogo Prefecture": "兵庫県",
    Kanagawa: "神奈川県",
    "Kanagawa Prefecture": "神奈川県",
    Saitama: "埼玉県",
    "Saitama Prefecture": "埼玉県",
    Chiba: "千葉県",
    "Chiba Prefecture": "千葉県",
    Aichi: "愛知県",
    "Aichi Prefecture": "愛知県",
    Fukuoka: "福岡県",
    "Fukuoka Prefecture": "福岡県",
    Hokkaido: "北海道",
    "Hokkaido Prefecture": "北海道",
  };

  // Check for exact match first
  if (englishToJapanese[locationName]) {
    return englishToJapanese[locationName];
  }

  // Check for partial matches (e.g., "Suginami-ku, Tokyo" -> "杉並区, 東京都")
  const parts = locationName.split(",").map((part) => part.trim());
  const convertedParts = parts.map((part) => {
    // Try exact match first
    if (englishToJapanese[part]) {
      return englishToJapanese[part];
    }

    // Try with common suffixes
    const suffixes = ["-ku", "-shi", "-cho", "-machi", "-gun"];
    for (const suffix of suffixes) {
      const withoutSuffix = part.replace(suffix, "");
      if (englishToJapanese[withoutSuffix]) {
        return englishToJapanese[withoutSuffix];
      }
    }

    return part; // Return original if no conversion found
  });

  return convertedParts.join(", ");
}
