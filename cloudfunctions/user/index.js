// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'register':
      return await register(data, openid)
    case 'getUserInfo':
      return await getUserInfo(openid)
    case 'updateUserInfo':
      return await updateUserInfo(data, openid)
    default:
      return {
        success: false,
        message: '未知的操作类型'
      }
  }
}

// 注册用户
async function register(data, openid) {
  try {
    // 检查用户是否已存在
    const user = await db.collection('users').where({
      openid: openid
    }).get()

    if (user.data.length > 0) {
      return {
        success: false,
        message: '用户已存在'
      }
    }

    // 创建新用户
    const result = await db.collection('users').add({
      data: {
        openid: openid,
        nickName: data.nickName,
        avatarUrl: data.avatarUrl,
        createTime: db.serverDate(),
        following: [],
        followers: []
      }
    })

    return {
      success: true,
      data: result._id
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  try {
    const user = await db.collection('users').where({
      openid: openid
    }).get()

    if (user.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    return {
      success: true,
      data: user.data[0]
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}

// 更新用户信息
async function updateUserInfo(data, openid) {
  try {
    const result = await db.collection('users').where({
      openid: openid
    }).update({
      data: {
        nickName: data.nickName,
        avatarUrl: data.avatarUrl,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      data: result
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
}
