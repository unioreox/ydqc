import Cookies from "js-cookie";

export function setToken(token: string) {
    // 有效期 1 天
    Cookies.set('token', token, {expires: 1});
}

export async function getToken() {
    return new Promise<string | undefined>((resolve) => {
        const token = Cookies.get('token');
        resolve(token);
    });
}

export async function removeToken() {
    return new Promise<void>((resolve) => {
        // Cookies.remove('token');
        location.replace("/logout");
        resolve();
    });
}
