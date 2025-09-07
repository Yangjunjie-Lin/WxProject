Page({
  data: {
    searchText: "",
    posts: [
      { id: 1, title: "欢迎来到校园圈子", content: "这是第一个帖子内容。" }
    ]
  },

  // 输入框实时更新
  onSearchInput(e: any) {
    this.setData({
      searchText: e.detail.value
    })
  },

  // 点击搜索按钮
  onSearch() {
    wx.showToast({
      title: '搜索: ' + this.data.searchText,
      icon: 'none'
    })
  }
})