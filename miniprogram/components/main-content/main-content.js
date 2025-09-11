Component({
    properties: {
      userInfo: {
        type: Object,
        value: null
      }
    },
  
    data: {
        menuList: [
          {
            id: 'posts',
            name: '我的帖子',
            icon: '📝',
            url: '/pages/posts/posts',
            count: 0
          },
          {
            id: 'trade',
            name: '我的信息',
            icon: '💬',
            url: '/pages/trade/trade',
            count: 0
          },
          {
            id: 'logs',
            name: '访问日志',
            icon: '📊',
            url: '/pages/logs/logs',
            count: 0
          }
        ]
      },
  
    methods: {
        // 跳转到功能页面
        navigateToPage(e) {
            const { url } = e.currentTarget.dataset;
            if (url) {
            if (url.includes('/posts/posts') || url.includes('/trade/trade')) {
                // 跳转到 tabBar 页面
                wx.switchTab({ url });
            } else {
                // 跳转到普通页面
                wx.navigateTo({ url });
            }
            }
        },
  
      // 退出登录
      handleLogout() {
        wx.showModal({
          title: '确认退出',
          content: '确定要退出登录吗？',
          success: (res) => {
            if (res.confirm) {
              this.triggerEvent('logout');
            }
          }
        });
      },
  
      // 跳转到个人中心
      goToProfile() {
        wx.navigateTo({
          url: '/pages/mine/mine'
        });
      }
    }
  });