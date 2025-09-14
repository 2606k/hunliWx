// pages/index/index.js
const app = getApp()

Page({
  data: {
    weddingInfo: {},
    formattedDate: '',
    countdown: {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    },
    countdownTimer: null,
    debugMode: false // 调试模式，设置为true时显示按钮边框
  },

  onLoad(options) {
    this.setData({
      weddingInfo: app.globalData.weddingInfo
    })
    
    // 格式化日期
    this.formatWeddingDate()
    
    // 开始倒计时
    this.startCountdown()
  },

  onShow() {
    // 页面显示时不需要检查用户信息
  },

  onUnload() {
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer)
    }
  },

  // 长按背景切换调试模式
  // onLongPress() {
  //   this.setData({
  //     debugMode: !this.data.debugMode
  //   })
  //   wx.showToast({
  //     title: this.data.debugMode ? '调试模式开启' : '调试模式关闭',
  //     icon: 'none',
  //     duration: 1500
  //   })
  // },

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