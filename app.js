// app.js
/**
 * 全局BGM管理器
 * 负责管理整个应用的背景音乐播放状态
 * @author tangxin
 */
class BGMManager {
  constructor() {
    this.audioContext = null
    this.isPlaying = true
    this.currentMusicIndex = 0
    this.musicUrls = [
      'http://124.222.172.221:9000/marry//20250811try.mp3',
      'http://124.222.172.221:9000/marry//20250811独家记忆.mp3',
      'http://124.222.172.221:9000/marry//20250811传奇.mp3',
      'http://124.222.172.221:9000/marry//20250811爱就一个字_3.mp3'
    ]
    this.listeners = [] // 存储所有监听器
    this.init()
  }

  init() {
    // 创建音频上下文
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = this.musicUrls[this.currentMusicIndex]
    this.audioContext.loop = false
    this.audioContext.autoplay = true
    
    // 监听播放结束
    this.audioContext.onEnded(() => {
      this.playNextMusic()
    })
    
    // 监听播放错误
    this.audioContext.onError((res) => {
      console.error('音频播放错误:', res)
      this.playNextMusic()
    })
  }

  // 切换播放/暂停状态
  togglePlay() {
    if (this.isPlaying) {
      this.audioContext.pause()
      this.isPlaying = false
    } else {
      this.audioContext.play()
      this.isPlaying = true
    }
    this.notifyListeners()
  }

  // 播放下一首音乐
  playNextMusic() {
    this.currentMusicIndex = (this.currentMusicIndex + 1) % this.musicUrls.length
    this.audioContext.src = this.musicUrls[this.currentMusicIndex]
    
    if (this.isPlaying) {
      this.audioContext.play()
    }
    this.notifyListeners()
  }

  // 获取当前状态
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentMusicIndex: this.currentMusicIndex,
      musicUrls: this.musicUrls
    }
  }

  // 添加状态监听器
  addListener(callback) {
    if (this.listeners.indexOf(callback) === -1) {
      this.listeners.push(callback)
    }
    // 立即返回当前状态
    callback(this.getState())
  }

  // 移除状态监听器
  removeListener(callback) {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 通知所有监听器状态变化
  notifyListeners() {
    const state = this.getState()
    for (let i = 0; i < this.listeners.length; i++) {
      try {
        this.listeners[i](state)
      } catch (error) {
        console.error('BGM状态通知错误:', error)
      }
    }
  }

  // 销毁音频上下文
  destroy() {
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
    this.listeners = []
  }
}

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化全局BGM管理器
    this.bgmManager = new BGMManager()
    
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
    baseUrl: 'http://192.168.2.7:8002', // 本地开发服务器地址
    weddingInfo: {
      brideName: '小美',
      groomName: '小明',
      weddingDate: '2025-12-25 18:00:00',
      weddingLocation: '幸福大酒店'
    }
    // BGM相关配置已移至BGMManager类中管理
  }
}) 