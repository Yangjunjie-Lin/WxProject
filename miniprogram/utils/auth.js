const CloudAuth = {
    async login() {
      try {
        console.log('开始登录流程...');
        
        if (!wx.cloud) {
          throw new Error('云开发未初始化');
        }
  
        const result = await wx.cloud.callFunction({
          name: 'login',
          data: {}
        });
  
        if (result.result && result.result.success) {
          this.saveLoginInfo(result.result.data);
          return result.result.data;
        } else {
          throw new Error(result.result?.message || '登录失败');
        }
      } catch (error) {
        console.error('登录失败:', error);
        throw error;
      }
    },
  
    saveLoginInfo(loginData) {
      try {
        wx.setStorageSync('userLoginData', {
          ...loginData,
          loginTime: Date.now()
        });
      } catch (error) {
        console.error('保存登录信息失败:', error);
      }
    },
  
    isLoggedIn() {
      try {
        const loginData = wx.getStorageSync('userLoginData');
        return !!(loginData && loginData.openid);
      } catch (error) {
        return false;
      }
    },
  
    async getUserInfo() {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getUserInfo',
          data: {}
        });
  
        if (result.result && result.result.success) {
          return result.result.data;
        } else {
          throw new Error(result.result?.message || '获取用户信息失败');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        throw error;
      }
    },
  
    logout() {
      try {
        wx.removeStorageSync('userLoginData');
        wx.reLaunch({
          url: '/pages/index/index'
        });
      } catch (error) {
        console.error('退出登录失败:', error);
      }
    },
  
    async uploadAvatar(filePath) {
      try {
        const loginData = this.getLoginData();
        if (!loginData) {
          throw new Error('用户未登录');
        }
  
        const fileExtension = filePath.split('.').pop();
        const cloudPath = `avatars/${loginData.openid}-${Date.now()}.${fileExtension}`;
        
        const result = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: filePath
        });
  
        return result.fileID;
      } catch (error) {
        console.error('上传头像失败:', error);
        throw error;
      }
    },
  
    getLoginData() {
      try {
        return wx.getStorageSync('userLoginData');
      } catch (error) {
        return null;
      }
    }
  };
  
  module.exports = CloudAuth;