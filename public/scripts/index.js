// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sendButton').addEventListener('click', () => {
    const data = document.getElementById('sendDataInput').value
    if(!data) return
    document.getElementById('sendArea').value += data + '\n'
    window.onSendDataToSerialPort({ data })
  })

  // 设置输入框提示
  document.getElementById('sendDataInput').placeholder = "输入映射字符或16进制数据"
  document.getElementById('sendDataInput').value = 'A'
})