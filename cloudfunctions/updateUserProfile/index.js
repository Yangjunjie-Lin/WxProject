const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('updateUserProfile 云函数被调用');
  console.log('传入参数:', event);
  
  try {
    const wxContext = cloud.getWXContext();
    const { OPENID } = wxContext;

    if (!OPENID) {
      return {
        success: false,
        message: '用户未登录'
      };
    }

    // 定义允许更新的字段
    const allowedFields = [
      'nickname', 
      'avatar', 
      'gender', 
      'country', 
      'province', 
      'city', 
      'phone',
      'isCustomProfile'
    ];
    
    const updateData = {};
    
    // 过滤和验证输入数据
    allowedFields.forEach(field => {
      if (event[field] !== undefined) {
        // 基本验证
        if (field === 'nickname') {
          const nickname = event[field].trim();
          if (nickname.length > 0 && nickname.length <= 20) {
            updateData[field] = nickname;
          } else {
            throw new Error('昵称长度必须在1-20个字符之间');
          }
        } else if (field === 'phone') {
          const phone = event[field].trim();
          if (/^1[3-9]\d{9}$/.test(phone)) {
            updateData[field] = phone;
          } else {
            throw new Error('手机号格式不正确');
          }
        } else {
          updateData[field] = event[field];
        }
      }
    });

    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: '没有需要更新的数据'
      };
    }

    // 添加更新时间
    updateData.updateTime = new Date();

    console.log('准备更新的数据:', updateData);

    // 更新用户信息
    const result = await db.collection('Users').where({
      openid: OPENID
    }).update({
      data: updateData
    });

    console.log('数据库更新结果:', result);

    if (result.stats.updated === 0) {
      return {
        success: false,
        message: '用户不存在或更新失败'
      };
    }

    // 获取更新后的用户信息
    const updatedUser = await db.collection('Users').where({
      openid: OPENID
    }).get();

    const userInfo = updatedUser.data[0];
    
    // 返回安全的用户信息
    const safeUserInfo = {
      id: userInfo._id,
      openid: userInfo.openid,
      nickname: userInfo.nickname || '',
      avatar: userInfo.avatar || '',
      gender: userInfo.gender || 0,
      country: userInfo.country || '',
      province: userInfo.province || '',
      city: userInfo.city || '',
      phone: userInfo.phone || '',
      createTime: userInfo.createTime,
      lastLoginTime: userInfo.lastLoginTime,
      loginCount: userInfo.loginCount || 0,
      isCustomProfile: userInfo.isCustomProfile || false,
      updateTime: userInfo.updateTime
    };

    return {
      success: true,
      message: '更新成功',
      data: {
        updated: result.stats.updated,
        userInfo: safeUserInfo
      }
    };

  } catch (error) {
    console.error('updateUserProfile 云函数错误:', error);
    return {
      success: false,
      message: error.message || '更新失败',
      error: error.message
    };
  }
};