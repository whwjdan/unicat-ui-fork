// src/utils/apiClient.ts
import axios from "axios";
import { getCookie } from "cookies-next"; // 쿠키에서 JWT 토큰을 가져오고 설정하는 유틸리티
import { createHttpsAgent } from "@/src/utils/httpsAgent"; // httpsAgent 가져오기

// 서버와 클라이언트 환경에 따라 다른 baseURL 설정
const baseURL = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_URL  // 클라이언트 환경
    : process.env.API_URL;             // 서버 환경

const apiClient = axios.create({
    baseURL, // 환경에 맞는 baseURL 설정
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    httpsAgent: createHttpsAgent(), // httpsAgent를 axios 인스턴스에 추가   
});

// 요청 인터셉터: 각 요청에 JWT 토큰을 헤더에 추가
apiClient.interceptors.request.use(
    (config) => {
        console.log("요청된 URL - 서버 콘솔 확인:", config.baseURL ?? 'base' + config.url ?? '');
        const token = getCookie("Authorization"); // Authorization 쿠키에서 토큰 가져오기
        console.log("token", token);
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`; // JWT 토큰을 Authorization 헤더에 추가
        } else {
            // 쿠키에 토큰이 없을 경우
            console.log("No token available");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 백엔드에서 BYPASS로 쿠기가 전송되므로 기존 jwt 쿠기가 자동으로 덮어씌워짐
apiClient.interceptors.response.use(
    (response) => {
        console.log("API 응답 전체 헤더:", response.headers);
        
        return response;
    },
    (error) => {
        console.error("API 에러 응답:", error.response);
        if (error.response) {
            console.log("에러 응답 헤더:", error.response.headers);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
