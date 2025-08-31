// components/home-btn/home-btn.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 返回首页
    goToHome() {
      console.log('点击返回首页按钮')
      wx.reLaunch({
        url: '/pages/index/index',
        success: () => {
          console.log('成功跳转到首页')
        },
        fail: (error) => {
          console.error('跳转失败:', error)
        }
      })
    }
  }
}) 