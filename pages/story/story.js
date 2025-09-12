// pages/story/story.js
const app = getApp()

Page({
  data: {
    stories: [],
    page: 1,
    pageSize: 1,
    hasMore: true,
    loading: false,
    showAddModal: false,
    submitting: false,
    formData: {
      title: '',
      content: '',
      eventTime: '',
      gender: 1 // 默认为男性
    },
    richContentPreview: [], // 富文本内容预览
    currentCursorPosition: 0, // 当前光标位置
    userInfo: null // 添加用户信息
  },

  onLoad() {
    this.checkAuth()
    // 获取用户信息
    this.getUserInfo()
  },

  onShow() {
    this.checkAuth()
    // 获取用户信息
    this.getUserInfo()
  },

  // 获取用户信息
  getUserInfo() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    } else {
      // 如果app.globalData中没有用户信息，尝试从缓存获取
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          userInfo: userInfo
        })
      }
    }
  },

  // 检查用户授权状态
  checkAuth() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return false
    }
    this.loadStories()
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
      stories: [],
      hasMore: true
    })
    this.loadStories()
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

  // 加载故事列表
  loadStories() {
    this.setData({ loading: true })
    
    // 调用后台API
    wx.request({
      url: `${app.globalData.baseUrl}/wedding/story/list`,
      method: 'GET',
      data: {
        pageNum: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data.code === 200) {
          const pageData = res.data.data
          const stories = pageData.records.map(story => {
            const eventDate = new Date(story.eventTime)
            return Object.assign({}, story, {
              eventDay: eventDate.getDate(),
              eventMonth: this.getMonthName(eventDate.getMonth()),
              eventTimeStr: this.formatDate(eventDate),
              photos: story.photos || [],
              parsedContent: this.parseRichContent(story.content) // 解析富文本内容
            })
          })
          
          this.setData({
            stories: this.data.page === 1 ? stories : this.data.stories.concat(stories),
            hasMore: pageData.current < pageData.pages,
            loading: false
          })
        } else {
          wx.showToast({
            title: res.data.msg || '加载失败',
            icon: 'none'
          })
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      },
      complete: () => {
        wx.stopPullDownRefresh()
      }
    })
  },

  // 解析富文本内容
  parseRichContent(content) {
    if (!content) return '';
    
    // 将 [图片:URL:ID] 或 [图片:URL] 转换为 <img> 标签
    const imageRegex = /\[图片:(.*?)(?::\d+)?\]/g;
    const htmlContent = content.replace(imageRegex, (match, url) => {
      // 确保URL是完整的，如果不是，添加前缀
      let fullUrl = url;
      if (!url.startsWith('http')) {
        fullUrl = `https://marry-wx.oss-cn-beijing.aliyuncs.com/${url.startsWith('/') ? '' : '/'}${url}`;
      }
      return `<img class="story-content-image" src="${fullUrl}" style="max-width:100%;" />`;
    });
    
    // 转换换行符为 <br> 标签
    return htmlContent.replace(/\n/g, '<br>');
  },

  // 加载更多
  loadMore() {
    this.setData({
      page: this.data.page + 1
    })
    this.loadStories()
  },

  // 预览图片
  previewImage(e) {
    // 移除授权检查，允许未授权用户预览图片
    const urls = e.currentTarget.dataset.urls.map(photo => photo.url)
    const current = e.currentTarget.dataset.current
    
    // 使用全局预览方法
    app.previewImage({
      urls: urls,
      current: current
    })
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 获取月份名称
  getMonthName(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month]
  },

  // 显示新增故事弹窗
  showAddStoryModal() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }
    
    this.setData({
      showAddModal: true,
      formData: {
        title: '',
        content: '',
        eventTime: '',
        gender: 1 // 默认为男性
      },
      richContentPreview: [], // 清空富文本预览
      currentCursorPosition: 0
    })
  },

  // 隐藏新增故事弹窗
  hideAddStoryModal() {
    this.setData({
      showAddModal: false
    })
  },

  // 阻止弹窗关闭
  preventClose() {
    // 阻止事件冒泡，防止点击弹窗内容时关闭弹窗
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      'formData.content': e.detail.value,
      currentCursorPosition: e.detail.cursor || 0
    })
    
    // 更新预览
    this.updateRichContentPreview()
  },
  
  // 插入图片
  insertImage() {
    wx.chooseImage({
      count: 1, // 一次只能选一张图片
      sizeType: ['compressed'], // 压缩图
      sourceType: ['album', 'camera'], // 来源：相册、相机
      success: (res) => {
        // 返回选定照片的本地文件路径
        const tempFilePath = res.tempFilePaths[0]
        
        // 上传图片
        wx.showLoading({
          title: '上传中...',
          mask: true
        })
        
        wx.uploadFile({
          url: `${app.globalData.baseUrl}/wedding/photo/upload`,
          filePath: tempFilePath,
          name: 'file',
          // 不传入storyId，等故事创建后再关联
          formData: {
            storyId: '1' // 空storyId
          },
          success: (res) => {
            wx.hideLoading()
            
            try {
              // 解析返回的JSON字符串
              const data = JSON.parse(res.data)
              console.log('上传图片返回数据:', data)
              
              if (data.code === 200) {
                // 获取图片URL和ID
                const photoData = data.data
                const imageUrl = photoData.url
                const photoId = photoData.id
                
                console.log('上传图片成功, 原始URL:', imageUrl)
                
                // 尝试使用固定的URL格式
                // 从URL中提取文件名部分
                const urlParts = imageUrl.split('/');
                const fileName = urlParts[urlParts.length - 1];
                
                // 构建完整URL
                const fullUrl = `https://marry-wx.oss-cn-beijing.aliyuncs.com/${fileName}`;
                
                console.log('构建的完整URL:', fullUrl)
                
                // 插入图片标记到内容中，包含图片ID便于后续关联
                const content = this.data.formData.content
                const position = this.data.currentCursorPosition
                
                // 图片标记格式: [图片:URL:ID]
                const imageTag = `[图片:${fullUrl}:${photoId}]`
                
                // 在光标位置插入图片标记
                const newContent = content.slice(0, position) + imageTag + content.slice(position)
                
                this.setData({
                  'formData.content': newContent,
                  currentCursorPosition: position + imageTag.length
                })
                
                // 更新预览
                this.updateRichContentPreview()
              } else {
                wx.showToast({
                  title: data.msg || '上传失败',
                  icon: 'none'
                })
              }
            } catch (error) {
              console.error('解析上传返回数据失败:', error, res.data)
              wx.showToast({
                title: '上传失败，返回数据解析错误',
                icon: 'none'
              })
            }
          },
          fail: (error) => {
            console.error('上传图片失败:', error)
            wx.hideLoading()
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            })
          }
        })
      }
    })
  },
  
  // 下载图片到本地临时文件系统
  downloadImageToLocal(url, successCallback, failCallback) {
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          successCallback(res.tempFilePath)
        } else {
          console.error('下载图片失败，状态码:', res.statusCode)
          failCallback()
        }
      },
      fail: (error) => {
        console.error('下载图片失败:', error)
        failCallback()
      }
    })
  },
  
  // 更新富文本预览
  updateRichContentPreview() {
    const content = this.data.formData.content
    if (!content) {
      this.setData({
        richContentPreview: []
      })
      return
    }
    
    console.log('更新富文本预览, 原始内容:', content)
    
    // 解析内容，提取文本和图片
    const imageRegex = /\[图片:(.*?)(?::(.*?))?(?::(.*?))?\]/g
    let match
    let lastIndex = 0
    const preview = []
    
    // 查找所有图片标记
    while ((match = imageRegex.exec(content)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        preview.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        })
      }
      
      // 处理图片URL
      let imageUrl = match[1];
      let localPath = match[3]; // 可能不存在
      
      console.log('匹配到的图片URL:', imageUrl, '本地路径:', localPath)
      
      // 优先使用本地路径
      const finalUrl = localPath || imageUrl;
      
      // 如果没有本地路径且不是http开头，添加前缀
      if (!localPath && !finalUrl.startsWith('http')) {
        finalUrl = `https://marry-wx.oss-cn-beijing.aliyuncs.com/${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
      }
      
      console.log('最终使用的图片URL:', finalUrl)
      
      // 添加图片
      preview.push({
        type: 'image',
        content: finalUrl, // 优先使用本地路径
        photoId: match[2] || '', // 图片ID，可能不存在
        originalUrl: imageUrl, // 原始URL，用于调试
        loadStatus: '加载中' // 新增加载状态
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // 添加最后一段文本
    if (lastIndex < content.length) {
      preview.push({
        type: 'text',
        content: content.substring(lastIndex)
      })
    }
    
    console.log('富文本预览数据:', preview)
    
    this.setData({
      richContentPreview: preview
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    console.error('图片加载失败:', this.data.richContentPreview[index].content);
    
    // 更新图片加载状态
    const richContentPreview = this.data.richContentPreview;
    richContentPreview[index].loadStatus = '加载失败';
    
    this.setData({
      richContentPreview
    });
    
    wx.showToast({
      title: '图片加载失败',
      icon: 'none',
      duration: 1500
    });
  },
  
  // 图片加载成功处理
  onImageLoad(e) {
    const index = e.currentTarget.dataset.index;
    console.log('图片加载成功:', this.data.richContentPreview[index].content);
    
    // 更新图片加载状态
    const richContentPreview = this.data.richContentPreview;
    richContentPreview[index].loadStatus = '加载成功';
    
    this.setData({
      richContentPreview
    });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({
      'formData.eventTime': e.detail.value
    })
  },
  
  // 选择性别
  onGenderChange(e) {
    this.setData({
      'formData.gender': parseInt(e.detail.value)
    })
  },
  
  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.tempPhotos.length, // 最多可选择的图片数量
      sizeType: ['compressed'], // 压缩图
      sourceType: ['album', 'camera'], // 来源：相册、相机
      success: (res) => {
        // 返回选定照片的本地文件路径列表
        const tempFilePaths = res.tempFilePaths
        const tempFiles = res.tempFiles
        
        // 构建新的临时图片数组
        const newTempPhotos = tempFilePaths.map((path, index) => {
          return {
            path: path,
            size: tempFiles[index].size
          }
        })
        
        // 合并到现有的临时图片数组
        this.setData({
          tempPhotos: this.data.tempPhotos.concat(newTempPhotos)
        })
      }
    })
  },
  
  // 删除图片
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const tempPhotos = this.data.tempPhotos
    tempPhotos.splice(index, 1)
    this.setData({
      tempPhotos
    })
  },
  
  // 上传图片到服务器
  uploadPhotos() {
    return new Promise((resolve, reject) => {
      if (this.data.tempPhotos.length === 0) {
        // 没有图片，直接返回空数组
        resolve([])
        return
      }
      
      const uploadTasks = this.data.tempPhotos.map(photo => {
        return new Promise((resolveUpload, rejectUpload) => {
          wx.uploadFile({
            url: `${app.globalData.baseUrl}/wedding/photo/upload`,
            filePath: photo.path,
            name: 'file',
            success: (res) => {
              // 解析返回的JSON字符串
              const data = JSON.parse(res.data)
              if (data.code === 200) {
                resolveUpload(data.data) // 返回上传成功的图片URL
              } else {
                rejectUpload(new Error(data.msg || '上传失败'))
              }
            },
            fail: (error) => {
              rejectUpload(error)
            }
          })
        })
      })
      
      // 等待所有图片上传完成
      Promise.all(uploadTasks)
        .then(photoUrls => {
          resolve(photoUrls.map(url => {
            return { url }
          }))
        })
        .catch(error => {
          reject(error)
        })
    })
  },

  // 新增故事
  addStory() {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }

    const { title, content, eventTime, gender } = this.data.formData

    // 表单验证
    if (!title.trim()) {
      wx.showToast({
        title: '请输入故事标题',
        icon: 'none'
      })
      return
    }

    if (!content.trim()) {
      wx.showToast({
        title: '请输入故事内容',
        icon: 'none'
      })
      return
    }

    if (!eventTime) {
      wx.showToast({
        title: '请选择故事时间',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })
    
    // 提取内容中的图片ID列表
    const photoIds = this.extractPhotoIds(content)
    
    // 调用后台API新增故事
    wx.request({
      url: `${app.globalData.baseUrl}/wedding/story/add`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        title: title.trim(),
        content: content.trim(), // 直接提交包含图片标记的内容
        eventTime: new Date(eventTime + 'T00:00:00').toISOString(),
        gender: gender, // 添加性别字段
        photoIds: photoIds // 添加图片ID列表
      },
      success: (res) => {
        if (res.data.code === 200) {
          // const storyData = res.data.data,
          // const storyId = storyData.id,
          
          // 如果有图片ID，关联图片和故事
          // if (photoIds.length > 0) {
          //   // this.associatePhotosWithStory(photoIds, storyId)
          // } else {
            wx.showToast({
              title: '故事创建成功',
              icon: 'success'
            })
            
            // 隐藏弹窗
            this.hideAddStoryModal()
            
            // 重新加载故事列表
            this.setData({
              page: 1,
              stories: [],
              hasMore: true
            })
            this.loadStories()
        } else {
          wx.showToast({
            title: res.data.msg || '创建失败',
            icon: 'none'
          })
          this.setData({ submitting: false })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        this.setData({ submitting: false })
      }
    })
  },
  
  // 从内容中提取图片ID
  extractPhotoIds(content) {
    const photoIds = []
    const imageRegex = /\[图片:.*?:(\d+)\]/g
    let match
    
    while ((match = imageRegex.exec(content)) !== null) {
      if (match[1]) {
        photoIds.push(parseInt(match[1]))
      }
    }
    
    return photoIds
  },
  
  // 关联图片和故事
  associatePhotosWithStory(photoIds, storyId) {
    if (!photoIds.length) {
      return
    }
    
    // 调用API关联图片和故事
    wx.request({
      url: `${app.globalData.baseUrl}/wedding/photo/batch/update`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        photoIds: photoIds,
        storyId: storyId
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '故事创建成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '图片关联失败，请稍后重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '图片关联失败',
          icon: 'none'
        })
      },
      complete: () => {
        // 隐藏弹窗
        this.hideAddStoryModal()
        
        // 重新加载故事列表
        this.setData({
          page: 1,
          stories: [],
          hasMore: true,
          submitting: false
        })
        this.loadStories()
      }
    })
  },

  // 显示删除确认对话框
  showDeleteConfirm(e) {
    if (!app.checkUserAuth()) {
      app.showAuthRequiredDialog()
      return
    }

    const { id, title } = e.currentTarget.dataset
    
    wx.showModal({
      title: '删除确认',
      content: `确定要删除故事"${title}"吗？`,
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
      url: `${app.globalData.baseUrl}/wedding/story/${id}`,
      method: 'DELETE',
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          // 从列表中移除已删除的故事
          const stories = this.data.stories.filter(story => story.id !== id)
          this.setData({ stories })
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
  }
}) 