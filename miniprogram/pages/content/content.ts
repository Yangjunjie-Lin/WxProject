interface Post {
  _id: string;
  content: string;
  create_time?: string | number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  author: {
    _id?: string;
    nickname: string;
    avatar_url: string;
    bio?: string;
  };
}

interface Comment {
  _id: string;
  post_id: string;
  author_nickname: string;
  text: string;
  create_time?: string | number;
}

Page({
  data: {
    post: null as Post | null,     // 当前帖子详情
    comments: [] as Comment[]      // 评论列表
  },

  onLoad(options: { postId: string }) {
    const { postId } = options;
    if (postId) {
      this.loadPost(postId);
    } else {
      wx.showToast({
        title: '缺少帖子ID',
        icon: 'none'
      });
    }
  },

  async loadPost(postId: string) {
    try {
      const db = wx.cloud.database();

      // 获取帖子详情
      const postRes = await db.collection('Posts').doc(postId).get();
      const post = postRes.data as Post;

      // 格式化时间（和 posts 页面的 formatTime 类似）
      if (post.create_time) {
        const ts =
          typeof post.create_time === 'object' && (post.create_time as any).$date
            ? new Date((post.create_time as any).$date).getTime()
            : Number(post.create_time);
        post.create_time = this.formatTime(ts);
      }

      this.setData({ post });

      // 获取评论
      const commentsRes = await db.collection('Comments')
        .where({ post_id: postId })
        .orderBy('create_time', 'desc')
        .get();

      const comments = commentsRes.data as Comment[];
      this.setData({ comments });
    } catch (err) {
      console.error('加载帖子详情失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 和 posts 页面一致的时间格式化函数
  formatTime(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前';

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;
  },

  onBack() {
    wx.navigateBack();
  }
});