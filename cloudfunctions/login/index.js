const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('登录云函数被调用');
  
  try {
    const wxContext = cloud.getWXContext();
    const { OPENID, APPID, UNIONID } = wxContext;

    if (!OPENID) {
      return {
        success: false,
        message: '获取用户标识失败'
      };
    }

    const userCollection = db.collection('Users');
    const existingUser = await userCollection.where({
      openid: OPENID
    }).get();

    let userInfo;
    const now = new Date();

    if (existingUser.data.length > 0) {
      // 用户已存在，更新登录时间
      userInfo = existingUser.data[0];
      await userCollection.doc(userInfo._id).update({
        data: {
          lastLoginTime: now,
          loginCount: (userInfo.loginCount || 0) + 1
        }
      });
      console.log('用户已存在，更新登录信息');
    } else {
      // 新用户，创建基础记录
      const createResult = await userCollection.add({
        data: {
          openid: OPENID,
          unionid: UNIONID || null,
          appid: APPID,
          createTime: now,
          lastLoginTime: now,
          loginCount: 1,
          nickname: '', // 初始为空，后续通过 updateUserProfile 更新
          avatar: '',   // 初始为空，后续通过 updateUserProfile 更新
          isCustomProfile: false
        }
      });

      userInfo = {
        _id: createResult._id,
        openid: OPENID,
        createTime: now,
        lastLoginTime: now,
        loginCount: 1,
        nickname: '',
        avatar: '',
        isCustomProfile: false
      };
      console.log('创建新用户:', createResult._id);
    }

    return {
      success: true,
      message: '登录成功',
      data: {
        openid: OPENID,
        unionid: UNIONID,
        userInfo: {
          id: userInfo._id,
          openid: OPENID,
          loginCount: userInfo.loginCount,
          isNewUser: existingUser.data.length === 0,
          nickname: userInfo.nickname || '',
          avatar: userInfo.avatar || '',
          isCustomProfile: userInfo.isCustomProfile || false
        }
      }
    };

  } catch (error) {
    console.error('登录云函数错误:', error);
    return {
      success: false,
      message: '登录失败: ' + error.message
    };
  }
};