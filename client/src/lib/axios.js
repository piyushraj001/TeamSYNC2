import axios from "axios";
import Cookies from "js-cookie";

export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
    withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
    const token = Cookies.get("accessToken");
    if(token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

axiosInstance.interceptors.response.use(
    (res) => res,
    (error) => {
        if(error.response?.status === 401){
            Cookies.remove("accessToken");
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

axiosInstance.interceptors.request.use((config) => {
    const token = Cookies.get("accessToken");
    if(token) config.headers.Authorization = `Bearer ${token}`;
    return config;
})

axiosInstance.interceptors.response.use(
    (res) => res,
    (error) => {
        if(error.response?.status === 401){
            Cookies.remove("accessToken");
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);