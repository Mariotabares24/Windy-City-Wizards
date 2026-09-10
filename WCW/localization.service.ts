import { ShopperIntent, LocalizationResult } from "../../types";
import catalog from "../../data/catalog.json";
import { CatalogItem } from "../../types";

const REGION_MAP: Record<string, { currency: string; rate: number; region: string; weather: string }> = {
  "new york":    { currency: "USD", rate: 1.0,    region: "Northeast US",   weather: "warm & humid" },
  "london":      { currency: "GBP", rate: 0.79,   region: "UK",             weather: "mild & overcast" },
  "paris":       { currency: "EUR", rate: 0.92,   region: "Western Europe", weather: "warm & sunny" },
  "tokyo":       { currency: "JPY", rate: 149.5,  region: "East Asia",      weather: "hot & humid" },
  "sydney":      { currency: "AUD", rate: 1.52,   region: "Australia",      weather: "cool & dry" },
  "los angeles": { currency: "USD", rate: 1.0,    region: "West Coast US",  weather: "warm & sunny" },
  "berlin":      { currency: "EUR", rate: 0.92,   region: "Central Europe", weather: "mild & partly cloudy" },
  "toronto":     { currency: "CAD", rate: 1.36,   region: "Canada",         weather: "warm with afternoon showers" },
};

function resolveRegion(location: string) {
  const key = location.toLowerCase().trim();
  return (
    REGION_MAP[key] ||
    REGION_MAP[Object.keys(REGION_MAP).find((k) => key.includes(k)) || ""] ||
    { currency: "USD", rate: 1.0, region: "Global", weather: "varies by season" }
  );
}

export async function localizationAgent(
  intent: ShopperIntent
): Promise<LocalizationResult> {
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 150));

  const regionInfo = resolveRegion(intent.location);
  const typedCatalog = catalog as CatalogItem[];

  const localPrices: Record<string, number> = {};
  typedCatalog.forEach((item) => {
    localPrices[item.id] = Math.round(item.price * regionInfo.rate * 100) / 100;
  });

  return {
    agentId: "localization",
    currency: regionInfo.currency,
    region: regionInfo.region,
    localPrices,
    weatherContext: regionInfo.weather,
  };
}
