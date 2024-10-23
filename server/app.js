const express = require('express');
const server = express();
const compression = require('compression');
require('express-ws')(server, null, {
  // 设置最大负载大小为16MB
  wsOptions: {
    maxPayload: 16 * 1024 * 1024,
  },
});

// 启用压缩
server.use(compression());

server.use(express.static('./dist/'));

const readline = require('readline');
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function handleConnection(socket) {
  console.log('连接已建立');

  let isAlive = true;
  let timer = null;
  let sshCredentials;
  let sshCredentialsReceived = false;

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

  socket.on('message', (data) => {
    // 如果尚未接收到 SSH 凭据，则尝试解析 JSON
    if (!sshCredentialsReceived) {
      try {
        sshCredentials = JSON.parse(data);
        sshCredentialsReceived = true; // 更新状态变量
      } catch (err) {
        console.error('解析 SSH 凭据时出错', err);
        socket.send(JSON.stringify({ error: 'SSH 凭证无效' }));
        socket.terminate();
        return;
      }

      // 使用解析后的 SSH 凭据连接 SSH 服务器
      ssh
        .connect({
          host: sshCredentials.ip,
          port: sshCredentials.port,
          username: sshCredentials.username,
          password: sshCredentials.password,
        })
        .then(() => {
          console.log('SSH 连接已建立');

          // 创建 SSH Shell
          ssh
            .requestShell()
            .then((stream) => {
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

              // socket.on('message', (data) => {
              //     // if (sshCredentialsReceived) { // 确保 SSH 凭据已接收
              //     //     isAlive = true;
              //     //     stream.write(data);
              //     // }
              // });

              socket.on('message', (data) => {
                if (typeof data !== 'string') {
                  console.error('接收到非字符串信息');
                  return; // 提前返回以避免深层嵌套
                }

                try {
                  const message = JSON.parse(data);

                  if (message.action === 'resize') {
                    // 调整终端大小
                    stream.setWindow(message.rows, message.cols);
                  } else if (sshCredentialsReceived) {
                    // 处理非 'resize' 操作的消息
                    isAlive = true;
                    stream.write(data);
                  }
                } catch (e) {
                  // 解析失败，但数据是字符串
                  if (sshCredentialsReceived) {
                    isAlive = true;
                    stream.write(data);
                  } else {
                    console.error('SSH 凭据未接收');
                  }
                }
              });

              socket.on('close', () => {
                console.log('WebSocket 连接已关闭');
                isAlive = true;
                ssh.dispose(); // 关闭 SSH 连接
                socket.terminate();
              });

              // 开始心跳检测
              timer = setTimeout(checkAlive, 1000 * 60 * 10); // 10 分钟
            })
            .catch((err) => {
              console.error('创建 SSH Shell 失败', err);
              socket.send(JSON.stringify({ error: '无法创建 SSH shell' }));
              socket.terminate();
              ssh.dispose(); // 关闭 SSH 连接
            });
        })
        .catch((err) => {
          console.error('SSH 连接错误', err);
          socket.send(JSON.stringify({ error: 'SSH 连接错误' }));
          socket.terminate();
        });
    } else {
      // 处理非 SSH 凭据的数据（终端输入）
      if (sshCredentialsReceived) {
        isAlive = true;
      }
    }
  });

  // 监听 WebSocket 连接错误
  socket.on('error', (err) => {
    console.error('WebSocket 连接错误', err);
    socket.send(JSON.stringify({ error: 'WebSocket 连接错误' }));
    ssh.dispose(); // 关闭 SSH 连接
  });

  // 监听 WebSocket 连接关闭
  socket.on('close', () => {
    console.log('WebSocket 连接已关闭');
    socket.send(JSON.stringify({ error: 'WebSocket 连接已关闭' }));
    ssh.dispose(); // 关闭 SSH 连接
  });
}

server.ws('/ssh', (ws, req) => {
  // 连接成功后发送 test success
  console.info('WebSocket 连接已建立.');
  handleConnection(ws);
});

server.listen(8080, () => {
  console.info('服务器已启动');
});
