const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { postId } = event;

  try {
    const result = await db.collection('posts').doc(postId).update({
      data: {
        view_count: _.inc(1)
      }
    });

    return {
      success: true,
      data: result
    };
  } catch (err) {
    return {
      success: false,
      errMsg: err.message
    };
  }
};