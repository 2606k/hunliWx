// pages/message/message.js
const app = getApp()

Page({
  data: {
    messages: [],
    formData: {
      name: '',
      content: ''
    },
    submitting: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.checkAuth()
  },

  onShow() {
    this.checkAuth()
  },

  // 检查用户授权状态
  checkAuth() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return false
    }
    this.loadMessages()
    return true
  },

  onPullDownRefresh() {
    if (!app.checkUserAuth()) {
      wx.stopPullDownRefresh()
      app.showAuthRequiredDialog()
      return
    }
    this.setData({
      page: 1,
      messages: [],
      hasMore: true
    })
    this.loadMessages()
  },

  onReachBottom() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      'formData.content': e.detail.value
    })
  },

  // 提交留言
  submitMessage() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }
    
    const { name, content } = this.data.formData
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入祝福内容',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    // 模拟API调用
    wx.request({
      url: `${app.globalData.baseUrl}/wedding/message/submit`,
      method: 'POST',
      data: {
        name: name.trim() || null,
        content: content.trim()
      },
      success: (res) => {
        if (res.data.code ===200) {
          wx.showToast({
            title: '祝福发送成功',
            icon: 'success'
          })
          
          // 清空表单
          this.setData({
            formData: {
              name: '',
              content: ''
            }
          })
          
          // 重新加载留言列表
          this.setData({
            page: 1,
            messages: [],
            hasMore: true
          })
          this.loadMessages()
        } else {
          wx.showToast({
            title: res.data.message || '发送失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ submitting: false })
      }
    })
  },

  // 加载留言列表
  loadMessages() {
    this.setData({ loading: true })
    
    // 模拟API调用
    wx.request({
      url: `${app.globalData.baseUrl}/wedding/message/list`,
      method: 'GET',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data.code === 200) {
          const messages = res.data.data.map(message => ({
            ...message,
            submitTimeStr: this.formatDate(new Date(message.submitTime))
          }))
          
          this.setData({
            messages: this.data.page === 1 ? messages : [...this.data.messages, ...messages],
            hasMore: messages.length === this.data.pageSize,
            loading: false
          })
        } else {
          wx.showToast({
            title: res.data.message || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        this.setData({ loading: false })
      },
      complete: () => {
        wx.stopPullDownRefresh()
      }
    })
  },

  // 加载更多
  loadMore() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadMessages()
  },

  // 格式化日期
  formatDate(date) {
    const now = new Date()
    const diff = now - date
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚'
    }
    
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    }
    
    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    }
    
    // 大于24小时
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  }
}) 