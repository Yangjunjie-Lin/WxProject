// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 在 onLaunch 函数里，加入初始化代码
    wx.cloud.init({
      env: 'cloud1-4gzy5gp72cda52fe', // 这是你的环境ID
      traceUser: true,
    })


    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})