# 婚礼小程序

一个专为婚礼设计的微信小程序，提供扫码入场、故事展示、相册浏览和留言互动等功能。

## 功能特性

### 🎫 扫码入场
- 扫描二维码即可入场，无需特殊名单设置
- 支持手动输入邀请码作为备选方案
- 扫码成功后显示个性化欢迎信息

### 📖 故事时间轴
- 展示新人故事的时间轴
- 支持图文混排的内容展示
- 按时间顺序排列，美观易读

### 📸 照片瀑布流
- 照片瀑布流展示
- 支持筛选功能（全部/故事配图/婚礼照片）
- 点击图片可预览大图

### 💬 留言互动
- 来宾可留下祝福留言
- 支持匿名留言
- 提交即展示，无需审核
- 实时显示留言列表

## 技术栈

- **前端框架**: 微信小程序原生开发
- **样式**: WXSS (类似CSS)
- **逻辑**: JavaScript
- **后端**: Java + MyBatis-Plus

## 项目结构

```
hunli/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置文件
├── app.wxss              # 全局样式文件
├── sitemap.json          # 站点地图配置
├── project.config.json   # 项目配置文件
├── README.md             # 项目说明文档
└── pages/                # 页面目录
    ├── index/            # 首页（扫码入场）
    │   ├── index.wxml
    │   ├── index.js
    │   └── index.wxss
    ├── story/            # 故事时间轴
    │   ├── story.wxml
    │   ├── story.js
    │   └── story.wxss
    ├── photo/            # 照片瀑布流
    │   ├── photo.wxml
    │   ├── photo.js
    │   └── photo.wxss
    ├── message/          # 留言互动
    │   ├── message.wxml
    │   ├── message.js
    │   └── message.wxss
    └── scan/             # 扫码页面
        ├── scan.wxml
        ├── scan.js
        └── scan.wxss
```

## 后端API接口

### 故事相关接口
- `GET /api/wedding/story/list` - 获取故事列表
- `POST /api/wedding/story/add` - 添加故事
- `PUT /api/wedding/story/update` - 更新故事
- `DELETE /api/wedding/story/delete` - 删除故事

### 照片相关接口
- `GET /api/wedding/photo/list` - 获取照片列表
- `POST /api/wedding/photo/upload` - 上传照片
- `DELETE /api/wedding/photo/delete` - 删除照片

### 留言相关接口
- `GET /api/wedding/message/list` - 获取留言列表
- `POST /api/wedding/message/submit` - 提交留言

## 数据库设计

### 故事表 (wedding_story)
```sql
CREATE TABLE wedding_story (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL COMMENT '故事标题',
    event_time DATETIME NOT NULL COMMENT '事件时间',
    content TEXT COMMENT '故事详情',
    sort_order INT DEFAULT 0 COMMENT '展示顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);
```

### 照片表 (wedding_photo)
```sql
CREATE TABLE wedding_photo (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    story_id BIGINT COMMENT '关联故事ID',
    url VARCHAR(500) NOT NULL COMMENT '照片存储路径',
    `desc` VARCHAR(200) COMMENT '照片描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间'
);
```

### 留言表 (wedding_guest_message)
```sql
CREATE TABLE wedding_guest_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) COMMENT '留言人姓名',
    content TEXT NOT NULL COMMENT '留言内容',
    submit_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间'
);
```

## 开发环境配置

1. 下载并安装微信开发者工具
2. 导入项目到微信开发者工具
3. 在 `project.config.json` 中配置你的小程序 AppID
4. 在 `app.js` 中配置后端API地址

## 部署说明

1. 在微信公众平台注册小程序
2. 获取小程序 AppID 并配置到项目中
3. 上传代码到微信公众平台
4. 提交审核并发布

## 注意事项

- 请确保后端API地址配置正确
- 图片上传需要配置相应的存储服务（如OSS）
- 扫码功能需要在小程序后台配置相应权限
- 建议在正式环境中添加适当的安全验证

## 联系方式

如有问题或建议，请联系开发团队。

---

© 2024 婚礼小程序开发团队 