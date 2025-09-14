// pages/photo/photo.js
const app = getApp()

Page({
  data: {
    allPhotos: [],
    leftPhotos: [],
    rightPhotos: [],
    allPhotoUrls: [],
    currentFilter: 'all',
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    // 分页相关数据
    currentPageIndex: 0,
    pageCount: 1,
    photosPerPage: 1, // 修改为每页只显示1张照片
    paginatedPhotos: [],
    currentPhoto: null, // 添加当前显示的照片
    isAuthorized: false, // 添加授权状态
    showUserInfoModal: false, // 用户信息填写弹窗
    tempUserInfo: { // 临时用户信息
      nickName: '',
      avatarUrl: ''
    }
  },

  onLoad() {
    this.checkAuth()
  },

  onShow() {
    this.checkAuth()
  },

  // 授权状态改变回调
  onAuthStatusChanged() {
    console.log('收到授权状态改变通知')
    // 重新检查授权状态
    this.checkAuth()
  },

  // 显示用户信息填写弹窗
  showUserInfoModal() {
    this.setData({
      showUserInfoModal: true,
      tempUserInfo: {
        nickName: '',
        avatarUrl: 'https://marry-wx.oss-cn-beijing.aliyuncs.com/default-avatar.png'
      }
    })
  },

  // 隐藏用户信息填写弹窗
  hideUserInfoModal() {
    this.setData({
      showUserInfoModal: false
    })
  },

  // 选择头像
  chooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      'tempUserInfo.avatarUrl': avatarUrl
    })
  },

  // 输入昵称
  onNickNameInput(e) {
    this.setData({
      'tempUserInfo.nickName': e.detail.value
    })
  },

  // 提交用户信息
  submitUserInfo() {
    const { nickName, avatarUrl } = this.data.tempUserInfo
    
    if (!nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    const userInfo = {
      nickName: nickName.trim(),
      avatarUrl: avatarUrl
    }

    // 调用全局方法保存用户信息
    app.saveCustomUserInfo(userInfo)
    
    // 隐藏弹窗
    this.hideUserInfoModal()
  },

  // 检查用户授权状态
  checkAuth() {
    // 获取授权状态，但不强制要求授权
    const isAuthorized = app.checkUserAuth()
    this.setData({
      isAuthorized: isAuthorized
    })
    
    // 无论是否授权，都加载照片
    this.loadPhotos()
    return true
  },

  onPullDownRefresh() {
    // 下拉刷新不需要授权检查
    this.setData({
      page: 1,
      allPhotos: [],
      leftPhotos: [],
      rightPhotos: [],
      allPhotoUrls: [],
      hasMore: true,
      currentPageIndex: 0,
      paginatedPhotos: [],
      currentPhoto: null
    })
    this.loadPhotos()
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
  // 显示删除确认对话框
  showDeleteConfirm(e) {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }

    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '删除确认',
      content: `确定要删除这张照片吗？`,
      confirmText: '删除',
      confirmColor: '#ff6b9d',
      success: (res) => {
        if (res.confirm) {
          this.deleteStory(id)
        }
      }
    })
  },

  // 删除故事
  deleteStory(id) {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }

    wx.showLoading({
      title: '删除中...'
    })

    // 调用后台API删除故事
    wx.request({
      url: `${app.globalData.baseUrl}/wedding/photo/${id}`,
      method: 'DELETE',
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          // 从列表中移除已删除的故事
          const allPhotos = this.data.allPhotos.filter(photo => photo.id !== id)
          const allPhotoUrls = allPhotos.map(photo => photo.url)
          
          this.setData({ 
            allPhotos,
            allPhotoUrls
          })
          
          // 重新分配照片到左右两列
          this.distributePhotos()
        } else {
          wx.showToast({
            title: res.data.msg || '删除失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 加载照片列表
  loadPhotos() {
    this.setData({ loading: true })
    let url = `${app.globalData.baseUrl}/wedding/photo/story/0`
    // let url = `${app.globalData.baseUrl}/wedding/photo/list`
    
    // 根据筛选条件设置不同的URL
    // if (this.data.currentFilter === 'wedding') {
    //   url = `${app.globalData.baseUrl}/wedding/photo/story/0`
    // } else if (this.data.currentFilter === 'story') {
    //   url = `${app.globalData.baseUrl}/wedding/photo/story/1`
    // }
    
    wx.request({
      url: url,
      method: 'GET',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data.code===200) {
          const photos = res.data.data.map(photo => Object.assign({}, photo, {
            createTimeStr: this.formatDate(new Date(photo.createTime))
          }))
          
          const allPhotos = this.data.page === 1 ? photos : this.data.allPhotos.concat(photos)
          const allPhotoUrls = allPhotos.map(photo => photo.url)
          
          this.setData({
            allPhotos,
            allPhotoUrls,
            hasMore: photos.length === this.data.pageSize,
            loading: false
          })
          
          this.distributePhotos()
          // 添加分页处理
          this.paginatePhotos()
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

  // 分配照片到左右两列
  distributePhotos() {
    const leftPhotos = []
    const rightPhotos = []
    
    this.data.allPhotos.forEach((photo, index) => {
      if (index % 2 === 0) {
        leftPhotos.push(photo)
      } else {
        rightPhotos.push(photo)
      }
    })
    
    this.setData({
      leftPhotos,
      rightPhotos
    })
  },

  // 设置筛选条件
  setFilter(e) {
    const filter = e.currentTarget.dataset.type
    this.setData({
      currentFilter: filter,
      page: 1,
      allPhotos: [],
      leftPhotos: [],
      rightPhotos: [],
      allPhotoUrls: [],
      hasMore: true
    })
    this.loadPhotos()
  },

  // 加载更多
  loadMore() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadPhotos()
  },

  // 预览图片
  previewImage(e) {
    // 移除授权检查，允许未授权用户预览图片
    const current = e.currentTarget.dataset.url
    const urls = e.currentTarget.dataset.urls
    
    // 使用全局预览方法
    app.previewImage({
      urls: urls,
      current: current
    })
  },

  // 上传照片
  uploadPhotos() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }

    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        
        wx.showLoading({
          title: '上传中...',
          mask: true
        })
        
        let successCount = 0
        let failCount = 0
        
        // 循环上传所有选中的图片
        tempFilePaths.forEach((filePath, index) => {
          this.uploadSinglePhoto(filePath, index === tempFilePaths.length - 1, () => {
            successCount++
            if (successCount + failCount === tempFilePaths.length) {
              this.handleUploadComplete(successCount, failCount)
            }
          }, () => {
            failCount++
            if (successCount + failCount === tempFilePaths.length) {
              this.handleUploadComplete(successCount, failCount)
            }
          })
        })
      }
    })
  },
  
  // 上传单张照片
  uploadSinglePhoto(filePath, isLast, onSuccess, onFail) {
    wx.uploadFile({
      url: `${app.globalData.baseUrl}/wedding/photo/upload`,
      filePath: filePath,
      name: 'file',
      formData: {
        storyId: 0, // 默认为婚礼照片
        desc: ''
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            onSuccess()
          } else {
            onFail()
          }
        } catch (e) {
          onFail()
        }
      },
      fail: () => {
        onFail()
      }
    })
  },
  
  // 处理上传完成
  handleUploadComplete(successCount, failCount) {
    wx.hideLoading()
    
    if (failCount === 0) {
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: `成功${successCount}张，失败${failCount}张`,
        icon: 'none'
      })
    }
    
    // 刷新照片列表
    this.setData({
      page: 1,
      allPhotos: [],
      leftPhotos: [],
      rightPhotos: [],
      allPhotoUrls: [],
      hasMore: true
    })
    this.loadPhotos()
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 修改分页相关方法
  paginatePhotos() {
    const allPhotos = this.data.allPhotos
    const photosPerPage = this.data.photosPerPage
    const pageCount = Math.ceil(allPhotos.length / photosPerPage)
    
    this.setData({
      pageCount: pageCount > 0 ? pageCount : 1
    })
    
    this.showCurrentPage()
  },
  
  // 显示当前页的照片
  showCurrentPage() {
    const allPhotos = this.data.allPhotos
    const currentIndex = this.data.currentPageIndex
    const currentPhoto = allPhotos[currentIndex] || null
    
    this.setData({
      currentPhoto,
      // 清空左右列的照片，因为现在只显示一张
      leftPhotos: [],
      rightPhotos: []
    })
  },
  
  // 切换到上一页
  prevPage() {
    if (this.data.currentPageIndex > 0) {
      this.setData({
        currentPageIndex: this.data.currentPageIndex - 1
      })
      this.showCurrentPage()
    }
  },
  
  // 切换到下一页
  nextPage() {
    if (this.data.currentPageIndex < this.data.allPhotos.length - 1) {
      this.setData({
        currentPageIndex: this.data.currentPageIndex + 1
      })
      this.showCurrentPage()
    }
  },
  
  // 滑动切换页面
  onSwiperChange(e) {
    const current = e.detail.current
    if (current < this.data.allPhotos.length) {
      this.setData({
        currentPageIndex: current
      })
      this.showCurrentPage()
    }
  },

  // 点击指示器跳转到指定页面
  goToPage(e) {
    const index = e.currentTarget.dataset.index
    if (index >= 0 && index < this.data.allPhotos.length) {
      this.setData({
        currentPageIndex: index
      })
      this.showCurrentPage()
    }
  }
}) 