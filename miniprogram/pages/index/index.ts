const CloudAuth = require('../../utils/auth');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null as any,
    loading: true
  },

  onLoad(): void {
    console.log('index页面加载');
    this.checkLoginStatus();
  },

  onShow(): void {
    console.log('index页面显示');
    this.checkLoginStatus();
  },

  checkLoginStatus(): void {
    const self = this;
    
    try {
      self.setData({ loading: true });

      if (!CloudAuth) {
        console.error('CloudAuth 未正确导入');
        self.setData({ loading: false, isLoggedIn: false });
        return;
      }

      const isLoggedIn = CloudAuth.isLoggedIn();
      self.setData({ isLoggedIn });

      if (isLoggedIn) {
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/posts/posts'
          });
        }, 1000);
      } else {
        self.setData({ loading: false });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      self.setData({ loading: false, isLoggedIn: false });
    }
  },

  onLoginSuccess(e: any): void {
    const self = this;
    console.log('登录成功事件:', e.detail);
    
    self.setData({ 
      isLoggedIn: true,
      userInfo: e.detail.userInfo || {}
    });

    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      wx.switchTab({
        url: '/pages/posts/posts'
      });
    }, 1500);
  },

  handleLogout(): void {
    if (CloudAuth) {
      CloudAuth.logout();
    }
    this.setData({ 
      isLoggedIn: false,
      userInfo: null
    });
  }
});