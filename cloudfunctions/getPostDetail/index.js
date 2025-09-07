const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { postId } = event;

  try {
    const postDetail = await db.collection('posts')
      .aggregate()
      .match({
        _id: postId
      })
      .lookup({
        from: 'users',
        localField: 'author_id',
        foreignField: '_openid',
        as: 'author'
      })
      .unwind('$author')
      .end();

    if (postDetail.list.length === 0) {
      return {
        success: false,
        errMsg: 'Post not found.'
      };
    }

    return {
      success: true,
      data: postDetail.list[0]
    };
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    };
  }
};