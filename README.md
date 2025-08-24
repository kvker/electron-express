# Express + Electron H5游戏服务器

这是一个基于Express.js和Electron的H5游戏服务器应用，专门用于托管和运行H5游戏，支持局域网联机功能。应用通过Express服务器在3000端口提供游戏服务，并通过Electron框架提供桌面应用界面。

## 项目架构

- **Express服务器**: 在3000端口提供H5游戏服务
- **Electron桌面应用**: 提供桌面应用界面，加载本地Express服务器
- **游戏目录**: `game/` 文件夹包含H5游戏文件
- **局域网联机**: 支持多玩家局域网游戏功能
- **通用数据传递**: 支持任意JSON对象的数据模型传递

## 项目结构

```
├── game/                 # H5游戏文件目录
│   └── index.html       # 游戏主页面（包含配置界面）
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
- **通用数据传递**: 支持任意JSON对象的数据模型
- **角色管理**: 支持主机(Host)和客户端(Client)角色设置
- **IP配置**: 可自定义主机IP地址和端口号
- **房间管理**: 支持开房间、加入房间、重置房间等功能

## 核心功能

### 1. 开房间（创建房间）
- 设置角色为主机(Host)
- 自动生成唯一房间ID
- 启动HTTP服务器等待客户端连接

### 2. 加入房间
- 设置角色为客户端(Client)
- 配置主机IP地址和端口
- 连接到指定主机房间

### 3. 提交数据
- 支持任意JSON对象的数据模型
- 主机可本地提交数据
- 客户端可提交数据到主机
- 数据按玩家ID和数据类型分类存储

### 4. 获取数据
- 获取所有数据
- 按玩家ID筛选数据
- 按数据类型筛选数据
- 支持组合筛选

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

## 使用方法

### 1. 配置应用
- 选择角色：主机(Host) 或 客户端(Client)
- 设置主机IP地址（默认127.0.0.1）
- 设置端口号（默认3000）
- 点击"应用配置"按钮

### 2. 主机模式
- 应用配置成功后自动创建房间
- 显示房间ID和状态信息
- 可查看房间状态、重置房间
- 可本地提交数据

### 3. 客户端模式
- 应用配置成功后连接到主机
- 可提交数据到主机
- 可从主机获取数据

### 4. 数据操作
- 提交数据：指定玩家ID、数据类型和JSON内容
- 获取数据：支持多种筛选方式
- 实时日志：显示所有操作结果

## API接口

### HTTP API（主机提供）
```
POST /api/room/join          # 加入房间
POST /api/data/submit        # 提交数据
GET  /api/data/get          # 获取数据
GET  /api/room/status       # 获取房间状态
```

### IPC API（Electron通信）
```javascript
// 应用配置
setAppConfig(config)         # 设置应用配置
getAppConfig()               # 获取应用配置

// 房间管理
getRoomStatus()              # 获取房间状态
resetRoom()                  # 重置房间

// 数据操作
submitData(data)             # 主机本地提交数据
submitDataToHost(data)       # 客户端提交数据到主机
getData(params)              # 获取数据

// 事件监听
onPlayerJoined(callback)     # 玩家加入事件
onDataSubmitted(callback)    # 数据提交事件
onRoomReset(callback)        # 房间重置事件
```

## 数据模型

### 提交数据格式
```javascript
{
  playerId: "player1",           // 玩家ID
  dataType: "score",             // 数据类型
  payload: { value: 100 }        // 数据内容（任意JSON对象）
}
```

### 数据存储结构
```javascript
{
  "player1_score": {
    playerId: "player1",
    dataType: "score",
    payload: { value: 100 },
    timestamp: "2024-01-01T12:00:00.000Z"
  }
}
```

## 游戏开发

### 添加游戏文件
将你的H5游戏文件放入`game/`目录：
- HTML文件
- CSS样式文件
- JavaScript游戏逻辑
- 游戏资源（图片、音频等）

### 集成联机功能
在H5游戏中集成联机功能：

```javascript
// 设置应用配置
const config = { 
  role: 'client', 
  hostIP: '192.168.1.100', 
  port: 3000 
};
const result = await window.electronAPI.setAppConfig(config);

// 提交游戏数据
const gameData = {
  playerId: 'player1',
  dataType: 'gameState',
  payload: { 
    position: { x: 100, y: 200 },
    health: 80,
    score: 1500
  }
};
await window.electronAPI.submitDataToHost(gameData);

// 获取其他玩家数据
const otherPlayersData = await window.electronAPI.getData({ 
  playerId: 'player2' 
});
```

## 配置说明

### 端口配置
默认端口为3000，可在配置界面中修改

### 主机IP配置
- 本地测试：127.0.0.1
- 局域网：192.168.x.x（你的局域网IP）
- 公网：公网IP地址

### 角色配置
- **主机(Host)**: 创建房间，管理玩家和数据
- **客户端(Client)**: 加入房间，提交和获取数据

## 开发调试

### 开发工具
- **Electron DevTools**: 按F12打开开发者工具
- **Express日志**: 控制台输出服务器状态
- **实时日志**: 界面显示所有操作结果

### 调试技巧
1. 使用`npm run debug`启动详细日志模式
2. 在Electron中按F12打开开发者工具
3. 检查Express服务器控制台输出
4. 使用界面日志面板调试操作

## 部署说明

### 本地部署
1. 运行`npm run make`生成应用包
2. 在`out/`目录找到打包好的应用
3. 分发应用给其他用户

### 局域网部署
1. 主机设置角色为Host，IP为0.0.0.0
2. 客户端设置角色为Client，IP为主机局域网IP
3. 确保防火墙允许3000端口通信

### 服务器部署
1. 将`game/`目录部署到Web服务器
2. 配置服务器支持H5游戏
3. 确保局域网内其他设备可以访问

## 注意事项

- 确保3000端口未被其他应用占用
- 局域网联机需要确保防火墙允许相关端口
- 游戏文件应放在`game/`目录下
- 开发模式下修改代码会自动重启应用
- 主机IP设置为0.0.0.0可接受所有网络接口的连接

## 故障排除

### 常见问题

1. **端口被占用**
   - 错误: `EADDRINUSE: address already in use :::3000`
   - 解决: 修改端口号或关闭占用端口的应用

2. **游戏无法加载**
   - 检查`game/`目录是否存在文件
   - 确认Express服务器是否正常启动
   - 检查浏览器控制台错误信息

3. **局域网联机失败**
   - 检查防火墙设置
   - 确认设备在同一局域网内
   - 检查网络配置和IP地址

4. **数据提交失败**
   - 确认角色配置正确
   - 检查网络连接状态
   - 验证数据格式是否正确

### 获取帮助
如果遇到问题，请检查：
1. 控制台错误信息
2. Express服务器状态
3. 网络连接状态
4. 游戏文件完整性
5. 界面日志面板

## 技术栈

- **后端**: Express.js
- **桌面应用**: Electron
- **游戏**: HTML5 + CSS3 + JavaScript
- **打包工具**: Electron Forge
- **开发语言**: Node.js, JavaScript

## 许可证

本项目采用MIT许可证，详见LICENSE文件。