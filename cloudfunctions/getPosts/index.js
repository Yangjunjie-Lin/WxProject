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
    const posts = await db.collection('posts')
      .aggregate()
      .lookup({
        from: 'users',
        localField: 'author_id',
        foreignField: '_openid',
        as: 'author'
      })
      .unwind('$author')
      .skip(skip)
      .limit(pageSize)
      .sort({
        create_time: -1
      })
      .end();

    return {
      success: true,
      data: posts.list
    };
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    };
  }
};