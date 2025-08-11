// 初始化
export function initOHOSMessager() {
    let h5Port: any;
    let result: any;
    window.addEventListener('message', function (event: any) {
        if (event.data === '__init_port__') {
            if (event.ports[0] !== null) {
                h5Port = event.ports[0];
                localStorage.setItem('h5Port', h5Port);
                h5Port.onmessage = function (event: any) {
                    // 接收ets侧发送过来的消息
                    result = event.data;
                    h5Port.postMessage({
                        source: 'ydqc-frontend',
                        type: 'msg',
                        msg: 'Hello ArkTS',
                    });
                }
            }
        }
    })
}

export function sendOHOSMessage(h5Port: any,msg: any){
    h5Port.postMessage({
        source: 'ydqc-frontend',
        type: 'msg',
        msg: msg,
    })
}