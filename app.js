// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //     console.log('登录成功', res)
    //   }
    // })
    
    // 自动获取用户openid
    this.getUserOpenId()
  },

  getUserOpenId(){
    return new Promise((resolve, reject) => {
      // 获取code值
      wx.login({
        success: (res) => {
          const code = res.code
          // 通过code换取openId
          wx.request({
            url: `https://api.weixin.qq.com/sns/jscode2session?appid=wx1af9a7ab62196405&secret=112a437a96f4a53a3b9bca32c78fb10f&js_code=${code}&grant_type=authorization_code`,
            success: (res) => {
              if (res.data && res.data.openid) {
                // 将openid存储到globalData中
                this.globalData.openid = res.data.openid
                // 同时保存到本地存储，方便下次使用
                wx.setStorageSync('openid', res.data.openid)
                console.log('获取openid成功:', res.data.openid)
                resolve(res.data.openid)
              } else {
                console.error('获取openid失败:', res.data)
                reject(res.data)
              }
            },
            fail: (err) => {
              console.error('请求失败:', err)
              reject(err)
            }
          })
        },
        fail: (err) => {
          console.error('登录失败:', err)
          reject(err)
        }
      })
    })
  },

  // 检查用户是否已授权
  checkUserAuth() {
    const userInfo = wx.getStorageSync('userInfo')
    const openid = this.globalData.openid || wx.getStorageSync('openid')
    return !!(userInfo && userInfo.userId && openid)
  },
  
  // 显示未授权提示并跳转到首页
  showAuthRequiredDialog() {
    wx.showModal({
      title: '需要授权',
      content: '请先在首页完成授权后再使用此功能',
      showCancel: false,
      confirmText: '去授权',
      success: () => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },
  
  globalData: {
    userInfo: null,
    openid: null, // 添加openid字段
    baseUrl: 'http://localhost:6688', // 本地开发服务器地址
    weddingInfo: {
      brideName: '小美',
      groomName: '小明',
      weddingDate: '2025-12-25 18:00:00',
      weddingLocation: '幸福大酒店'
    },
    bgmPlaying: true,
    musicUrls: [
      'http://124.222.172.221:9000/marry//20250811try.mp3',
      // 'http://124.222.172.221:9000/marry//20250812try.mp3'
    ]
  }
}) 