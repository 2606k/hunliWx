// components/bgm/bgm.js
/**
 * 全局BGM组件
 * 使用全局BGM管理器实现跨页面状态同步
 * @author tangxin
 */
Component({
  properties: {
    musicIconUrl: {
      type: String,
      value: '/images/Music.svg'
    }
  },

  data: {
    isPlaying: true,
    currentMusicIndex: 0,
    animation: null
  },

  lifetimes: {
    attached() {
      this.initAnimation();
      this.initGlobalBGM();
    },
    detached() {
      this.cleanup();
    }
  },

  methods: {
    // 初始化全局BGM管理器连接
    initGlobalBGM() {
      const app = getApp();
      if (!app.bgmManager) {
        console.error('全局BGM管理器未初始化');
        return;
      }
      
      // 添加状态监听器
      this.bgmStateCallback = (state) => {
        this.setData({
          isPlaying: state.isPlaying,
          currentMusicIndex: state.currentMusicIndex
        });
        this.updateIconAnimation(state.isPlaying);
      };
      
      app.bgmManager.addListener(this.bgmStateCallback);
    },
    
    initAnimation() {
      this.animation = wx.createAnimation({
        duration: 3000,
        timingFunction: 'linear',
        delay: 0
      });
    },
    
    // 切换播放/暂停状态
    togglePlay() {
      const app = getApp();
      if (app.bgmManager) {
        app.bgmManager.togglePlay();
      }
    },
    
    updateIconAnimation(isPlaying) {
      if (isPlaying) {
        this.startRotateAnimation();
      } else {
        this.stopRotateAnimation();
      }
    },
    
    startRotateAnimation() {
      if (!this.animation) {
        console.warn('动画对象未初始化，跳过旋转动画');
        return;
      }
      
      this.animation.rotate(360).step();
      this.setData({
        animationData: this.animation.export()
      });
      
      // 重复动画
      this.rotateTimer = setInterval(() => {
        if (!this.animation) {
          clearInterval(this.rotateTimer);
          this.rotateTimer = null;
          return;
        }
        this.animation.rotate(360).step();
        this.setData({
          animationData: this.animation.export()
        });
      }, 3000);
    },
    
    stopRotateAnimation() {
      if (this.rotateTimer) {
        clearInterval(this.rotateTimer);
        this.rotateTimer = null;
      }
    },
    
    // 清理资源
    cleanup() {
      const app = getApp();
      if (app.bgmManager && this.bgmStateCallback) {
        app.bgmManager.removeListener(this.bgmStateCallback);
      }
      this.stopRotateAnimation();
    }
  }
}) 