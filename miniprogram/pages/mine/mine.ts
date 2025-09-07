Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: "未登录"
    }
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "确定退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            userInfo: { avatarUrl: defaultAvatarUrl, nickName: "未登录" }
          })
          wx.showToast({ title: "已退出", icon: "success" })
        }
      }
    })
  }
})