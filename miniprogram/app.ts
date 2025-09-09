// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 在 onLaunch 函数里，加入初始化代码
    if (wx.cloud) {
        wx.cloud.init({
          env: 'cloud1-4gzy5gp72cda52fe', // 确保这个ID正确
          traceUser: true
        });
        console.log('云开发初始化成功');
      }


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