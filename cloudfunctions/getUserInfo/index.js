const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const { OPENID } = wxContext;

    if (!OPENID) {
      return {
        success: false,
        message: '用户未登录'
      };
    }

    // 使用大写的 Users 集合
    const userCollection = db.collection('Users'); // 改为大写的 Users
    const userResult = await userCollection.where({
      openid: OPENID
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const userInfo = userResult.data[0];
    
    const safeUserInfo = {
      id: userInfo._id,
      openid: userInfo.openid,
      nickname: userInfo.nickname || '微信用户',
      avatar: userInfo.avatar || '',
      createTime: userInfo.createTime,
      lastLoginTime: userInfo.lastLoginTime,
      loginCount: userInfo.loginCount || 0
    };

    return {
      success: true,
      data: safeUserInfo
    };

  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      message: '服务器错误'
    };
  }
};