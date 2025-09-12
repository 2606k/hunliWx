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
    pageSize: 20000,
    hasMore: true,
    loading: false,
    showAddModal: false // 新增弹窗显示状态
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
    this.loadMessages();
    return true
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.nickName && userInfo.avatarUrl) {
      return userInfo
    }
    // 如果本地存储没有，尝试从全局获取
    if (app.globalData.userInfo && app.globalData.userInfo.nickName && app.globalData.userInfo.avatarUrl) {
      return app.globalData.userInfo
    }
    return null
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

  // 显示新增留言弹窗
  showAddMessageModal() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }
    
    // 动态获取用户信息
    const userInfo = this.getUserInfo()
    if (!userInfo) {
      wx.showToast({
        title: '用户信息获取失败',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      showAddModal: true,
      formData: {
        name: '',
        content: '',
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      }
    })
  },

  // 隐藏新增留言弹窗
  hideAddMessageModal() {
    this.setData({
      showAddModal: false
    })
  },

  // 阻止弹窗关闭
  preventClose() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },

  // 提交留言
  submitMessage() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }
    
    const { name, content, nickName, avatarUrl } = this.data.formData
    
    // 验证必要字段
    if (!content.trim()) {
      wx.showToast({
        title: '请输入祝福内容',
        icon: 'none'
      })
      return
    }
    
    if (!nickName || !avatarUrl) {
      wx.showToast({
        title: '用户信息不完整，请重新授权',
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
        content: content.trim(),
        nickName: nickName,
        avatarUrl: avatarUrl
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '祝福发送成功',
            icon: 'success'
          })
          
          // 清空表单并关闭弹窗
          this.setData({
            formData: {
              name: '',
              content: ''
            },
            showAddModal: false
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
        // page: this.data.page,
        // pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data.code === 200) {
          const messages = res.data.data.map(message => {
            // 预处理数据，添加显示字段
            const displayName = message.name || message.nickName || '匿名'
            const avatarText = displayName !== '匿名' ? displayName.charAt(0) : '匿'
            
            return Object.assign({}, message, {
              submitTimeStr: this.formatDate(new Date(message.submitTime)),
              displayName: displayName,
              avatarText: avatarText
            })
          })
          
          // 确保留言数量足够支持三排布局，但不重复
          let processedMessages = messages
          if (messages.length < 6 && messages.length >0) {
            // 如果留言太少，复制一些来填充三排，但保持不重复
            const repeatCount = Math.ceil(6 / messages.length)
            processedMessages = []
              for (let i = 0; i < repeatCount; i++) {
              for (let j = 0; j < messages.length; j++) {
                processedMessages.push(messages[j])
              }
            }
          }
          
          this.setData({
            messages: this.data.page === 1 ? processedMessages : this.data.messages.concat(processedMessages),
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