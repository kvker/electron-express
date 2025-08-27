// service/roomService.js - 房间服务
const express = require('express')

// ================================
// 房间状态管理
// ================================
let roomState = {
  players: new Map(),
  data: new Map()
}

// Express 应用实例
let expressApp = null
let server = null

// ================================
// 启动房间服务
// ================================
function startRoomService(port = 3000, host = '0.0.0.0') {
  try {
    console.log('[Room Service] Starting...')
    
    // 创建 Express 应用
    expressApp = express()
    
    // 中间件配置
    expressApp.use(express.json())
    expressApp.use(express.urlencoded({ extended: true }))
    
    // CORS 中间件
    expressApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
        return
      }
      next()
    })
    
    // 请求日志中间件
    expressApp.use((req, res, next) => {
      console.log(`[Room Service] ${req.method} ${req.url}`)
      next()
    })
    
    // 路由配置
    setupRoutes()
    
    // 错误处理中间件
    expressApp.use((err, req, res, next) => {
      console.error('[Room Service] Error:', err)
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
      })
    })
    
    // 启动服务器
    server = expressApp.listen(port, host, () => {
      console.log(`[Room Service] Started: http://${host}:${port}`)
      console.log('[Room Service] Available APIs:')
      console.log('  - POST /api/room/join - 加入房间')
      console.log('  - GET /api/room/query - 查询房间')
      console.log('  - POST /api/room/recreate - 重新创建房间')
      console.log('  - POST /api/data/submit - 提交数据')
      console.log('  - GET /api/data/query - 查询数据')
      console.log('  - GET /health - 健康检查')
    })
    
    server.on('error', (err) => {
      console.error('[Room Service] Failed to start:', err)
      if (err.code === 'EADDRINUSE') {
        console.log(`[Room Service] Port ${port} in use, trying ${port + 1}...`)
        server = expressApp.listen(port + 1, host, () => {
          console.log(`[Room Service] Started on port ${port + 1}`)
        })
      }
    })
    
    console.log('[Room Service] Setup completed successfully')
    return true
    
  } catch (error) {
    console.error('[Room Service] Critical error:', error)
    return false
  }
}

// ================================
// 设置 Express 路由
// ================================
function setupRoutes() {
  // 房间管理路由
  expressApp.post('/api/room/join', handleJoinRoom)
  expressApp.get('/api/room/query', handleQueryRoom)
  expressApp.post('/api/room/recreate', handleRecreateRoom)
  
  // 数据操作路由
  expressApp.post('/api/data/submit', handleSubmitData)
  expressApp.get('/api/data/query', handleQueryData)
  
  // 健康检查路由
  expressApp.get('/health', handleHealthCheck)
  
  // 404 处理 - 简化版本
  expressApp.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.originalUrl,
      available: [
        'POST /api/room/join - 加入房间',
        'GET /api/room/query - 查询房间',
        'POST /api/room/recreate - 重新创建房间',
        'POST /api/data/submit - 提交数据',
        'GET /api/data/query - 查询数据',
        'GET /health - 健康检查'
      ]
    })
  })
}

// ================================
// 房间管理处理器
// ================================

// 加入房间
function handleJoinRoom(req, res) {
  const { playerId, playerName } = req.body
  
  if (!playerId || !playerName) {
    return res.status(400).json({
      success: false,
      error: 'Missing playerId or playerName'
    })
  }

  // 添加玩家到房间
  roomState.players.set(playerId, {
    id: playerId,
    name: playerName,
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  })

  console.log(`[Room Service] Player joined: ${playerName} (ID: ${playerId})`)
  
  res.json({
    success: true,
    message: 'Joined room successfully',
    playerCount: roomState.players.size
  })
}

// 查询房间
function handleQueryRoom(req, res) {
  const players = Array.from(roomState.players.values())
  
  res.json({
    success: true,
    players: players,
    playerCount: players.length,
    dataCount: roomState.data.size,
    timestamp: new Date().toISOString()
  })
}

// 重新创建房间
function handleRecreateRoom(req, res) {
  // 清空房间数据
  roomState.players.clear()
  roomState.data.clear()
  
  console.log('[Room Service] Room recreated')
  
  res.json({
    success: true,
    message: 'Room recreated successfully'
  })
}

// ================================
// 数据操作处理器
// ================================

// 提交数据
function handleSubmitData(req, res) {
  const { playerId, dataType, payload } = req.body
  
  if (!playerId || !dataType) {
    return res.status(400).json({
      success: false,
      error: 'Missing playerId or dataType'
    })
  }

  // 存储数据
  const dataKey = `${playerId}_${dataType}`
  roomState.data.set(dataKey, {
    playerId,
    dataType,
    payload,
    timestamp: new Date().toISOString()
  })

  console.log(`[Room Service] Data submitted: ${playerId} - ${dataType}`)
  
  res.json({
    success: true,
    message: 'Data submitted successfully',
    dataKey
  })
}

// 查询数据
function handleQueryData(req, res) {
  const { playerId, dataType } = req.query
  
  console.log(`[Room Service] Query data - playerId: ${playerId}, dataType: ${dataType}`)
  
  let result = {}
  
  if (playerId && dataType) {
    // 获取特定玩家的特定类型数据
    const dataKey = `${playerId}_${dataType}`
    const data = roomState.data.get(dataKey)
    if (data) {
      result = { [dataKey]: data }
    }
  } else if (playerId) {
    // 获取特定玩家的所有数据
    for (const [key, value] of roomState.data) {
      if (value.playerId === playerId) {
        result[key] = value
      }
    }
  } else {
    // 获取所有数据
    for (const [key, value] of roomState.data) {
      result[key] = value
    }
  }
  
  res.json({
    success: true,
    data: result,
    totalCount: Object.keys(result).length
  })
}

// ================================
// 系统处理器
// ================================

// 健康检查
function handleHealthCheck(req, res) {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    playerCount: roomState.players.size,
    dataCount: roomState.data.size,
    uptime: process.uptime()
  })
}

// ================================
// 服务管理
// ================================

// 停止服务
function stopRoomService() {
  if (server) {
    console.log('[Room Service] Shutting down...')
    server.close()
    server = null
    expressApp = null
  }
}

// 获取服务状态
function getServiceStatus() {
  return {
    isRunning: !!server,
    port: server ? server.address().port : null,
    playerCount: roomState.players.size,
    dataCount: roomState.data.size
  }
}

// 导出模块
module.exports = {
  startRoomService,
  stopRoomService,
  getServiceStatus
} 