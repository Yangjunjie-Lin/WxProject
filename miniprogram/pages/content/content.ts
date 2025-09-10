Page({
  data: {
    post: null,
    loading: true
  },

  onLoad(options) {
    if (options.postId) {
      // 处理 ObjectId 格式
      let postId = decodeURIComponent(options.postId);
      console.log('收到的帖子ID:', postId);
      
      try {
        // 尝试解析 JSON 格式
        const postIdObj = JSON.parse(postId);
        if (postIdObj && postIdObj.$oid) {
          postId = postIdObj.$oid;
        }
      } catch (e) {
        // 如果解析失败，说明是普通字符串格式的 id，直接使用
        console.log('使用原始 postId:', postId);
      }
      
      console.log('处理后的帖子ID:', postId);
      this.loadPostDetail(postId);
    }
    
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
    
    this.setData({
      menuTop: menuButtonInfo.top,
      menuHeight: menuButtonInfo.height,
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 加载帖子详情
  async loadPostDetail(postId: string) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getPostDetail',
        data: { postId }
      })

      if (!result.success) {
        throw new Error(result.errMsg || '获取帖子详情失败')
      }

      // 处理帖子数据
      const post = {
        ...result.data,
        create_time: this.formatTime(result.data.create_time)
      }

      // 处理评论时间和组织评论结构
      if (post.comments) {
        console.log('原始评论数据：', post.comments);

        // 创建评论映射
        const commentMap = {};
        post.comments.forEach(comment => {
          commentMap[comment._id] = {
            ...comment,
            comment_time: this.formatTime(comment.comment_time),
            replies: []
          };
        });

        // 先找出所有顶级评论
        const topLevelComments = post.comments.filter(comment => !comment.parent_comment_id);
        console.log('顶级评论：', topLevelComments);

        // 找出所有非顶级评论
        const replies = post.comments.filter(comment => comment.parent_comment_id);
        console.log('回复评论：', replies);

        // 递归查找顶级评论
        function findTopLevelComment(comment) {
          if (!comment.parent_comment_id) {
            return comment;
          }
          const parent = commentMap[comment.parent_comment_id];
          return parent ? findTopLevelComment(parent) : null;
        }

        // 处理每条回复，将其添加到正确的父评论下
        replies.forEach(reply => {
          const parentComment = commentMap[reply.parent_comment_id];
          if (parentComment) {
            const processedReply = commentMap[reply._id];
            
            // 只有当父评论不是顶级评论时，才添加@信息
            if (parentComment.parent_comment_id) {
              processedReply.reply_to = {
                nickname: parentComment.user.nickname,
                user_id: parentComment.user._id
              };
            }

            // 找到顶级评论
            const topLevelComment = findTopLevelComment(parentComment);
            if (topLevelComment) {
              // 将回复添加到顶级评论的replies中
              topLevelComment.replies.push(processedReply);
              
              // 按时间排序replies
              topLevelComment.replies.sort((a, b) => {
                return a.comment_time - b.comment_time;
              });
            }
          }
        });

        // 只保留顶级评论及其回复
        const processedComments = topLevelComments.map(comment => commentMap[comment._id]);
        console.log('处理后的评论结构：', processedComments);
        
        // 更新post的comments为处理后的结构
        post.comments = processedComments;
      }

      this.setData({
        post,
        loading: false
      })

      // 增加浏览量
      wx.cloud.callFunction({
        name: 'incrementViewCount',
        data: { postId }
      }).catch(console.error)

    } catch (err) {
      console.error('加载帖子详情失败：', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚'
    }
    // 小于1小时
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    }
    // 小于24小时
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    }
    // 小于30天
    if (diff < 2592000000) {
      return Math.floor(diff / 86400000) + '天前'
    }
    
    // 超过30天显示具体日期
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  // 点赞/取消点赞
  onLike() {
    // 保留原有的点赞逻辑
  }
})