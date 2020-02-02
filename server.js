const http = require('http');
const app = require('./app');

const Port = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(Port,()=>{
    console.log('listening to the server port : 3001');
});