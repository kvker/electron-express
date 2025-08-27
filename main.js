// main.js - Electron 主进程
const { app, BrowserWindow } = require('electron')
const path = require('path')
const roomService = require('./service/roomService')

// ================================
// 配置常量
// ================================
const DEFAULT_PORT = 3000
const DEFAULT_HOST_IP = '0.0.0.0'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || !app.isPackaged

// ================================
// 创建 Electron 窗口
// ================================
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: IS_DEVELOPMENT ? false : true,
      nodeIntegration: IS_DEVELOPMENT ? true : false,
      webSecurity: IS_DEVELOPMENT ? false : true,
      allowRunningInsecureContent: IS_DEVELOPMENT ? true : false,
      devTools: true,
      enableRemoteModule: IS_DEVELOPMENT ? true : false
    }
  })

  // 设置缓存目录
  win.webContents.session.clearCache()
  win.webContents.session.clearStorageData()

  // 加载本地 HTML 文件
  if(IS_DEVELOPMENT) {
    win.loadFile('test/index.html')
  } else {
    win.loadFile('game/index.html')
  }

  // 开发时打开 DevTools
  if(IS_DEVELOPMENT) {
    win.webContents.openDevTools()

    win.webContents.on('devtools-opened', () => {
      console.log('[Electron] DevTools opened')
    })

    win.webContents.executeJavaScript(`
      console.log('[Renderer] DevTools ready for debugging');
      window.debugLog = (msg) => console.log('[Debug]', msg);
      window.debugError = (msg) => console.error('[Debug]', msg);
      window.debugInfo = (msg) => console.info('[Debug]', msg);
    `)
  }
}

// ================================
// 启动房间服务
// ================================
function startRoomService() {
  console.log('[Main] Starting room service...')

  const success = roomService.startRoomService(DEFAULT_PORT, DEFAULT_HOST_IP)

  if(success) {
    console.log('[Main] Room service started successfully')
  } else {
    console.error('[Main] Failed to start room service')
  }
}

// ================================
// Electron 生命周期
// ================================
app.whenReady().then(() => {
  // 设置应用缓存目录
  const userDataPath = path.join(__dirname, 'userData')
  app.setPath('userData', userDataPath)

  // 启动房间服务
  startRoomService()

  // 创建窗口
  createWindow()

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出时清理资源
app.on('before-quit', () => {
  roomService.stopRoomService()
})