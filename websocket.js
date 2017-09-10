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
    constructor(url, token, testObj) {
        if (url == null || typeof(url) === 'undefined' || url == '') 
            throw new Error('服务器地址错误...');
        this.url = url;
        this.data = { token:token, msg:'' };
        this.restCount = 3;
        this.connectlock = false;
        this.socket = null;
        this.heartBeat = new HeartBeat(6000); // 初始化心跳包
        // 测试显示状态
        this.testObj = testObj || {
            currentState: null,
            sendState: null,
            receive: null
        }; 
    }
    init(callback) { // 初始化websocket对象
        try {
            this.socket = new WebSocket(this.url, this.data.token); // 创建websocket连接
        } catch (e) {
             if(this.socket.readyState == 3) { // 无法打开websocket
                console.log('websocket无法打开...');
                // 测试显示
                if(!objIsNull(this.testObj) && !objIsNull(this.testObj.currentState))
                    this.testObj.currentState.innerText = 'websocket无法打开...';
                return;
            }
            this.reconnect(this.url);// 重连
        };
        this.socket.onopen = () => {
            this.heartBeat.rest().start(this); // 初始化心跳包
            // 测试显示
            if(!objIsNull(this.testObj) && !objIsNull(this.testObj.currentState))
                this.testObj.currentState.innerText = 'websocket已连接...';
        }
        this.socket.onmessage = (evt) => {
            this.restCount = 3; // 重置重连次数
            this.heartBeat.rest().start(this); // 重置心跳包
            const data = evt.data;
            if (data === '0x01') {
                console.log('心跳包...');
                return;
            }
            // 回调接收到的数据
            callback(data);
            // 测试显示
            if(!objIsNull(this.testObj) && !objIsNull(this.testObj.receive))
                this.testObj.receive.innerText = data;
        }
        this.socket.onclose = () => { // 关闭连接事件
            // 无法打开websocket
            if(this.socket.readyState == 3) {
                console.log('close: websocket无法打开...');
                // 测试显示
                if(!objIsNull(this.testObj) && !objIsNull(this.testObj.currentState))
                    this.testObj.currentState.innerText = 'websocket无法打开...';
                return;
            }
            console.log('closed...');
            this.reconnect(this.url); // 重连
        }
        this.socket.onerror = () => { // 连接错误事件
            if(this.socket.readyState == 3) { // 无法打开websocket
                console.log('error: websocket无法打开...');
                // 测试显示
                if(!objIsNull(this.testObj) && !objIsNull(this.testObj.currentState))
                    this.testObj.currentState.innerText = 'websocket无法打开...';
                return;
            }
            console.log('error...');
            this.reconnect(this.url); // 重连

            
        }
    }
    reconnect(url) { // 重连
        if (this.socket.readyState == this.socket.OPEN) {
            console.log('已连接...');
            return;
        }
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
        if (this.socket == null || this.socket.readyState != this.socket.OPEN) {
            alert('websocket未打开...');
            return;
        }
        this.data.msg = data;
        this.socket.send(JSON.stringify(this.data));
        
        // 测试显示
        if(data === 'HeartBeat')
            return;
        if(!objIsNull(this.testObj) && !objIsNull(this.testObj.sendState))
            this.testObj.sendState.innerText = data+'已发送...';
    }
    close(){ // 关闭连接
        if (this.socket == null) 
            return;
        if (this.socket.readyState == this.socket.CLOSING) {
            alert('正在关闭中...');
            return;
        }
        this.socket.close();
    }
}

// 判断对象是否为空
function objIsNull(obj){
    return obj == null || typeof(obj) === 'undefined' || typeof(obj) === 'string';
}