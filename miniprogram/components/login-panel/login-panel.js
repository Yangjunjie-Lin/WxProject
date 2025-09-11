const CloudAuth = require('../../utils/auth');

Component({
  data: {
    loginLoading: false
  },

  methods: {
    async handleWxLogin() {
      if (this.data.loginLoading) return;
      
      this.setData({ loginLoading: true });
      
      try {
        let loginData = await CloudAuth.login();
        
        if (loginData.userInfo.isNewUser || !loginData.userInfo.nickname) {
          try {
            const wxUserInfo = await this.getWxUserInfo();
            if (wxUserInfo) {
              await this.updateUserWithWxInfo(wxUserInfo);
              loginData.userInfo.nickname = wxUserInfo.nickName;
              loginData.userInfo.avatar = wxUserInfo.avatarUrl;
            }
          } catch (wxError) {
            console.log('获取微信信息失败:', wxError);
          }
        }
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        this.triggerEvent('loginsuccess', loginData);
        
      } catch (error) {
        wx.showModal({
          title: '登录失败',
          content: error.message,
          showCancel: false
        });
      } finally {
        this.setData({ loginLoading: false });
      }
    },

    getWxUserInfo() {
      return new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善用户资料',
          success: (res) => {
            resolve(res.userInfo);
          },
          fail: reject
        });
      });
    },

    async updateUserWithWxInfo(wxUserInfo) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'updateUserProfile',
          data: {
            nickname: wxUserInfo.nickName,
            avatar: wxUserInfo.avatarUrl,
            isCustomProfile: false
          }
        });
      } catch (error) {
        console.error('更新微信信息失败:', error);
      }
    }
  }
});