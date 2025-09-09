// 常量定义
export const STORAGE_KEYS = {
    USER_TOKEN: 'userToken',
    USER_INFO: 'userInfo',
    LOGIN_DATA: 'userLoginData'
  };
  
  export const USER_ROLES = {
    NORMAL: 'normal',
    VIP: 'vip',
    ADMIN: 'admin'
  };
  
  export const POST_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video'
  };
  
  export const TRADE_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };
  
  export const PAGE_SIZE = 20;
  
  export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
  
  // 如果使用 CommonJS 模块系统
  module.exports = {
    STORAGE_KEYS,
    USER_ROLES,
    POST_TYPES,
    TRADE_STATUS,
    PAGE_SIZE,
    MAX_UPLOAD_SIZE
  };