// 读取数据的回调与注册
window.gdevelop485 && window.gdevelop485.onReadData(data => {
  document.getElementById('receiveArea').value += data.data + '\n'
})

window.gdevelop485 && window.gdevelop485.onPortOpen(data => {
  document.getElementById('receiveArea').value += data.data + '\n'
})

window.gdevelop485 && window.gdevelop485.onPortClose(data => {
  document.getElementById('receiveArea').value += data.data + '\n'
})

window.gdevelop485 && window.gdevelop485.onPortError(data => {
  document.getElementById('receiveArea').value += data.data + '\n'
})

/**
 * 发送数据到串口
 */
window.onSendDataToSerialPort = function (data) {
  window.gdevelop485 && window.gdevelop485.onSendData(data)
}

/**
 * 更新16进制映射
 * @param {Object} newMapping - 新的映射对象
 */
window.onUpdateHexMapping = function (newMapping) {
  window.gdevelop485 && window.gdevelop485.onUpdateHexMapping(newMapping)
}