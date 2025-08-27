// renderer/game.js
let myRole = null
const clientNameInput = document.getElementById('clientName')

// 设置为主机
function setHost() {
  myRole = 'host'
  electronAPI.setRole('host')
}

// 设置为客户机
function setClient() {
  myRole = 'client'
  const name = clientNameInput.value.trim() || '玩家'
  electronAPI.setRole('client')
}

// 监听角色设置结果
electronAPI.onRoleSet((data) => {
  if(data.role === 'host') {
    showHostUI()
  } else if(data.role === 'client') {
    showClientUI()
  }
})

// 显示主机界面
function showHostUI() {
  document.getElementById('role-select').style.display = 'none'
  document.getElementById('host-ui').style.display = 'block'
}

// 显示客户机界面
function showClientUI() {
  document.getElementById('role-select').style.display = 'none'
  document.getElementById('client-ui').style.display = 'block'
}

// 提交分数
function submitScore(score) {
  electronAPI.submitScore(score)
}

// 监听提交结果
electronAPI.onScoreSubmitted((data) => {
  if(myRole === 'host') {
    document.getElementById('status').textContent = '✅ 你的分数已记录'
  } else if(myRole === 'client') {
    document.getElementById('status').textContent = '✅ 分数已提交给主机'
  }
})

// 重置游戏
function resetGame() {
  electronAPI.resetGame()
  document.getElementById('result').innerHTML = ''
  document.getElementById('status').textContent = '🔄 正在重新开始...'
  setTimeout(() => {
    document.getElementById('status').textContent = '等待继续游戏'
  }, 1000)
}
setInterval(() => {
  console.log('getData')
}, 1000)
// 监听重置事件
electronAPI.onGameReset(() => {
  document.getElementById('result').innerHTML = '<span style="color:blue">🔄 游戏已重置，开始新一局</span>'
  document.getElementById('status').textContent = '等待继续游戏'
})

// 主机：监听客户机加入
electronAPI.onClientJoined((name) => {
  if(myRole === 'host') {
    document.getElementById('status').textContent = `🎉 ${name} 已加入房间，可以开始游戏！`
  }
})

// 主机：监听双方分数提交完成
electronAPI.onScoresSubmitted((result) => {
  if(myRole === 'host') {
    const winner = result.winner === 'host' ? '主机获胜！' : '客户机获胜！'
    document.getElementById('result').innerHTML = `
      <div>
        主机得分: ${result.host} | 客户端得分: ${result.client}<br/>
        <strong>${winner}</strong>
      </div>
    `
  }
})