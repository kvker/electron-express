// preload.js
const { ipcRenderer } = require('electron')

// 由于contextIsolation: false，直接暴露到全局对象
window.electronAPI = {
  // 应用配置管理
  setAppConfig: (config) => ipcRenderer.invoke('set-app-config', config),
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  
  // 房间管理
  getRoomStatus: () => ipcRenderer.invoke('get-room-status'),
  resetRoom: () => ipcRenderer.invoke('reset-room'),
  
  // 数据操作
  submitData: (data) => ipcRenderer.invoke('submit-data', data),
  submitDataToHost: (data) => ipcRenderer.invoke('submit-data-to-host', data),
  getData: (params) => ipcRenderer.invoke('get-data', params),
  
  // 事件监听
  onPlayerJoined: (callback) => ipcRenderer.on('player-joined', callback),
  onDataSubmitted: (callback) => ipcRenderer.on('data-submitted', callback),
  onRoomReset: (callback) => ipcRenderer.on('room-reset', callback),
  
  // 移除事件监听
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}

// 添加调试辅助函数
window.debugLog = (msg) => console.log('[Debug]', msg)
window.debugError = (msg) => console.error('[Debug]', msg)
window.debugInfo = (msg) => console.info('[Debug]', msg)

console.log('[Preload] Electron API loaded and ready for debugging')