const ssh = require('ssh2');
const http = require('http');
const WebSocket = require('ws');
const readline = require('readline');

const conn = new ssh.Client();
const wss = new WebSocket.Server({ noServer: true });

// 处理 SSH 连接和 WebSocket 连接
function handleConnection (socket) {
  console.log('连接已建立');

  let isAlive = true;
  let timer = null;

  // 检查客户端是否活跃
  const checkAlive = () => {
    if (!isAlive) {
      console.log('WebSocket 连接已超时');
      socket.terminate();
      return;
    }

    isAlive = false;
    socket.ping(null, { mask: false, binary: true })

    timer = setTimeout(checkAlive, 60000); // 1 分钟
  };

  // 建立 SSH 连接
  conn.on('ready', () => {
    console.log('SSH 连接已建立');

    // 创建 SSH Shell
    conn.shell((err, stream) => {
      if (err) throw err;

      // 使用 readline 处理终端输入
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.on('line', (line) => {
        stream.write(line);
      });

      // 处理 SSH Shell 输入和输出
      stream.on('data', (data) => {
        isAlive = true;
        socket.send(data.toString());
      });

      socket.on('message', (data) => {
        isAlive = true;
        stream.write(data);
      });

      socket.on('close', () => {
        console.log('WebSocket 连接已关闭');
        isAlive = true;
        stream.end();
        conn.end();
      });

      // 开始心跳检测
      timer = setTimeout(checkAlive, 60000); // 1 分钟
    });

    // 监听 SSH 连接错误
    conn.on('error', (err) => {
      console.error('SSH 连接错误', err);
      socket.terminate();
    });
  }).connect({
    host: '127.0.0.1',
    port: 9595,
    username: 'qqq',
    password: 'qqq',
  });

  // 监听 WebSocket 连接错误
  socket.on('error', (err) => {
    console.error('WebSocket 连接错误', err);
    conn.end();
  });
}

// 创建 HTTP 服务器和 WebSocket 代理服务器
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket 代理服务器');
});

server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket 连接已升级');
  wss.handleUpgrade(request, socket, head, handleConnection);
});

server.listen(3000, () => {
  console.log('服务器已启动');
});