const CloudAuth = require('../../utils/auth');

Page({
  data: {
    userInfo: null as any,
    loading: true,
    menuList: [
      {
        id: 'posts',
        name: '我的帖子',
        icon: '📝',
        url: '/pages/posts/posts',
        count: 0
      },
      {
        id: 'logs',
        name: '访问日志',
        icon: '📊',
        url: '/pages/logs/logs',
        count: 0
      }
    ] as any[]
  },

  onLoad(): void {
    this.checkLoginAndLoadData();
  },

  onShow(): void {
    if (!CloudAuth.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/index/index'
      });
      return;
    }
    this.loadUserInfo();
  },

  checkLoginAndLoadData(): void {
    if (!CloudAuth.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/index/index'
      });
      return;
    }
    this.loadUserInfo();
  },

  loadUserInfo(): void {
    const self = this;
    
    self.setData({ loading: true });
    
    CloudAuth.getUserInfo().then((userInfo: any) => {
      self.setData({ 
        userInfo: userInfo,
        loading: false 
      });
    }).catch((error: any) => {
      console.error('加载用户信息失败:', error);
      self.setData({ loading: false });
      self.handleLogout();
    });
  },

  navigateToPage(e: any): void {
    const { url } = e.currentTarget.dataset;
    if (url) {
      if (url.includes('/posts/posts')) {
        wx.switchTab({ url });
      } else {
        wx.navigateTo({ url });
      }
    }
  },

  handleLogout(): void {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          CloudAuth.logout();
        }
      }
    });
  },

  goToProfile(): void {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  onPullDownRefresh(): void {
    this.loadUserInfo();
    wx.stopPullDownRefresh();
  },

  onAvatarTap(): void {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadAvatar(res.tempFiles[0].tempFilePath);
      }
    });
  },

  uploadAvatar(filePath: string): void {
    const self = this;
    
    wx.showLoading({ title: '上传中...' });
    
    CloudAuth.uploadAvatar(filePath).then((result: string) => {
      return self.updateUserProfile({ avatar: result });
    }).then(() => {
      self.setData({
        'userInfo.avatar': filePath
      });
      wx.hideLoading();
      wx.showToast({
        title: '头像更新成功',
        icon: 'success'
      });
    }).catch((error: any) => {
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'error'
      });
    });
  },

  onNicknameTap(): void {
    const self = this;
    const currentNickname = self.data.userInfo?.nickname || '';
    
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          self.updateUserProfile({ 
            nickname: res.content.trim(),
            isCustomProfile: true 
          }).then(() => {
            self.setData({
              'userInfo.nickname': res.content.trim()
            });
            wx.showToast({
              title: '昵称更新成功',
              icon: 'success'
            });
          }).catch(() => {
            wx.showToast({
              title: '更新失败',
              icon: 'error'
            });
          });
        }
      }
    });
  },

  updateUserProfile(profileData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'updateUserProfile',
        data: profileData,
        success: (result) => {
          if (result.result && result.result.success) {
            resolve(result.result);
          } else {
            reject(new Error(result.result?.message || '更新失败'));
          }
        },
        fail: reject
      });
    });
  }
});