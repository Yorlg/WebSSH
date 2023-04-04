# WebSSH

HTML5基于Web的终端仿真器和SSH客户端的基本示例。我们使用SSH2作为主机上的客户机来代理到SSH2服务器的Websocket
ws连接。

## 功能
- [ ] 支持多tab窗口模型，可以随时开启和关闭多个会话窗口
- [ ] 可以保存主机连接信息
- [x] 支持vim,mc,irssi,vifm,top语法
- [x] 支持复制和粘贴操作
- [ ] 窗口自适应
- [ ] 操作录像
- [ ] 心跳重连

## 环境
Node >= 14 

## 启动
下载依赖
npm install  

启动程序
node ssh.js

访问：http://127.0.0.1:3000
