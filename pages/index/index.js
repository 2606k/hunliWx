// pages/index/index.js
const app = getApp()

Page({
  data: {
    weddingInfo: {},
    userInfo: {},
    hasUserInfo: false,
    formattedDate: '',
    countdown: {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    },
    countdownTimer: null
  },

  onLoad(options) {
    this.setData({
      weddingInfo: app.globalData.weddingInfo
    })
    
    // 格式化日期
    this.formatWeddingDate()
    
    // 检查是否已有用户信息
    this.checkUserInfo()
    
    // 开始倒计时
    this.startCountdown()
  },

  onUnload() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }
  },

  // 格式化婚礼日期
  formatWeddingDate() {
    const weddingDate = new Date(this.data.weddingInfo.weddingDate)
    const year = weddingDate.getFullYear()
    const month = weddingDate.getMonth() + 1
    const date = weddingDate.getDate()
    const hours = weddingDate.getHours()
    const minutes = weddingDate.getMinutes()
    
    const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', 
                       '七月', '八月', '九月', '十月', '十一月', '十二月']
    
    const formattedDate = `${year}年${monthNames[month]}${date}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    this.setData({
      formattedDate: formattedDate
    })
  },

  // 开始倒计时
  startCountdown() {
    const weddingDate = new Date(this.data.weddingInfo.weddingDate)
    
    const updateCountdown = () => {
      const now = new Date()
      const diff = weddingDate - now
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        this.setData({
          countdown: { days, hours, minutes, seconds }
        })
      } else {
        // 婚礼已开始
        this.setData({
          countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 }
        })
        clearInterval(this.data.countdownTimer)
        
        // 显示婚礼开始提示
        wx.showToast({
          title: '婚礼开始啦！',
          icon: 'success',
          duration: 3000
        })
      }
    }
    
    // 立即执行一次
    updateCountdown()
    
    // 设置定时器
    const timer = setInterval(updateCountdown, 1000)
    this.setData({ countdownTimer: timer })
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    
    if (userInfo && userInfo.userId) {
      // 更新全局数据
      app.globalData.userInfo = userInfo
      
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
      
      console.log('用户已登录，用户ID:', userInfo.userId)
    } else if (userInfo && !userInfo.userId) {
      // 有用户信息但没有用户ID，需要重新获取
      console.log('检测到用户信息但缺少用户ID，需要重新登录')
      wx.removeStorageSync('userInfo')
      this.setData({
        userInfo: {},
        hasUserInfo: false
      })
    }
  },

  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res.userInfo)
        
        // 保存用户信息
        wx.setStorageSync('userInfo', res.userInfo)
        
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        
        // 显示欢迎信息
        wx.showToast({
          title: '授权成功',
          icon: 'success',
          duration: 2000
        })
        
        // 可以在这里调用后端API记录用户信息
        this.saveUserInfoToServer(res.userInfo)
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        wx.showToast({
          title: '授权失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 保存用户信息到服务器
  saveUserInfoToServer(userInfo) {
    console.log('用户信息已保存到本地:', userInfo)
    
    // 只发送可获取的信息到服务器
    const userData = {
      nickName: userInfo.nickName || '',
      avatarUrl: userInfo.avatarUrl || ''
    }
    
    // 发送到服务器
    wx.request({
      url: `${app.globalData.baseUrl}/user/save`,
      method: 'POST',
      data: userData,
      success: (res) => {
        console.log('保存用户信息成功:', res.data)
        
        // 处理服务器返回的用户ID
        if (res.data.data) {
          // 将用户ID添加到userInfo中
          const updatedUserInfo = {
            ...userInfo,
            userId: res.data.data
          }
          
          // 更新本地存储
          wx.setStorageSync('userInfo', updatedUserInfo)
          
          // 更新全局数据
          app.globalData.userInfo = updatedUserInfo
          
          // 更新页面数据
          this.setData({
            userInfo: updatedUserInfo
          })
          
          console.log('用户信息已更新，用户ID:', res.data.data)
          
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          })
        } else {
          console.error('服务器未返回用户ID')
          wx.showToast({
            title: '登录成功，但未获取到用户ID',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        console.error('保存用户信息失败:', err)
        wx.showToast({
          title: '服务器连接失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  // 导航到故事页面
  goToStory() {
    wx.navigateTo({
      url: '/pages/story/story'
    })
  },

  // 导航到相册页面
  goToPhoto() {
    wx.navigateTo({
      url: '/pages/photo/photo'
    })
  },

  // 导航到留言页面
  goToMessage() {
    wx.navigateTo({
      url: '/pages/message/message'
    })
  },

  // 获取用户ID的工具函数
  getUserId() {
    const userInfo = wx.getStorageSync('userInfo')
    const userId = userInfo ? userInfo.userId : null
    
    if (!userId) {
      console.error('未找到用户ID，请先登录')
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return null
    }
    return userId
  },

  // 获取完整用户信息的工具函数
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.userId) {
      console.error('未找到用户信息，请先登录')
      return null
    }
    return userInfo
  },

  // 检查用户登录状态
  checkLoginStatus() {
    const userId = this.getUserId()
    if (!userId) {
      return false
    }
    return true
  },

  // 通用API请求函数，自动包含用户ID
  apiRequest(options) {
    const userId = this.getUserId()
    if (!userId) {
      return Promise.reject(new Error('用户未登录'))
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: {
          userId: userId,
          ...options.data
        },
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          console.log('API请求成功:', res.data)
          resolve(res.data)
        },
        fail: (err) => {
          console.error('API请求失败:', err)
          reject(err)
        }
      })
    })
  },

  // 蓝色按钮点击事件
  onBlueButtonClick() {
    // 跳转到story页面
    wx.navigateTo({
      url: '/pages/story/story'
    })
  },
  onBlueButtonClick2() {
    // 跳转到photo页面
    console.log("222")
    wx.navigateTo({
      url: '/pages/photo/photo'
    })
  },
  onBlueButtonClick3() {
    // 跳转到message页面
    wx.navigateTo({
      url: '/pages/message/message'
    })
  }
}) 