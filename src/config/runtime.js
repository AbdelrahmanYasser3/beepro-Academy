export const runtimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  useMockData:
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === "true",
  mockRole:
    import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === "true"
      ? import.meta.env.VITE_MOCK_ROLE || ""
      : "",
};
