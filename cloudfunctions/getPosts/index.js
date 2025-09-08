const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10 } = event;
  const skip = (page - 1) * pageSize;

  try {
    // 获取总数
    const countResult = await db.collection('Posts').count();
    const total = countResult.total;

    // 获取帖子列表（带作者信息）
    const posts = await db.collection('Posts')
      .aggregate()
      .sort({
        create_time: -1
      })
      .skip(skip)
      .limit(pageSize)
      .lookup({
        from: 'Users',
        localField: 'author_id',
        foreignField: '_id',
        as: 'author'
      })
      .unwind('$author')
      .end();

    console.log('云函数获取到的帖子：', posts.list); // 添加日志

    // 处理返回的数据
    const formattedPosts = posts.list.map(post => ({
      ...post,
      author: {
        _id: post.author._id,
        nickname: post.author.nickname,
        avatar_url: post.author.avatar_url,
        bio: post.author.bio
      }
    }));

    console.log('云函数处理后的帖子数据：', formattedPosts);

    return {
      success: true,
      data: {
        posts: formattedPosts,
        total,
        hasMore: skip + posts.list.length < total
      }
    };
  } catch (err) {
    console.error('获取帖子列表失败：', err);
    return {
      success: false,
      errMsg: err.message || '获取帖子列表失败'
    };
  }
};