const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { postId } = event;

  try {
    // 1. 获取帖子详情
    const postResult = await db.collection('Posts').doc(postId).get();

    if (postResult.data.length === 0) {
      return {
        success: false,
        errMsg: 'Post not found.'
      };
    }

    const post = postResult.data;
    
    // 2. 根据 author_id 获取作者信息
    const authorResult = await db.collection('Users').doc(post.author_id).get();
    
    // 3. 将作者信息合并到帖子对象中
    post.author = authorResult.data;

    return {
      success: true,
      data: post
    };
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    };
  }
};