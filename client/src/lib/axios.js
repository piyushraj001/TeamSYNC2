import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

// Attach access token to every request
axiosInstance.interceptors.request.use((config) => {
    const token = Cookies.get("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Token refresh logic ──────────────────────────────────────────────────────
// Track if a refresh is already in progress to avoid multiple parallel refresh calls
let isRefreshing = false;
let failedQueue = []; // requests that failed while refresh was in progress

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url || "";

        // Don't try to refresh on auth endpoints themselves
        const isAuthEndpoint =
            url.includes("auth/login") ||
            url.includes("auth/register") ||
            url.includes("auth/refresh");

        // If we got a 401 on a non-auth endpoint and haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            const refreshToken = Cookies.get("refreshToken");

            // No refresh token at all — go to login
            if (!refreshToken) {
                Cookies.remove("accessToken");
                Cookies.remove("refreshToken");
                if (typeof window !== "undefined") {
                    window.location.href = "/auth/login";
                }
                return Promise.reject(error);
            }

            // If already refreshing, queue this request to retry after
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            // Mark retry so this request doesn't loop
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh endpoint with the refresh token in the body
                const res = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                const newAccessToken = res.data.accessToken;
                Cookies.set("accessToken", newAccessToken, { expires: 7 });

                // Update the Authorization header for the original request
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Resolve all queued requests with the new token
                processQueue(null, newAccessToken);

                // Retry the original request
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed — clear everything and redirect to login
                processQueue(refreshError, null);
                Cookies.remove("accessToken");
                Cookies.remove("refreshToken");
                if (typeof window !== "undefined") {
                    window.location.href = "/auth/login";
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;