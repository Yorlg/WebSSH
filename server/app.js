const express = require("express");
const server = express();
require("express-ws")(server);

server.use(express.static("static/"));
server.use(express.static("node_modules/"));

const readline = require('readline');
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function handleConnection(socket) {
    console.log('连接已建立');

    let isAlive = true;
    let timer = null;
    let sshCredentials;
    let sshCredentialsReceived = false; // 新增状态变量

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
                socket.terminate();
                return;
            }
            
            // 使用解析后的 SSH 凭据连接 SSH 服务器
            ssh.connect({
                host: sshCredentials.ip,
                port: sshCredentials.port,
                username: sshCredentials.username,
                password: sshCredentials.password,
            })
                .then(() => {
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
                            if (sshCredentialsReceived) { // 确保 SSH 凭据已接收
                                isAlive = true;
                                stream.write(data);
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
                    }).catch((err) => {
                        console.error('创建 SSH Shell 失败', err);
                        socket.terminate();
                        ssh.dispose(); // 关闭 SSH 连接
                    });
                }).catch((err) => {
                    console.error('SSH 连接错误', err);
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
        ssh.dispose(); // 关闭 SSH 连接
    });
}

server.ws("/ssh", (ws, req) => {
    // 连接成功后发送 test success
    console.info("WebSocket 连接已建立.");
    handleConnection(ws);
});

server.listen(8080, () => {
    console.info("服务器已启动");
});