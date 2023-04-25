# WebSSH

这是一个基于Web的终端仿真器和SSH客户端的示例，使用Express框架搭建服务器，并使用NodeSSH代理到SSH服务器的Websocket连接。

## 示例图
![cover](./docs/c1.png)
![cover2](./docs/c2.png)
![cover3](./docs/c3.png)

## 功能
[✓]  支持IP登录

[✗] 支持地址栏传参进行登录

[✗] 后期规划是否需要支持密钥登录

[✗] 支持多tab窗口，可以随时开启和关闭多个会话窗口

[✓] 可以保存主机连接信息

[✓] 支持vim,mc,irssi,vifm,top语法

[✓] 支持复制和粘贴操作

[✓] 窗口自适应

[✗] 操作录像

[✓] 心跳重连

[✗] More...

## 前置要求

### Node

`node` 需要 `^16 || ^18 || ^19` 版本（`node >= 14` 需要安装 [fetch polyfill](https://github.com/developit/unfetch#usage-as-a-polyfill)），使用 [nvm](https://github.com/nvm-sh/nvm) 可管理本地多个 `node` 版本

```shell
node -v
```

### PNPM
如果你没有安装过 `pnpm`
```shell
npm install pnpm -g
```

## 构建

执行如下命令下载依赖并构建前端：

```shell
pnpm install && pnpm run build
```

如需构建 Docker 镜像，可以继续执行以下命令：

```shell
docker build --tag webssh:dev .
```

>**Note**：必须先构建前端后再构建 Docker 镜像，此举是为了减少安装 WebPack 导致的镜像体积增加。

## 启动

构建完成后，在**项目根目录**执行以下命令启动服务端：

```shell
node server/app
```

启动后访问 `http://127.0.0.1:8080` 即可。

#### Docker compose

[Hub 地址](https://hub.docker.com/repository/docker/yorlg/webssh/general)

```yml
version: '3'

services:
  app:
    image: yorlg/webssh # 总是使用 latest ,更新时重新 pull 该 tag 镜像即可
    ports:
      -    8080:8080
```

## 参与贡献

感谢所有做过贡献的人!

<a href="https://github.com/Yorlg/WebSSH/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Yorlg/WebSSH" />
</a>

## License
MIT © [Yorlg](./LICENSE)