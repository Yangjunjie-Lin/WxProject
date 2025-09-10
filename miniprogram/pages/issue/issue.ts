Page({
  data: {
    trades: [
      { id: 1, title: "二手书籍", price: "20元", description: "大学教材，九成新" },
      { id: 2, title: "二手桌椅", price: "150元", description: "办公桌椅，便宜转" }
    ],
    searchText: ''
  },

  // 输入搜索文本
  onSearchInput(e: any) {
    this.setData({ searchText: e.detail.value });
  },

  // 搜索按钮点击
  onSearch() {
    const { searchText, trades } = this.data;
    const filtered = trades.filter(t => t.title.includes(searchText) || t.description.includes(searchText));
    this.setData({ trades: filtered });
  },

  // 点击交易项
  viewTrade(e: any) {
    const tradeId = e.currentTarget.dataset.id;
    wx.showToast({ title: `点击交易 ${tradeId}`, icon: "none" });
    // 可后续跳转详情页面
  }
})