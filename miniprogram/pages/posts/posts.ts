Page({
  data: {
    searchText: "",
    posts: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    this.loadPosts()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true }, () => {
      this.loadPosts(true)
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts()
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    }
    // 小于24小时
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    }
    // 小于30天
    if (diff < 2592000000) {
      return Math.floor(diff / 86400000) + '天前';
    }
    
    // 超过30天显示具体日期
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 加载帖子列表
  async loadPosts(isPullDown = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      console.log('开始加载第', this.data.page, '页，每页', this.data.pageSize, '条') // 添加日志

      // 调用云函数获取帖子列表
      const { result } = await wx.cloud.callFunction({
        name: 'getPosts',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      console.log('云函数返回结果：', result) // 添加日志

      if (!result.success) {
        throw new Error(result.errMsg || '获取帖子失败')
      }

      if (!result.data || !result.data.posts || !Array.isArray(result.data.posts)) {
        console.error('返回的数据格式：', result);
        throw new Error('返回的帖子数据格式不正确')
      }

      // 处理帖子数据
      const posts = result.data.posts.map(post => {
        // 确保create_time是数字类型
        const timestamp = typeof post.create_time === 'object' && post.create_time.$date 
          ? new Date(post.create_time.$date).getTime()
          : Number(post.create_time);

        return {
          ...post,
          create_time: this.formatTime(timestamp),
          author: {
            ...post.author,
            nickname: post.author.nickname || '未知用户',
            avatar_url: post.author.avatar_url || '../../assets/default_avatar.png',
            bio: post.author.bio || '这个用户很懒，还没有填写简介'
          }
        };
      });

      console.log('处理后的帖子数据：', posts) // 添加日志

      this.setData({
        posts: isPullDown ? posts : [...this.data.posts, ...posts],
        page: this.data.page + 1,
        hasMore: posts.length >= this.data.pageSize, // 如果返回的数据量等于pageSize，说明可能还有更多数据
        loading: false
      })

      if (isPullDown) {
        wx.stopPullDownRefresh()
      }

      // 增加浏览量
      posts.forEach(post => {
        wx.cloud.callFunction({
          name: 'incrementViewCount',
          data: {
            postId: post._id
          }
        }).catch(err => console.error('增加浏览量失败：', err))
      })
    } catch (err) {
      console.error('加载帖子失败：', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      if (isPullDown) {
        wx.stopPullDownRefresh()
      }
    }
  },

  // 输入框实时更新
  onSearchInput(e: any) {
    this.setData({
      searchText: e.detail.value
    })
  },

  // 点击搜索按钮
  // 跳转到用户资料页面
  navigateToUserProfile(e: any) {
    const userId = e.currentTarget.dataset.userid
    wx.navigateTo({
      url: `/pages/user-profile/user-profile?id=${userId}`
    })
  },

  async onSearch() {
    if (!this.data.searchText.trim()) {
      this.setData({ page: 1 }, () => {
        this.loadPosts(true)
      })
      return
    }

    this.setData({ loading: true })
    
    try {
      const db = wx.cloud.database()
      const _ = db.command
      
      const res = await db.collection('Posts')
        .where(_.or([
          {
            title: db.RegExp({
              regexp: this.data.searchText,
              options: 'i'
            })
          },
          {
            content: db.RegExp({
              regexp: this.data.searchText,
              options: 'i'
            })
          }
        ]))
        .orderBy('create_time', 'desc')
        .get()

      // 获取作者信息
      const authorIds = [...new Set(res.data.map(post => post.author_id))]
      const userRes = await db.collection('Users')
        .where({
          _id: db.command.in(authorIds)
        })
        .get()
      
      const userMap = {}
      userRes.data.forEach(user => {
        userMap[user._id] = user
      })

      // 组合帖子和作者信息
      const posts = res.data.map(post => ({
        ...post,
        author: userMap[post.author_id] || { nickName: '未知用户' }
      }))

      this.setData({
        posts,
        loading: false,
        hasMore: false
      })
    } catch (err) {
      console.error('搜索失败：', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      })
    }
  },

  
  /* 点赞/取消点赞（未接入后端）
  这里假设每个帖子对象有一个liked字段表示当前用户是否已点赞，以及like_count表示点赞数
  实际应用中需要根据后端返回的数据结构进行调整
  另外，用户ID需要从登录状态或本地存储中获取，这里假设为mock-user-id
  点赞和取消点赞的操作分别会生成事件上报，我的想法是进入后端云函数去数据库里找对应的posts让它like+1
  并且存在该帖子的子数据库里（或者别的地方），还没有做所以这里用TODO标记
  例如：likePost和unlikePost云函数
  这些云函数需要更新Posts集合中的like_count字段，并在一个单独的Likes集合中记录用户的点赞行为
  Likes集合的结构可以是：
  {
    _id: ObjectId,
    userId: String,
    postId: String,
    actionTime: Timestamp
  }
  这样可以方便地查询某个用户是否对某个帖子点赞过，以及统计点赞数
  注意：这里的实现只是前端逻辑示例，实际应用中需要根据后端设计进行调整
  然后我还觉得应该每个用户还有个点赞记录表，然后推送posts时会去这个表里找存不存在，存在liked就是
  true，不存在就是false（true false就可以展示不同的点赞按钮图标了）
  其他报错细节就晚点再想吧
  */
  onLike(e: any) {
    const postId = e.currentTarget.dataset.postid; // 帖子ID
    const index = e.currentTarget.dataset.index; // 帖子索引
    const userId = wx.getStorageSync('userId') || 'mock-user-id'; // 用户ID（从本地存储获取或mock）

    // 获取当前时间
    const actionTime = Date.now();

    // 获取帖子列表
    const posts = this.data.posts.slice();

    // 判断当前帖子是否已点赞
    if (posts[index].liked) {
      // 取消点赞逻辑
      const cancelFormData = {
        userId,
        postId,
        actionTime, // 取消点赞时间
      };

      // TODO: 调用后端接口取消点赞
      // wx.cloud.callFunction({
      //   name: 'unlikePost',
      //   data: cancelFormData,
      // }).then(res => {
      //   console.log('取消点赞成功', res);
      // }).catch(err => {
      //   console.error('取消点赞失败', err);
      // });

      // 更新本地数据
      posts[index].liked = false;
      posts[index].like_count = Math.max((posts[index].like_count || 1) - 1, 0); // 防止负数
    } else {
      // 点赞逻辑
      const likeFormData = {
        userId,
        postId,
        actionTime, // 点赞时间
      };

      // TODO: 调用后端接口添加点赞
      // wx.cloud.callFunction({
      //   name: 'likePost',
      //   data: likeFormData,
      // }).then(res => {
      //   console.log('点赞成功', res);
      // }).catch(err => {
      //   console.error('点赞失败', err);
      // });

      // 更新本地数据
      posts[index].liked = true;
      posts[index].like_count = (posts[index].like_count || 0) + 1;
    }

    // 更新页面数据
    this.setData({ posts });
  },

  // 跳转到帖子详情页
  goToContent(e) {
    const postId = e.currentTarget.dataset.postid;
    wx.navigateTo({
      url: `/pages/content/content?postId=${postId}`
    });
  }
})