/**
 * WGS84坐标系转GCJ02坐标系（火星坐标系）
 * 
 * @param {number} lng WGS84坐标系的经度
 * @param {number} lat WGS84坐标系的纬度
 * @returns {[number, number]} 返回GCJ02坐标系的[经度, 纬度]
 */
export function wgs84ToGcj02New(lng: number, lat: number): [number, number] {
    // 判断是否在中国境内，如果不在国内，则不进行偏移
    if (outOfChina(lng, lat)) {
        return [lng, lat];
    }

    let dlat = transformLat(lng - 105.0, lat - 35.0);
    let dlng = transformLng(lng - 105.0, lat - 35.0);

    const radlat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radlat);
    magic = 1 - 0.00669342162296594323 * magic * magic;

    const sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) / (magic * sqrtmagic) * Math.PI);
    dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic * Math.cos(radlat) * Math.PI);

    const mglat = lat + dlat;
    const mglng = lng + dlng;

    return [mglng, mglat];
}

/**
 * 判断坐标是否在中国境内
 */
function outOfChina(lng: number, lat: number) {
    if (lng < 72.004 || lng > 137.8347) {
        return true;
    }
    if (lat < 0.8293 || lat > 55.8271) {
        return true;
    }
    return false;
}

/**
 * 经度偏移转换
 */
function transformLng(lng: number, lat: number) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
}

/**
 * 纬度偏移转换
 */
function transformLat(lng: number, lat: number) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
}