const X_PI = Math.PI * 3000.0 / 180.0;
const PI = Math.PI;
const RADIUS = 6378137.0;

export function wgs84ToGcj02(strIn) {
    let latLonStr = strIn;
    let [latitude, longitude] = latLonStr.split(',').map(Number);
    if (isNaN(latitude) || isNaN(longitude)) {
        console.log("坐标值错误, 无法计算")
        return;
    }
    let selectedType = 'WGS84';

    let wgs84, gcj02, bd09, bd09mc, epsg3857;

    if (selectedType === "WGS84") {
        wgs84 = [latitude, longitude];
        gcj02 = toGCJ02(latitude, longitude);
        bd09 = toBD09FromWGS84(latitude, longitude);
        bd09mc = toBD09MC(bd09[0], bd09[1]);
        epsg3857 = toEPSG3857(latitude, longitude);
    } else if (selectedType === "GCJ02") {
        wgs84 = toWGS84(latitude, longitude);
        gcj02 = [latitude, longitude];
        bd09 = toBD09(latitude, longitude);
        bd09mc = toBD09MC(bd09[0], bd09[1]);
        epsg3857 = toEPSG3857(wgs84[0], wgs84[1]);
    } else if (selectedType === "BD09") {
        wgs84 = toWGS84FromBD09(latitude, longitude);
        gcj02 = toGCJ02FromBD09(latitude, longitude);
        bd09 = [latitude, longitude];
        bd09mc = toBD09MC(latitude, longitude);
        epsg3857 = toEPSG3857(wgs84[0], wgs84[1]);
    } else if (selectedType === "BD09MC") {
        bd09 = toBD09FromBD09MC(latitude, longitude);
        if (bd09) {
            gcj02 = toGCJ02FromBD09(bd09[0], bd09[1]);
            wgs84 = toWGS84(gcj02[0], gcj02[1]);
            bd09mc = [latitude, longitude];
            epsg3857 = toEPSG3857(wgs84[0], wgs84[1]);
        }
    } else if (selectedType === "EPSG3857") {
        wgs84 = toWGS84FromEPSG3857(latitude, longitude);
        if (wgs84) {
            gcj02 = toGCJ02(wgs84[0], wgs84[1]);
            bd09 = toBD09(wgs84[0], wgs84[1]);
            bd09mc = toBD09MC(bd09[0], bd09[1]);
            epsg3857 = [latitude, longitude];
        }
    }

    // return wgs84 ? `${wgs84[0]},${wgs84[1]}` : '';
    return [gcj02[0], gcj02[1]];
}

// function Empty() {
//     $("input").val("");
// }

// Helper Functions
function outOfChina(lat: any, lon: any) {
    return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: any, y: any) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLon(x: any, y: any) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}

// Missing Coordinate Conversion Implementations
function toWGS84FromEPSG3857(y: any, x: any) {
    if (isNaN(x) || isNaN(y)) {
        return null;
    }
    const lon = x / 20037508.34 * 180;
    const lat = (2 * Math.atan(Math.exp(y / 20037508.34 * 180 * PI / 180)) - PI / 2) * 180 / PI;
    return [lat, lon];
}

function toGCJ02(lat: any, lon: any) {
    if (outOfChina(lat, lon)) return [lat, lon];
    let dLat = transformLat(lon - 105.0, lat - 35.0);
    let dLon = transformLon(lon - 105.0, lat - 35.0);
    const radLat = lat / 180.0 * PI;
    const magic = Math.sin(radLat);
    const sqrtMagic = Math.sqrt(1 - 0.00669342162296594323 * magic * magic);
    dLat = (dLat * 180.0) / ((RADIUS * (1 - 0.00669342162296594323)) / (sqrtMagic * Math.cos(radLat)) * PI);
    dLon = (dLon * 180.0) / (RADIUS / sqrtMagic * Math.cos(radLat) * PI);
    return [lat + dLat, lon + dLon];
}

function toWGS84(lat: any, lon: any) {
    const [gcjLat, gcjLon] = toGCJ02(lat, lon);
    return [lat * 2 - gcjLat, lon * 2 - gcjLon];
}

function toBD09(lat: any, lon: any) {
    const x = lon, y = lat;
    const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * X_PI);
    const bdLon = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    return [bdLat, bdLon];
}

function toGCJ02FromBD09(lat: any, lon: any) {
    const x = lon - 0.0065, y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
    const gcjLon = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    return [gcjLat, gcjLon];
}

function toWGS84FromBD09(lat: any, lon: any) {
    const [gcjLat, gcjLon] = toGCJ02FromBD09(lat, lon);
    return toWGS84(gcjLat, gcjLon);
}

function toBD09FromWGS84(lat: any, lon: any) {
    const [gcjLat, gcjLon] = toGCJ02(lat, lon);
    return toBD09(gcjLat, gcjLon);
}

function toBD09MC(lat: any, lon: any) {
    if (isNaN(lat) || isNaN(lon)) {
        return [NaN, NaN];
    }
    const x = lon * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + lat) * PI / 360)) / (PI / 180);
    const mcY = y * 20037508.34 / 180;
    return [x, isFinite(mcY) ? mcY : NaN];
}

function toBD09FromBD09MC(mercatorY: any, mercatorX: any) {
    if (isNaN(mercatorX) || isNaN(mercatorY)) {
        return null;
    }
    const x = mercatorX / 20037508.34 * 180;
    const y = mercatorY / 20037508.34 * 180;
    const lat = (2 * Math.atan(Math.exp(y * PI / 180)) - PI / 2) * 180 / PI;
    const lon = x;
    return [lat, lon];
}

function toEPSG3857(lat: any, lon: any) {
    if (isNaN(lat) || isNaN(lon)) {
        return [NaN, NaN];
    }
    const x = lon * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + lat) * PI / 360)) / (PI / 180);
    const epsgY = y * 20037508.34 / 180;
    return [x, isFinite(epsgY) ? epsgY : NaN];
}