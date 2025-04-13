export interface WeatherData {
    info: {
        timeStamp: number;
        infoSource: string;
        serverCore: string;
        author: string;
        state: boolean;
        sourceUrl: string[];
        msg: string;
    };
    cityData: {
        weatherinfo: {
            city: string;
            cityname: string;
            fctime: string;
            temp: string;
            tempn: string;
            weather: string;
            weathercode: string;
            weathercoden: string;
            wd: string;
            ws: string;
        };
    };
    alarmData: {
        w: Array<{
            w1: string;
            w2: string;
            w3: string;
            w4: string;
            w5: string;
            w6: string;
            w7: string;
            w8: string;
            w9: string;
            w10: string;
            w11: string;
            w12: string;
            w13: string;
            w14: string;
            w15: string;
            w16: string;
        }>;
    };
    airData: {
        forecasttime: string;
        aqi: number;
        aq: number;
        text: string;
        aqiCode: string;
    };
}