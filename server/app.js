const http = require('http');
const WebSocket = require('ws');
const readline = require('readline');
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
const wss = new WebSocket.Server({ noServer: true });

function handleConnection (socket) {
  console.log('连接已建立');

  let isAlive = true;
  let timer = null;

  // 设置最大监听器数量
  socket.setMaxListeners(15);

  // 检查客户端是否活跃
  const checkAlive = () => {
    if (!isAlive) {
      console.log('WebSocket 连接已超时');
      socket.terminate();
      return;
    }

    isAlive = false;
    socket.ping(null, { mask: false, binary: true });

    timer = setTimeout(checkAlive, 1000 * 60 * 10); // 10 分钟
  };

  // 连接 SSH 服务器
  ssh.connect({
    host: '127.0.0.1',
    port: 9595,
    username: 'qqq',
    password: 'qqq',
  }).then(() => {
    console.log('SSH 连接已建立');

    // 创建 SSH Shell
    ssh.requestShell().then((stream) => {
      // 使用 readline 处理终端输入
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
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
        ssh.dispose(); // 关闭 SSH 连接
        socket.terminate();
      });

      // 开始心跳检测
      timer = setTimeout(checkAlive, 1000 * 60 * 10); // 10 分钟
    }).catch((err) => {
      console.error('创建 SSH Shell 失败', err);
      socket.terminate();
      ssh.dispose(); // 关闭 SSH 连接
    });
  }).catch((err) => {
    console.error('SSH 连接错误', err);
    socket.terminate();
  });

  // 监听 WebSocket 连接错误
  socket.on('error', (err) => {
    console.error('WebSocket 连接错误', err);
    ssh.dispose(); // 关闭 SSH 连接
  });
}

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
