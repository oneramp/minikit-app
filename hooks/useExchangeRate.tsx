import { useQuery } from "@tanstack/react-query";
import { getCountryExchangeRate } from "@/actions/rates";
import { getInstitutions } from "@/actions/institutions";
import { ExchangeRateResponse, Institution } from "@/types";

interface UseExchangeRateParams {
  countryCode?: string;
  orderType: "buying" | "selling";
  providerType?: string;
}

// New optimized hook for pre-fetching all country rates
export function useAllCountryExchangeRates({
  orderType,
  providerType,
}: Omit<UseExchangeRateParams, "countryCode">) {
  return useQuery({
    queryKey: ["allCountryExchangeRates", orderType, providerType],
    queryFn: async () => {
      if (!providerType || !orderType) {
        throw new Error("Provider type and order type are required");
      }

      // Fetch rates for all supported countries
      const countries = ["NG", "KE", "GHA", "ZM", "UG", "TZ", "ZA"];
      const ratePromises = countries.map(async (countryCode) => {
        try {
          const rate = await getCountryExchangeRate({
            country: countryCode,
            orderType,
            providerType,
          });
          return { countryCode, rate };
        } catch (error) {
          console.error(`Failed to fetch rate for ${countryCode}:`, error);
          return { countryCode, rate: null };
        }
      });

      const results = await Promise.all(ratePromises);

      // Convert to a map for easy lookup
      const ratesMap = results.reduce((acc, { countryCode, rate }) => {
        if (rate) {
          acc[countryCode] = rate;
        }
        return acc;
      }, {} as Record<string, ExchangeRateResponse>);

      return ratesMap;
    },
    enabled: !!(providerType && orderType),
    staleTime: 60 * 1000, // 60 seconds - longer to reduce API calls
    refetchInterval: 5 * 60 * 1000, // 5 minutes - less frequent refetching
    retry: 2, // Fewer retries to avoid overwhelming the API
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
  });
}

// Optimized hook for pre-fetching institutions for all countries
export function useAllCountryInstitutions(method: "buy" | "sell" = "buy") {
  return useQuery({
    queryKey: ["allCountryInstitutions", method],
    queryFn: async () => {
      // Fetch institutions for all supported countries
      const countries = ["NG", "KE", "GHA", "ZM", "UG", "TZ", "ZA"];
      const institutionPromises = countries.map(async (countryCode) => {
        try {
          const institutions = await getInstitutions(countryCode, method);
          return { countryCode, institutions };
        } catch (error) {
          console.error(
            `Failed to fetch institutions for ${countryCode}:`,
            error
          );
          // Return empty array but log the error for debugging
          return { countryCode, institutions: [], error: String(error) };
        }
      });

      const results = await Promise.all(institutionPromises);

      // Convert to a map for easy lookup
      const institutionsMap = results.reduce(
        (acc, { countryCode, institutions }) => {
          acc[countryCode] = institutions;
          return acc;
        },
        {} as Record<string, Institution[]>
      );

      return institutionsMap;
    },
    enabled: true, // Always enabled to pre-fetch
    staleTime: 5 * 60 * 1000, // 5 minutes - institutions don't change often
    refetchInterval: 10 * 60 * 1000, // 10 minutes - very infrequent refetching
    retry: 3, // Increased retries for better reliability
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    // Retry on window focus to handle network issues
    refetchOnWindowFocus: true,
  });
}

// Original hook for backward compatibility
export function useExchangeRate({
  countryCode,
  orderType,
  providerType,
}: UseExchangeRateParams) {
  return useQuery({
    queryKey: ["exchangeRate", countryCode, orderType, providerType],
    queryFn: async () => {
      if (!countryCode || !providerType) {
        throw new Error("Country code and provider type are required");
      }

      return await getCountryExchangeRate({
        country: countryCode,
        orderType,
        providerType,
      });
    },
    enabled: !!countryCode && !!providerType,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for fresh rates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
