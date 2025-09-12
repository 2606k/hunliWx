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
      'https://marry-wx.oss-cn-beijing.aliyuncs.com//20250811try.mp3',
      'https://marry-wx.oss-cn-beijing.aliyuncs.com//20250811独家记忆.mp3',
      'https://marry-wx.oss-cn-beijing.aliyuncs.com//20250811传奇.mp3',
      'https://marry-wx.oss-cn-beijing.aliyuncs.com//20250811爱就一个字_3.mp3'
    ]
    this.listeners = [] // 存储所有监听器
    this.wasPlayingBeforeHide = true // 记录小程序隐藏前的播放状态
    this.init()
    
    // 监听小程序进入前台事件，恢复音乐播放
    wx.onAppShow(() => {
      console.log('小程序进入前台，音乐状态:', this.wasPlayingBeforeHide)
      if (this.wasPlayingBeforeHide && this.audioContext) {
        // 如果之前是播放状态，则恢复播放
        this.audioContext.play()
        this.isPlaying = true
        this.notifyListeners()
      }
    })
    
    // 监听小程序进入后台事件，记录当前播放状态
    wx.onAppHide(() => {
      console.log('小程序进入后台，当前音乐状态:', this.isPlaying)
      // 记录隐藏前的播放状态
      this.wasPlayingBeforeHide = this.isPlaying
    })
  }

  init() {
    // 创建音频上下文
    if (this.audioContext) {
      // 如果已存在，先销毁
      this.audioContext.destroy()
    }
    
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = this.musicUrls[this.currentMusicIndex]
    this.audioContext.loop = false
    this.audioContext.autoplay = true
    
    // 设置音频不受静音键和屏幕锁定的影响
    try {
      // 注意：这个API需要基础库 2.3.0 以上
      if (wx.setInnerAudioOption) {
        wx.setInnerAudioOption({
          obeyMuteSwitch: false,  // 是否遵循系统静音开关，默认为 true
          speakerOn: true         // 是否使用扬声器播放，默认为 true
        })
      }
    } catch (e) {
      console.error('设置音频选项失败:', e)
    }
    
    // 监听播放结束
    this.audioContext.onEnded(() => {
      this.playNextMusic()
    })
    
    // 监听播放错误
    this.audioContext.onError((res) => {
      console.error('音频播放错误:', res)
      this.playNextMusic()
    })
    
    // 监听音频暂停事件
    this.audioContext.onPause(() => {
      console.log('音频被暂停')
      // 如果当前状态是播放中，但音频被暂停了（可能是系统行为），更新状态
      if (this.isPlaying) {
        this.isPlaying = false
        this.notifyListeners()
      }
    })
    
    // 监听音频播放事件
    this.audioContext.onPlay(() => {
      console.log('音频开始播放')
      // 如果当前状态是暂停，但音频开始播放了，更新状态
      if (!this.isPlaying) {
        this.isPlaying = true
        this.notifyListeners()
      }
    })
  }

  // 切换播放/暂停状态
  togglePlay() {
    if (this.isPlaying) {
      this.audioContext.pause()
      this.isPlaying = false
    } else {
      // 尝试恢复播放
      try {
        this.audioContext.play()
        
        // 添加播放成功的回调确认
        const playPromise = new Promise((resolve) => {
          // 设置一个短暂的超时，检查是否真的开始播放
          setTimeout(() => {
            // 如果音频正在播放，则认为播放成功
            if (!this.audioContext.paused) {
              resolve(true)
            } else {
              // 如果仍然是暂停状态，可能是系统限制
              console.warn('尝试播放音频失败，可能是系统限制')
              resolve(false)
            }
          }, 100)
        })
        
        // 处理播放结果
        playPromise.then((success) => {
          if (success) {
            this.isPlaying = true
            this.notifyListeners()
          }
        })
      } catch (e) {
        console.error('播放音频时出错:', e)
        // 播放失败时不更改状态
        return
      }
      
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
    // this.getUserOpenId()
  },

  // 通用的图片预览方法，确保在预览结束后恢复音乐播放
  previewImage(options) {
    // 保存当前BGM状态
    const wasMusicPlaying = this.bgmManager && this.bgmManager.getState().isPlaying
    
    // 调用系统预览图片方法
    wx.previewImage({
      urls: options.urls,
      current: options.current,
      success: options.success || function() {},
      fail: options.fail || function(err) {
        console.error('图片预览失败', err)
      },
      complete: () => {
        // 调用原始complete回调
        if (options.complete) {
          options.complete()
        }
        
        // 预览结束后，如果之前音乐是播放状态，则恢复播放
        if (wasMusicPlaying && this.bgmManager) {
          // 延迟一点恢复播放，确保预览已完全关闭
          setTimeout(() => {
            if (!this.bgmManager.getState().isPlaying) {
              this.bgmManager.togglePlay()
            }
          }, 300)
        }
      }
    })
  },

  // 检查用户是否已授权
  checkUserAuth() {
    const userInfo = wx.getStorageSync('userInfo')
    // const openid = this.globalData.openid || wx.getStorageSync('openid')

    // 只检查用户是否已授权，不强制要求授权
    return !!(userInfo && userInfo.userId)
  },
  
  // 显示未授权提示并跳转到首页
  showAuthRequiredDialog() {
    wx.showModal({
      title: '提示',
      content: '该功能需要授权才能使用，您可以在首页选择是否授权登录',
      showCancel: true,
      cancelText: '暂不授权',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }
    })
  },
  
  globalData: {
    userInfo: null,
    baseUrl: 'https://hn.gzlove.top/marry', // 线上开发服务器地址
    weddingInfo: {
      brideName: '小美',
      groomName: '小明',
      weddingDate: '2025-12-25 18:00:00',
      weddingLocation: '幸福大酒店'
    }
    // BGM相关配置已移至BGMManager类中管理
  }
}) 