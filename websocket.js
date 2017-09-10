// 心跳包对象
class HeartBeat {
    constructor(times) {
        this.timeout = times;
        this.timeoutObj = null;
        this.serverTimeout = null;
    }
    start(ws) { // 启动心跳包
        this.timeoutObj = setTimeout(() => {
            ws.send('HeartBeat');
            this.serverTimeout = setTimeout(()=>{
                ws.close();
            }, this.timeout);
        }, this.timeout);
    }
    rest() { // 重置心跳机制
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeout);
        return this;
    }
}

// 封装的websocket类
class WSConnect {
    constructor(url, token) {
        if (url == null || typeof(url) === 'undefined' || url == '') 
            throw new Error('服务器地址错误...');
        this.url = url;
        this.data = { token:token, msg:'' };
        this.restCount = 3;
        this.connectlock = false;
        this.socket = null;
        this.heartBeat = new HeartBeat(6000); // 初始化心跳包
    }
    init(callback) { // 初始化websocket对象
        try {
            this.socket = new WebSocket(this.url, this.data.token); // 创建websocket连接
        } catch (e) {
            this.reconnect(this.url);
        };
        this.socket.onopen = () => {
            this.heartBeat.rest().start(this); // 初始化心跳包
        }
        this.socket.onmessage = (evt) => {
            // 重置重连次数
            this.restCount = 3; 
            // 重置心跳包
            this.heartBeat.rest().start(this); 
            const data = evt.data;
            if (data === '0x01') {
                console.log('心跳包...');
                return;
            }
            // 回调接收到的数据
            callback(data);
        }
        this.socket.onclose = () => { // 关闭连接事件
            console.log('closed...');
            this.reconnect(this.url); // 重连
        }
        this.socket.onerror = () => { // 连接错误事件
            console.log('error...');
            this.reconnect(this.url); // 重连
        }
    }
    reconnect(url) { // 重连
        if (this.restCount <= 1)  return;
        if (this.connectlock) 
            return;
        this.connectlock = true;
        setTimeout(() => {
            this.init();
            this.connectlock = false;
            this.restCount--;    
        }, 3000)
    }
    send(data){ // 统一发送信息
        if (this.socket == null) 
            return;
        this.data.msg = data;
        this.socket.send(JSON.stringify(this.data));
    }
    close(){ // 关闭连接
        if (this.socket == null) 
            return;
        this.socket.close();
    }
}