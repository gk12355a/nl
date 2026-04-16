export const ENV = {
  AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL || "http://localhost:8007/api/v1/auth",
  ACCOUNT_API_URL: import.meta.env.VITE_ACCOUNT_API_URL || "http://localhost:8006/api/v1/users",
  REPORT_API_URL: import.meta.env.VITE_REPORT_API_URL || "http://localhost:8002",
  WEATHER_API_URL: import.meta.env.VITE_WEATHER_API_URL || "http://localhost:8001/weather",
};
