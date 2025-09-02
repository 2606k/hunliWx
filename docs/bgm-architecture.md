# BGM全局同步架构设计

## 架构图

```mermaid
graph TB
    App["App (全局应用)"] --> BGMManager["BGMManager (单例管理器)"]
    
    BGMManager --> AudioContext["audioContext<br/>(唯一音频实例)"]
    BGMManager --> State["全局状态<br/>- isPlaying<br/>- currentMusicIndex<br/>- musicUrls"]
    BGMManager --> Listeners["监听器集合<br/>(Set<callback>)"]
    
    subgraph Pages["页面层"]
        IndexPage["首页<br/>(index)"]
        MessagePage["留言页<br/>(message)"]
        PhotoPage["相册页<br/>(photo)"]
        StoryPage["故事页<br/>(story)"]
    end
    
    subgraph Components["BGM组件层"]
        BGM1["BGM组件1<br/>(首页)"]
        BGM2["BGM组件2<br/>(留言页)"]
        BGM3["BGM组件3<br/>(相册页)"]
        BGM4["BGM组件4<br/>(故事页)"]
    end
    
    IndexPage --> BGM1
    MessagePage --> BGM2
    PhotoPage --> BGM3
    StoryPage --> BGM4
    
    BGM1 --> BGMManager
    BGM2 --> BGMManager
    BGM3 --> BGMManager
    BGM4 --> BGMManager
    
    BGMManager -.->|状态变化通知| BGM1
    BGMManager -.->|状态变化通知| BGM2
    BGMManager -.->|状态变化通知| BGM3
    BGMManager -.->|状态变化通知| BGM4
```

## 数据流图

```mermaid
sequenceDiagram
    participant User as 用户
    participant BGM1 as BGM组件1(首页)
    participant Manager as BGMManager
    participant BGM2 as BGM组件2(留言页)
    participant Audio as AudioContext
    
    User->>BGM1: 点击播放/暂停按钮
    BGM1->>Manager: togglePlay()
    Manager->>Audio: pause()/play()
    Manager->>Manager: 更新全局状态
    Manager->>BGM1: 通知状态变化
    Manager->>BGM2: 通知状态变化
    BGM1->>BGM1: 更新UI显示
    BGM2->>BGM2: 更新UI显示
    
    Note over User,Audio: 用户切换到留言页
    User->>BGM2: 查看BGM状态
    Note over BGM2: BGM2显示正确的播放状态
```

## 核心类图

```mermaid
classDiagram
    class BGMManager {
        -audioContext: InnerAudioContext
        -isPlaying: boolean
        -currentMusicIndex: number
        -musicUrls: string[]
        -listeners: Set~Function~
        
        +init(): void
        +togglePlay(): void
        +playNextMusic(): void
        +getState(): Object
        +addListener(callback): void
        +removeListener(callback): void
        +notifyListeners(): void
        +destroy(): void
    }
    
    class BGMComponent {
        -bgmStateCallback: Function
        -animation: Animation
        -rotateTimer: Timer
        
        +initGlobalBGM(): void
        +togglePlay(): void
        +updateIconAnimation(): void
        +startRotateAnimation(): void
        +stopRotateAnimation(): void
        +cleanup(): void
    }
    
    class App {
        -bgmManager: BGMManager
        -globalData: Object
        
        +onLaunch(): void
        +getUserOpenId(): Promise
        +checkUserAuth(): boolean
    }
    
    App --> BGMManager : creates
    BGMComponent --> BGMManager : uses
    BGMManager --> BGMComponent : notifies
```

## 实现原理

### 1. 单例模式
- BGMManager在App启动时创建唯一实例
- 所有BGM组件共享同一个音频上下文
- 避免多个音频实例同时播放的问题

### 2. 观察者模式
- BGM组件注册状态监听器到BGMManager
- 状态变化时，BGMManager通知所有监听器
- 实现跨组件的状态同步

### 3. 状态管理
- 全局状态：播放状态、当前歌曲索引、音乐列表
- 本地状态：动画状态、UI显示状态
- 状态分离确保数据一致性

### 4. 生命周期管理
- 组件attached时注册监听器
- 组件detached时清理监听器
- 避免内存泄漏和重复监听

## 优势

1. **状态一致性**：所有页面BGM状态完全同步
2. **性能优化**：单一音频实例，减少资源消耗
3. **用户体验**：页面切换时音乐状态保持连续
4. **代码维护**：集中管理，易于扩展和修改
5. **内存安全**：正确的资源清理，避免内存泄漏

@author tangxin
