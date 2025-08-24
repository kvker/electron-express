// main.js - Electron 主进程
const { app, BrowserWindow, ipcMain } = require('electron')
const http = require('http')
const path = require('path')

// ================================
// 配置常量
// ================================
const DEFAULT_PORT = 3000
const DEFAULT_HOST_IP = '0.0.0.0'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || !app.isPackaged

// 全局配置
let appConfig = {
  role: null,        // 'host' 或 'client'
  hostIP: '127.0.0.1', // 主机IP地址
  port: DEFAULT_PORT,
  isHost: false
}

// 房间状态（仅主机使用）
let roomState = {
  roomId: null,
  players: new Map(), // 存储所有玩家信息
  data: new Map()     // 存储所有玩家提交的数据
}

// HTTP 服务器实例
let server = null

// ================================
// 创建 Electron 窗口
// ================================
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: IS_DEVELOPMENT ? false : true, // 开发时关闭上下文隔离
      nodeIntegration: IS_DEVELOPMENT ? true : false, // 开发时允许Node.js集成
      webSecurity: IS_DEVELOPMENT ? false : true, // 开发时关闭web安全限制
      allowRunningInsecureContent: IS_DEVELOPMENT ? true : false, // 开发时允许不安全内容
      devTools: true, // 确保DevTools可用
      enableRemoteModule: IS_DEVELOPMENT ? true : false // 开发时允许远程模块
    }
  })

  // 设置缓存目录到项目文件夹内，避免权限问题
  win.webContents.session.clearCache()
  win.webContents.session.clearStorageData()

  // 加载本地 HTML 文件
  win.loadFile('game/index.html')

  // 开发时打开 DevTools
  if(IS_DEVELOPMENT) {
    win.webContents.openDevTools()

    // 确保DevTools完全可用
    win.webContents.on('devtools-opened', () => {
      console.log('[Electron] DevTools opened')
    })

    // 允许在DevTools中执行任意代码
    win.webContents.executeJavaScript(`
      console.log('[Renderer] DevTools ready for debugging');
      // 添加一些全局调试函数
      window.debugLog = (msg) => console.log('[Debug]', msg);
      window.debugError = (msg) => console.error('[Debug]', msg);
      window.debugInfo = (msg) => console.info('[Debug]', msg);
      
      // 测试调试功能
      console.log('[Renderer] Console logging test');
      console.error('[Renderer] Console error test');
      console.info('[Renderer] Console info test');
    `)
  }
}

// ================================
// 启动 HTTP 服务（仅主机）
// ================================
function startHttpServer() {
  server = http.createServer((req, res) => {
    console.log(`[HTTP Server] Request: ${req.method} ${req.url}`)

    // 设置 CORS，允许来自任意来源的请求
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if(req.method === 'OPTIONS') {
      console.log(`[HTTP Server] Handling OPTIONS request`)
      res.writeHead(200)
      res.end()
      return
    }

    console.log(`[HTTP Server] Checking URL: "${req.url}" starts with "/api/data/get": ${req.url.startsWith('/api/data/get')}`)
    console.log(`[HTTP Server] Method check: "${req.method}" === "GET": ${req.method === 'GET'}`)

    if((req.url === '/api/data/get' || req.url.startsWith('/api/data/get?')) && req.method === 'GET') {
      console.log(`[HTTP Server] Handling GET /api/data/get`)
      handleGetData(req, res)
    }
    else if((req.url === '/api/room/status' || req.url.startsWith('/api/room/status?')) && req.method === 'GET') {
      console.log(`[HTTP Server] Handling GET /api/room/status`)
      handleGetRoomStatus(req, res)
    }
    else if(req.method === 'POST') {
      console.log(`[HTTP Server] Handling POST request to ${req.url}`)
      // 处理 POST 数据
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })

      req.on('end', () => {
        try {
          const data = JSON.parse(body)

          if(req.url === '/api/room/join') {
            handleJoinRoom(req, res, data)
          }
          else if(req.url === '/api/data/submit') {
            handleSubmitData(req, res, data)
          }
          else {
            console.log(`[HTTP Server] POST endpoint not found: ${req.url}`)
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: 'API endpoint not found' }))
          }
        } catch(err) {
          console.error(`[HTTP Server] JSON parse error:`, err)
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON data' }))
        }
      })
    } else {
      console.log(`[HTTP Server] Method not allowed: ${req.method} ${req.url}`)
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: 'Method not allowed' }))
    }
  })

  server.listen(appConfig.port, appConfig.hostIP, () => {
    console.log(`[HTTP Server] Host service started: http://${appConfig.hostIP}:${appConfig.port}`)
    console.log(`[HTTP Server] Room ID: ${roomState.roomId}`)
  })

  server.on('error', (err) => {
    console.error('[HTTP Server] Failed to start:', err)
  })
}

// ================================
// 处理加入房间请求
// ================================
function handleJoinRoom(req, res, data) {
  const { playerId, playerName } = data

  if(!playerId || !playerName) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'Missing playerId or playerName' }))
    return
  }

  // 添加玩家到房间
  roomState.players.set(playerId, {
    id: playerId,
    name: playerName,
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  })

  console.log(`[Server] Player joined: ${playerName} (ID: ${playerId})`)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    success: true,
    message: 'Joined room successfully',
    roomId: roomState.roomId,
    playerCount: roomState.players.size
  }))

  // 通知渲染进程有新玩家加入
  if(global.mainWindow) {
    global.mainWindow.webContents.send('player-joined', {
      playerId,
      playerName,
      playerCount: roomState.players.size
    })
  }
}

// ================================
// 处理数据提交请求
// ================================
function handleSubmitData(req, res, data) {
  const { playerId, dataType, payload } = data

  if(!playerId || !dataType) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ success: false, error: 'Missing playerId or dataType' }))
    return
  }

  // 存储玩家数据
  const dataKey = `${playerId}_${dataType}`
  roomState.data.set(dataKey, {
    playerId,
    dataType,
    payload,
    timestamp: new Date().toISOString()
  })

  console.log(`[Server] Data submitted: ${playerId} - ${dataType}`)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    success: true,
    message: 'Data submitted successfully',
    dataKey
  }))

  // 通知渲染进程有新数据提交
  if(global.mainWindow) {
    global.mainWindow.webContents.send('data-submitted', {
      playerId,
      dataType,
      payload,
      dataKey
    })
  }
}

// ================================
// 处理获取数据请求
// ================================
function handleGetData(req, res) {
  console.log(`[HTTP] Get data request:`, req.url)

  // 解析查询参数
  let playerId, dataType
  if(req.url && req.url.includes('?')) {
    const queryString = req.url.split('?')[1]
    const params = new URLSearchParams(queryString)
    playerId = params.get('playerId')
    dataType = params.get('dataType')
  }

  console.log(`[HTTP] Parsed params: playerId=${playerId}, dataType=${dataType}`)

  let result = {}

  if(playerId && dataType) {
    // 获取特定玩家的特定类型数据
    const dataKey = `${playerId}_${dataType}`
    const data = roomState.data.get(dataKey)
    if(data) {
      result = { [dataKey]: data }
    }
  } else if(playerId) {
    // 获取特定玩家的所有数据
    for(const [key, value] of roomState.data) {
      if(value.playerId === playerId) {
        result[key] = value
      }
    }
  } else {
    // 获取所有数据
    for(const [key, value] of roomState.data) {
      result[key] = value
    }
  }

  const response = {
    success: true,
    data: result,
    totalCount: Object.keys(result).length
  }

  console.log(`[HTTP] Get data response:`, response)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(response))
}

// ================================
// 处理获取房间状态请求
// ================================
function handleGetRoomStatus(req, res) {
  const players = Array.from(roomState.players.values())

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    success: true,
    roomId: roomState.roomId,
    players: players,
    playerCount: players.length,
    dataCount: roomState.data.size
  }))
}

// ================================
// IPC 通信处理
// ================================

// 设置应用角色和配置
ipcMain.handle('set-app-config', (event, config) => {
  appConfig = { ...appConfig, ...config }
  appConfig.isHost = (appConfig.role === 'host')

  console.log(`[IPC] App config updated:`, appConfig)

  if(appConfig.isHost) {
    // 生成房间ID
    roomState.roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    startHttpServer()
    return { success: true, role: 'host', roomId: roomState.roomId, status: 'waiting' }
  } else {
    return { success: true, role: 'client', status: 'ready' }
  }
})

// 获取应用配置
ipcMain.handle('get-app-config', () => {
  return appConfig
})

// 获取房间状态
ipcMain.handle('get-room-status', () => {
  if(!appConfig.isHost) {
    return { success: false, error: 'Only host can get room status' }
  }

  const players = Array.from(roomState.players.values())
  return {
    success: true,
    roomId: roomState.roomId,
    players: players,
    playerCount: players.length,
    dataCount: roomState.data.size
  }
})

// 主机本地提交数据
ipcMain.handle('submit-data', (event, data) => {
  if(appConfig.isHost) {
    const { playerId, dataType, payload } = data
    const dataKey = `${playerId}_${dataType}`

    roomState.data.set(dataKey, {
      playerId,
      dataType,
      payload,
      timestamp: new Date().toISOString()
    })

    console.log(`[Host] Local data submitted: ${playerId} - ${dataType}`)
    return { success: true, dataKey }
  }
  return { success: false, error: 'Only host can submit local data' }
})

// 客户端提交数据到主机
ipcMain.handle('submit-data-to-host', async (event, data) => {
  if(!appConfig.isHost) {
    const options = {
      hostname: appConfig.hostIP,
      port: appConfig.port,
      path: '/api/data/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let responseBody = ''
        res.on('data', chunk => responseBody += chunk)
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody)
            console.log(`[Client] Data submission response:`, response)
            resolve(response)
          } catch(e) {
            resolve({ success: false, error: 'Invalid response format' })
          }
        })
      })

      req.on('error', (e) => {
        console.error(`[Client] Submission failed:`, e)
        resolve({ success: false, error: e.message })
      })

      req.write(JSON.stringify(data))
      req.end()
    })
  }
  return { success: false, error: 'Host cannot submit to itself' }
})

// 获取数据
ipcMain.handle('get-data', async (event, params) => {
  console.log(`[IPC] Get data called with params:`, params)

  if(appConfig.isHost) {
    // 主机直接从本地获取
    try {
      let result = {}

      if(params.playerId && params.dataType) {
        // 获取特定玩家的特定类型数据
        const dataKey = `${params.playerId}_${params.dataType}`
        const data = roomState.data.get(dataKey)
        if(data) {
          result = { [dataKey]: data }
        }
      } else if(params.playerId) {
        // 获取特定玩家的所有数据
        for(const [key, value] of roomState.data) {
          if(value.playerId === params.playerId) {
            result[key] = value
          }
        }
      } else {
        // 获取所有数据
        for(const [key, value] of roomState.data) {
          result[key] = value
        }
      }

      const response = {
        success: true,
        data: result,
        totalCount: Object.keys(result).length
      }
      console.log(`[IPC] Host get data response:`, response)
      return response
    } catch(error) {
      console.error(`[IPC] Host get data error:`, error)
      return { success: false, error: error.message }
    }
  } else {
    // 客户端从主机获取
    const queryString = new URLSearchParams(params).toString()
    const fullPath = queryString ? `/api/data/get?${queryString}` : `/api/data/get`
    const options = {
      hostname: appConfig.hostIP,
      port: appConfig.port,
      path: fullPath,
      method: 'GET'
    }

    console.log(`[IPC] Client requesting data from: ${appConfig.hostIP}:${appConfig.port}${fullPath}`)
    console.log(`[IPC] Client request options:`, options)

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let responseBody = ''
        res.on('data', chunk => responseBody += chunk)
        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody)
            console.log(`[IPC] Client get data response:`, response)
            resolve(response)
          } catch(e) {
            console.error(`[IPC] Client parse response error:`, e, 'Response body:', responseBody)
            resolve({ success: false, error: 'Invalid response format' })
          }
        })
      })

      req.on('error', (e) => {
        console.error(`[IPC] Client get data failed:`, e)
        resolve({ success: false, error: e.message })
      })

      req.on('response', (res) => {
        console.log(`[IPC] Client received response status: ${res.statusCode}`)
        console.log(`[IPC] Client response headers:`, res.headers)
      })

      req.end()
    })
  }
})

// 重置房间状态（仅主机）
ipcMain.handle('reset-room', () => {
  if(appConfig.isHost) {
    roomState.players.clear()
    roomState.data.clear()
    roomState.roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('[Game] Room state reset')

    if(global.mainWindow) {
      global.mainWindow.webContents.send('room-reset', { roomId: roomState.roomId })
    }

    return { success: true, roomId: roomState.roomId }
  }
  return { success: false, error: 'Only host can reset room' }
})

// ================================
// Electron 生命周期
// ================================
app.whenReady().then(() => {
  // 设置应用缓存目录到项目文件夹内
  const userDataPath = path.join(__dirname, 'userData')
  app.setPath('userData', userDataPath)

  createWindow()

  global.mainWindow = BrowserWindow.getAllWindows()[0]

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') app.quit()
})