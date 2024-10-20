import {client} from "@/api/services.gen";
import {getToken, setToken} from "@/util/token";
import {showDialog} from "vant";
import router from "@/router";

client.setConfig({
    baseURL: "/api/v1",
});

client.instance.interceptors.request.use((config) => {
    getToken() && (config.headers.Authorization = `Bearer ${getToken()}`);
    return config;
});

client.instance.interceptors.response.use(
    (response) => {
        if (response.data?.code !== 0) {
            showDialog({message: response.data?.msg || "Unknown error"});
            if (response.data?.code === 401) {
                router.push("/login");
            }
            return Promise.reject(new Error(response.data?.msg || "Unknown error"));
        } else {
            console.log(response.headers);
            if (response.headers.authorization) {
                const token = response.headers.authorization;
                console.log(token);
                setToken(token);
            }
            return response;
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);
