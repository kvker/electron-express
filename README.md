# Express + Electron H5游戏服务器

这是一个基于Express.js和Electron的H5游戏服务器应用，专门用于托管和运行H5游戏，支持局域网联机功能。应用通过Express服务器在3000端口提供游戏服务，并通过Electron框架提供桌面应用界面。

## 项目架构

- **Express服务器**: 在3000端口提供H5游戏服务
- **Electron桌面应用**: 提供桌面应用界面，加载本地Express服务器
- **游戏目录**: `game/` 文件夹包含H5游戏文件
- **局域网联机**: 支持多玩家局域网游戏功能

## 项目结构

```
├── game/                 # H5游戏文件目录
│   └── index.html       # 游戏主页面
├── public/              # 公共资源文件夹
├── plugins/             # 插件代码目录
├── out/                 # 打包后的应用程序
├── main.js              # Electron主进程文件
├── preload.js           # Electron预加载脚本
├── package.json         # 项目依赖配置
└── forge.config.js      # Electron Forge配置
```

## 功能特点

- **Express服务器**: 在3000端口提供静态文件服务
- **H5游戏托管**: 自动托管`game/`目录下的H5游戏
- **局域网联机**: 支持房间创建和多人游戏
- **桌面应用**: 通过Electron提供原生桌面体验
- **自动重载**: 开发模式下支持热重载

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式运行
```bash
npm run dev
```
这将启动Electron应用并连接到Express服务器（http://localhost:3000）

### 3. 调试模式
```bash
npm run debug
```
启动带有详细日志的调试模式

### 4. 打包应用
```bash
npm run make
```
生成可分发的应用程序包

## 游戏开发

### 添加游戏文件
将你的H5游戏文件放入`game/`目录：
- HTML文件
- CSS样式文件
- JavaScript游戏逻辑
- 游戏资源（图片、音频等）

### 局域网联机API
Express服务器提供以下API接口：

```javascript
// 创建游戏房间
GET /api/room/create
// 返回: { success: true, roomId: 'room_123' }

// 加入游戏房间
GET /api/room/join/:roomId

// 获取房间信息
GET /api/room/:roomId
```

### 游戏集成示例
在H5游戏中集成联机功能：

```javascript
// 创建房间
fetch('/api/room/create')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('房间创建成功:', data.roomId);
    }
  });

// 加入房间
function joinRoom(roomId) {
  fetch(`/api/room/join/${roomId}`)
    .then(response => response.json())
    .then(data => {
      console.log('加入房间:', data);
    });
}
```

## 配置说明

### 端口配置
默认端口为3000，可在`main.js`中修改：

```javascript
const port = 3000; // 修改为其他端口
```

### 游戏目录配置
游戏文件目录可在`main.js`中配置：

```javascript
expressApp.use(express.static(path.join(__dirname, 'game')));
```

## 开发调试

### 开发工具
- **Electron DevTools**: 按F12打开开发者工具
- **Express日志**: 控制台输出服务器状态
- **热重载**: 修改代码后自动重启应用

### 调试技巧
1. 使用`npm run debug`启动详细日志模式
2. 在Electron中按F12打开开发者工具
3. 检查Express服务器控制台输出
4. 使用网络面板调试API请求

## 部署说明

### 本地部署
1. 运行`npm run make`生成应用包
2. 在`out/`目录找到打包好的应用
3. 分发应用给其他用户

### 服务器部署
1. 将`game/`目录部署到Web服务器
2. 配置服务器支持H5游戏
3. 确保局域网内其他设备可以访问

## 注意事项

- 确保3000端口未被其他应用占用
- 局域网联机需要确保防火墙允许相关端口
- 游戏文件应放在`game/`目录下
- 开发模式下修改代码会自动重启应用

## 故障排除

### 常见问题

1. **端口被占用**
   - 错误: `EADDRINUSE: address already in use :::3000`
   - 解决: 修改`main.js`中的端口号或关闭占用端口的应用

2. **游戏无法加载**
   - 检查`game/`目录是否存在文件
   - 确认Express服务器是否正常启动
   - 检查浏览器控制台错误信息

3. **局域网联机失败**
   - 检查防火墙设置
   - 确认设备在同一局域网内
   - 检查网络配置

### 获取帮助
如果遇到问题，请检查：
1. 控制台错误信息
2. Express服务器状态
3. 网络连接状态
4. 游戏文件完整性

## 技术栈

- **后端**: Express.js
- **桌面应用**: Electron
- **游戏**: HTML5 + CSS3 + JavaScript
- **打包工具**: Electron Forge
- **开发语言**: Node.js, JavaScript

## 许可证

本项目采用MIT许可证，详见LICENSE文件。