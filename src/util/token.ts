import Cookies from "js-cookie";

export function setToken(token: string) {
    // 有效期 1 天
    Cookies.set('token', token, {expires: 1});
}

export function getToken() {
    return Cookies.get('token');
}
