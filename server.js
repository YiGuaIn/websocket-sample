const webSocket = require('ws').Server;
const server = new webSocket({port: 3000});
let client = null;

server.on('connection', (ws) => {
    client = ws;
    client.on('message', (obj) => {
        obj = JSON.parse(obj);
        if(obj.msg === 'HeartBeat'){ // 心跳处理
            console.log(client.protocol +": "+ obj.msg);
            server.broadcast(obj.token,'0x01'); 
            // client.send('0x01');
            return;
        }
        console.log(client.protocol +": "+ obj.msg);
        // 业务处理
        server.broadcast(obj.token, obj.msg); 
    });
    client.on('close', () => {
        console.log('close...');
    })
    client.on('error', () => {
        console.log('error...');
    })
})
server.broadcast = function broadcast(token,msg) {
    if(token === client.protocol){
        client.send(msg);  
    }
};  