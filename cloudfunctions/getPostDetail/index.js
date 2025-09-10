const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const ObjectId = require('mongodb').ObjectId;

exports.main = async (event, context) => {
  const { postId } = event;

  try {
    // 1. 获取帖子详情
    console.log('请求的帖子ID:', postId);

    // 处理 ObjectId 格式的 _id
    let query;
    if (postId.length === 24) {  // 可能是 ObjectId
      try {
        const objectId = new ObjectId(postId);
        query = {
          $or: [
            { _id: objectId },
            { _id: postId },
            { '_id.$oid': postId }
          ]
        };
      } catch (err) {
        query = { _id: postId };
      }
    } else {
      query = { _id: postId };
    }

    console.log('构建的查询条件:', JSON.stringify(query));

    const postResult = await db.collection('Posts')
      .aggregate()
      .match(query)
      .lookup({
        from: 'Users',
        localField: 'author_id',
        foreignField: '_id',
        as: 'author'
      })
      .unwind('$author')
      .end();

    if (!postResult.list || postResult.list.length === 0) {
      return {
        success: false,
        errMsg: '帖子不存在'
      };
    }

    const post = postResult.list[0];

    // 2. 获取评论列表
    const commentsResult = await db.collection('Comments')
      .aggregate()
      .match({
        post_id: postId
      })
      .sort({
        comment_time: -1
      })
      .lookup({
        from: 'Users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      })
      .unwind('$user')
      .project({
        _id: 1,
        content: 1,
        comment_time: 1,
        parent_comment_id: 1,
        'user._id': 1,
        'user.nickname': 1,
        'user.avatar_url': 1,
        'user.bio': 1
      })
      .end();

    console.log('获取到的评论：', commentsResult.list);

    // 3. 处理返回数据
    const formattedPost = {
      ...post,
      author: {
        _id: post.author._id,
        nickname: post.author.nickname || '未知用户',
        avatar_url: post.author.avatar_url || '默认头像URL',
        bio: post.author.bio || '这个用户很懒，还没有填写简介'
      },
      comments: commentsResult.list.map(comment => ({
        _id: comment._id,
        content: comment.content,
        comment_time: comment.comment_time,
        parent_comment_id: comment.parent_comment_id,
        user: {
          _id: comment.user._id,
          nickname: comment.user.nickname || '未知用户',
          avatar_url: comment.user.avatar_url || '默认头像URL',
          bio: comment.user.bio || '这个用户很懒，还没有填写简介'
        }
      }))
    };

    console.log('处理后的帖子详情：', formattedPost);

    return {
      success: true,
      data: formattedPost
    };
  } catch (err) {
    console.error('获取帖子详情失败：', err);
    return {
      success: false,
      errMsg: err.message || '获取帖子详情失败'
    };
  }
};