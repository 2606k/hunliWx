// components/bgm/bgm.js
Component({
  properties: {
    musicUrls: {
      type: Array,
      value: [
        'http://124.222.172.221:9000/marry//20250811try.mp3',
        'http://124.222.172.221:9000/marry//20250812try.mp3'
      ]
    },
    musicIconUrl: {
      type: String,
      value: 'http://124.222.172.221:9000/marry//Music.svg'
    }
  },

  data: {
    isPlaying: true,
    currentMusicIndex: 0,
    animation: null
  },

  lifetimes: {
    attached() {
      this.initAudio();
      this.initAnimation();
    },
    detached() {
      if (this.audioContext) {
        this.audioContext.destroy();
      }
    }
  },

  methods: {
    initAudio() {
      const { musicUrls } = this.properties;
      const { currentMusicIndex } = this.data;
      
      // 创建音频上下文
      this.audioContext = wx.createInnerAudioContext();
      this.audioContext.src = musicUrls[currentMusicIndex];
      this.audioContext.loop = false; // 不循环单曲，我们自己处理切换
      this.audioContext.autoplay = true;
      
      // 监听播放结束
      this.audioContext.onEnded(() => {
        this.playNextMusic();
      });
      
      // 监听播放错误
      this.audioContext.onError((res) => {
        console.error('音频播放错误:', res);
        this.playNextMusic(); // 出错时尝试播放下一首
      });
    },
    
    initAnimation() {
      this.animation = wx.createAnimation({
        duration: 3000,
        timingFunction: 'linear',
        delay: 0
      });
    },
    
    togglePlay() {
      const { isPlaying } = this.data;
      
      if (isPlaying) {
        this.audioContext.pause();
      } else {
        this.audioContext.play();
      }
      
      this.setData({
        isPlaying: !isPlaying
      });
      
      this.updateIconAnimation(!isPlaying);
    },
    
    updateIconAnimation(isPlaying) {
      if (isPlaying) {
        this.startRotateAnimation();
      } else {
        this.stopRotateAnimation();
      }
    },
    
    startRotateAnimation() {
      this.animation.rotate(360).step();
      this.setData({
        animationData: this.animation.export()
      });
      
      // 重复动画
      this.rotateTimer = setInterval(() => {
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
    
    playNextMusic() {
      const { musicUrls } = this.properties;
      let { currentMusicIndex } = this.data;
      
      // 切换到下一首歌
      currentMusicIndex = (currentMusicIndex + 1) % musicUrls.length;
      
      this.setData({ currentMusicIndex });
      this.audioContext.src = musicUrls[currentMusicIndex];
      
      if (this.data.isPlaying) {
        this.audioContext.play();
      }
    }
  }
}) 