const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const express = require('express')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 这里切换调试的文件（或打包）
  win.loadURL('http://localhost:3000')

  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  ipcMain.handle('onSendData', (e, data) => onSendData(data))
  ipcMain.handle('onUpdateHexMapping', (e, data) => onUpdateHexMapping(data))

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  const expressApp = express()
  const port = 3000
  expressApp.use(express.static(path.join(__dirname, 'game')))

  expressApp.get('/api/room/create', (req, res) => {
    res.json({ success: true, roomId: 'room_123' })
  })

  expressApp.listen(port, () => {
    console.log(`Express server is running on port ${port}`)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') {
    app.quit()
  }
})