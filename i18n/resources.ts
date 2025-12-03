





import { BlogPost } from "../types";

export const resources = {
  en: {
    header: {
      home: 'Home',
      blog: 'Journal',
      about: 'Profile',
      privateSpace: 'Sanctuary',
      chat: 'Comm Link',
      signOut: 'Disconnect',
      signIn: 'Connect',
      profile: 'Personal Center',
      settings: 'System Settings',
      audit: 'System Audit',
      notifications: 'Alerts',
      clearAll: 'Clear All',
      emptyNotifications: 'No new alerts'
    },
    hero: {
      status: 'System Online',
      title1: 'Exploring',
      title2: 'the Unknown',
      introPrefix: 'I am ',
      introName: 'Sam',
      introSuffix: '. Navigating the digital cosmos, building robust architectures, and exploring the frontiers of Artificial Intelligence.',
      ctaPrimary: 'Explore Journal',
      ctaSecondary: 'System Profile'
    },
    blogList: {
      title: 'Transmission Log',
      subtitle: 'Recorded thoughts on engineering, star charts, and digital evolution.',
      titlePrivate: 'Encrypted Vault',
      subtitlePrivate: 'Classified documentation and personal logs.',
      viewAll: 'View all logs',
      readArticle: 'Access Data',
      systemLog: 'System Log // Public Access',
      entries: 'ENTRIES',
      status: 'STATUS',
      online: 'ONLINE',
      searchPlaceholder: 'Search logs via keywords...',
      filter: 'Filter:',
      all: 'All',
      noLogs: 'No logs found',
      adjustSearch: 'Adjust your search parameters',
      clearFilters: 'Clear Filters',
      page: 'PAGE'
    },
    auditLog: {
      title: 'System Activity Log',
      subtitle: 'Tracking all operational commands within the mainframe.',
      operator: 'Operator',
      action: 'Command',
      target: 'Target Object',
      time: 'Timestamp',
      ip: 'Origin IP',
      noData: 'No activity recorded in current sector.'
    },
    pagination: {
      prev: 'Previous Sector',
      next: 'Next Sector',
      page: 'Sector'
    },
    login: {
      welcome: 'Identify Yourself',
      welcomeRegister: 'New Entity',
      welcomeReset: 'Reset Clearance',
      subtitle: 'Authenticate to access restricted sectors',
      subtitleRegister: 'Register to obtain clearance',
      subtitleReset: 'Use secret protocol to restore access',
      name: 'Codename',
      email: 'Comm Link',
      password: 'Access Key',
      newPassword: 'New Access Key',
      secretKey: 'Secret Protocol Key',
      confirmPassword: 'Confirm Key',
      signin: 'Authenticate',
      register: 'Initialize',
      reset: 'Restore Access',
      toRegister: 'No clearance? Initialize',
      toLogin: 'Have clearance? Authenticate',
      forgotPassword: 'Lost Access Key?',
      backToLogin: 'Back to Authentication',
      error: 'Authentication failed. Access denied.',
      passwordMismatch: 'Access Keys do not match.'
    },
    profile: {
      title: 'Personal Center',
      subtitle: 'Manage your identity and clearance details.',
      displayName: 'Display Name',
      email: 'Registered Email',
      uid: 'Entity ID',
      save: 'Update Identity',
      developing: 'Module under development...',
      security: 'Security Protocol',
      changePassword: 'Change Access Key',
      oldPassword: 'Current Access Key',
      newPassword: 'New Access Key',
      admin: 'Admin Console',
      grantVip: 'Grant VIP Clearance',
      targetEmail: 'Target Entity Email',
      dataManagement: 'Data Management',
      exportLogs: 'Export Logs',
      active: 'Active',
      vipBadge: 'VIP',
      downloadBackup: 'Download a backup of all your personal logs in JSON format.'
    },
    settings: {
      title: 'System Configuration',
      subtitle: 'Adjust interface parameters and localization.',
      theme: 'Visual Interface',
      language: 'Language Protocol',
      light: 'Light Mode',
      dark: 'Dark Mode',
      en: 'English',
      zh: 'Chinese'
    },
    resume: {
      role: 'Engineer / Voyager',
      bio: 'Focused on Tech, Investment, and Personal Growth.',
      credentials: 'Ex-Tencent & Lalamove Senior Dev',
      siteIntro: {
        title: 'System Architecture',
        subtitle: 'Overview of the modules available in this digital space.',
        journalTitle: 'Public Journal',
        journalDesc: 'My personal transmission log. Sharing insights on technology, coding, and life experiences.',
        profileTitle: 'Captain\'s Profile',
        profileDesc: 'A dossier of my journey: Big tech experience, startups, and financial exploration.',
        chatTitle: 'Interstellar Chat',
        chatDesc: 'Real-time quantum link. Login required. Connect and chat with other voyagers in the system.',
        privateTitle: 'Private Sanctuary',
        privateDesc: 'Encrypted vault for my personal love story and memories. Strictly for the Captain\'s eyes (haha).'
      },
      education: 'Database: Education',
      educationSchool: 'Miami University',
      educationDegree: 'BA, Interactive Media Studies',
      skills: 'Tech Stack',
      experience: 'Mission History',
      basedIn: 'Orbiting Earth',
      gpa: "GPA: 3.7 • Dean's List",
      jobs: [
        {
          company: 'Gold Woodbath Capital',
          role: 'Founder / Investor',
          description: 'Founded a private equity firm focusing on tech and emerging markets. Managed portfolio strategies.',
          color: 'bg-amber-500'
        },
        {
          company: 'Lalamove',
          role: 'Senior Frontend Engineer',
          description: 'Optimized core logistics dispatch system. Enhanced driver and user app webviews.',
          color: 'bg-orange-500'
        },
        {
          company: 'Tencent Cloud',
          role: 'Frontend Developer',
          description: 'Spearheaded frontend development for the Coding OA platform. Implemented DevOps toolchains.',
          color: 'bg-blue-500'
        },
        {
          company: 'BeeHex',
          role: 'Frontend Engineer',
          description: 'Revolutionized food automation with 3D printing technology (NASA Spin-off).',
          color: 'bg-slate-500'
        }
      ]
    },
    comments: {
      title: 'Comms Channel',
      placeholder: 'Transmit a message...',
      postButton: 'Send Transmission',
      loginToComment: 'Authenticate to transmit',
      noComments: 'No transmissions received.',
      reply: 'Respond',
      replyTo: 'Respond to',
      cancel: 'Abort',
      error: 'Transmission failed.'
    },
    chat: {
      title: 'Quantum Link',
      subtitle: 'Real-time encrypted subspace communication channel.',
      crewManifest: 'Crew Manifest',
      publicChannel: 'Public Channel',
      privateChannel: 'Private Channel',
      connecting: 'Establishing Uplink...',
      placeholder: 'Broadcast message...',
      typing: 'is transmitting...',
      send: 'Transmit',
      me: 'Me',
      welcome: 'Welcome to the Bridge',
      encrypted: 'Encrypted'
    },
    delete: {
      confirmTitle: 'Delete Log?',
      confirmMessage: 'This action is irreversible. To confirm deletion, please type:',
      confirmSecretMessage: 'Restricted Action. Enter Secret Key to authorize deletion:',
      button: 'Delete Log'
    },
    live: {
      title: 'Live Uplink',
      subtitle: 'Real-time neural interface active. Streaming audio/video data to Gemini Core.',
      connect: 'Initialize Link',
      disconnect: 'Terminate Link'
    },
    footer: {
      tagline: 'Refining the digital experience through code and design.',
      rights: '© 2024 Sam Yao. System Operational.',
      builtBy: 'Built with Pride, Love, and Peace by Sam Yao',
      strengthHonor: 'Strength and Honor'
    },
    privateSpace: {
      tabs: {
        journal: "Journal",
        leisure: "Leisure",
        gallery: "Gallery",
        fitness: "Fitness"
      },
      leisure: {
        musicTitle: "Sonic Player",
        playUrl: "Play URL",
        search: "Library",
        placeholderUrl: "MP3 URL...",
        placeholderSearch: "Search...",
        nowPlaying: "Playing",
        stopped: "Idle",
        mahjong: "Mahjong Soul Zone",
        mahjongDesc: "Access the Maj-Soul network.",
        clock: {
          title: "Smart Hub",
          subtitle: "Shenzhen Live"
        },
        pirate: {
          title: "The Four Pirate Lords",
          reset: "Reshuffle",
          moves: "Moves",
          victory: "CONQUERED",
          victoryDesc: "The seas are tamed.",
          playAgain: "Play Again",
          rulesTitle: "Mission Parameters",
          rules: [
            "Objective: Coordinate the 4 Factions (Red, Blue, Green, Yellow) to their home territories simultaneously.",
            "Home Territories: Red (Top-Left), Blue (Top-Right), Green (Bottom-Left), Yellow (Bottom-Right).",
            "Units: Each faction has 4 units (Captain, Ship, Treasure, Map). All 4 must be inside their specific 3x3 colored zone.",
            "Neutral Zone: The center column and empty spaces allow for movement.",
            "Difficulty: Hard. Requires look-ahead planning."
          ]
        }
      },
      fitness: {
        title: 'Fitness Space',
        subtitle: 'Track body & performance metrics.',
        tabs: {
          workout: 'Activity',
          status: 'Body & Mood',
          diet: 'Diet',
          photos: 'Photos'
        },
        workout: {
          isDone: 'Task Done?',
          duration: 'Duration (min)',
          type: 'Activities',
          notes: "Today's Highlights",
          types: {
            run: 'Running',
            swim: 'Swimming',
            lift: 'Lifting',
            yoga: 'Yoga',
            hiit: 'HIIT',
            trip: 'Trip',
            hike: 'Hiking',
            movie: 'Movie',
            love: 'Love',
            other: 'Other'
          }
        },
        status: {
          weight: 'Weight (kg)',
          sleep: 'Sleep (hours)',
          mood: 'Mood',
          moods: {
            happy: 'Happy',
            neutral: 'Neutral',
            bad: 'Bad'
          }
        },
        diet: {
          content: 'What did you eat?',
          contentPlaceholder: 'Breakfast: Bread, Milk...',
          water: 'Water Intake (ml)'
        },
        photos: {
          upload: 'Upload Daily Moments',
          empty: 'No photos today'
        },
        charts: {
          weightTitle: 'Weight Trend',
          duration: 'Duration',
          weight: 'Weight',
        },
        save: 'Save Record',
        saved: 'Record Updated'
      },
      journal: "Our Journal",
      memories: "MEMORIES",
      together: "Together",
      years: "Years",
      days: "Days",
      loveMsg: "Love You Forever! ❤",
      tasks: "Tasks",
      newTask: "New task...",
      caughtUp: "All caught up!",
      emptyJournal: "Your journal is empty.",
      writeFirst: "Write your first memory on the right.",
      read: "Read",
      preview: "No preview available...",
      unknownDate: "Unknown Date",
      editor: {
        titlePlaceholder: "Title...",
        author: "Author",
        tags: "Tags (space separated)",
        private: "Private",
        public: "Public",
        summary: "Summary (Info)",
        code: "Code / Script",
        publish: "Publish Story",
        update: "Update Story",
        cancel: "Cancel Edit",
        chars: "chars",
        tellStory: "Tell your story...",
        saving: "Saving...",
        saved: "Saved",
        saveDraft: "Save",
        processing: "Processing..."
      },
      gallery: {
        title: "Capsule Gallery",
        subtitle: "Frozen moments in time, connected by light.",
        upload: "Upload Photo",
        caption: "Caption",
        location: "Location",
        save: "Pin to Board",
        cancel: "Discard",
        replace: "Replace",
        delete: "Delete",
        deleteConfirm: "Remove Photo?",
        pinTitle: "Pin New Memory",
        captionLabel: "Caption",
        captionPlaceholder: "Give it a name...",
        dateLabel: "Date",
        pinButton: "Pin It",
        developing: "Developing photos...",
        reserved: "Reserved"
      }
    }
  },
  zh: {
    header: {
      home: '主控台',
      blog: '日志',
      about: '档案',
      privateSpace: '私域',
      chat: '星际通讯',
      signOut: '断开',
      signIn: '接入',
      profile: '个人中心',
      settings: '系统设置',
      audit: '系统审计',
      notifications: '警报',
      clearAll: '清除',
      emptyNotifications: '无新警报'
    },
    hero: {
      status: '系统在线',
      title1: '探索',
      title2: '未知',
      introPrefix: '我是 ',
      introName: 'Sam',
      introSuffix: '。漫游在数字宇宙，构建稳健的架构，探索人工智能的疆界。',
      ctaPrimary: '查阅日志',
      ctaSecondary: '系统档案'
    },
    blogList: {
      title: '传输日志',
      subtitle: '关于工程、星图和数字演进的记录。',
      titlePrivate: '加密库',
      subtitlePrivate: '机密文档与个人记录。',
      viewAll: '查看所有',
      readArticle: '访问数据',
      systemLog: '系统日志 // 公开访问',
      entries: '条目',
      status: '状态',
      online: '在线',
      searchPlaceholder: '搜索日志关键词...',
      filter: '筛选:',
      all: '全部',
      noLogs: '未找到相关日志',
      adjustSearch: '请调整搜索关键词',
      clearFilters: '清除筛选',
      page: '页码'
    },
    auditLog: {
      title: '系统活动日志',
      subtitle: '追踪主机内所有操作指令。',
      operator: '操作员',
      action: '指令',
      target: '目标对象',
      time: '时间戳',
      ip: '源 IP',
      noData: '当前扇区无活动记录。'
    },
    pagination: {
      prev: '上一扇区',
      next: '下一扇区',
      page: '扇区'
    },
    login: {
      welcome: '身份验证',
      welcomeRegister: '新实体注册',
      welcomeReset: '重置权限',
      subtitle: '验证身份以访问加密区域',
      subtitleRegister: '注册以获取权限',
      subtitleReset: '使用秘密协议恢复访问',
      name: '代号',
      email: '通讯链路',
      password: '密钥',
      newPassword: '新密钥',
      secretKey: '秘密协议口令',
      confirmPassword: '确认密钥',
      signin: '验证',
      register: '初始化',
      reset: '恢复访问',
      toRegister: '无权限？初始化',
      toLogin: '已有权限？验证',
      forgotPassword: '丢失密钥？',
      backToLogin: '返回验证',
      error: '验证失败。访问被拒绝。',
      passwordMismatch: '两次输入的密钥不一致。'
    },
    profile: {
      title: '个人中心',
      subtitle: '管理您的身份与权限详情。',
      displayName: '显示名称',
      email: '注册邮箱',
      uid: '实体 ID',
      save: '更新身份',
      developing: '模块开发中...',
      security: '安全协议',
      changePassword: '变更访问密钥',
      oldPassword: '当前密钥',
      newPassword: '新密钥',
      admin: '管理控制台',
      grantVip: '授予 VIP 权限',
      targetEmail: '目标实体邮箱',
      dataManagement: '数据管理',
      exportLogs: '一键导出日志',
      active: '活跃',
      vipBadge: 'VIP',
      downloadBackup: '下载所有个人日志的 JSON 备份。'
    },
    settings: {
      title: '系统配置',
      subtitle: '调整界面参数与本地化协议。',
      theme: '视觉接口',
      language: '语言协议',
      light: '日间模式',
      dark: '夜间模式',
      en: 'English',
      zh: '中文'
    },
    resume: {
      role: '工程师 / 旅行者',
      bio: '专注于科技，投资与个人成长。',
      credentials: '前腾讯/货拉拉资深开发',
      siteIntro: {
        title: '站点导航',
        subtitle: '本数字空间主要模块功能概览。',
        journalTitle: '日志空间',
        journalDesc: '我分享个人日志的地方。记录技术心得、创业思考与生活点滴。',
        profileTitle: '档案室',
        profileDesc: '关于我的详细经历：大厂历练、创业搞钱之路。',
        chatTitle: '星际通讯',
        chatDesc: '登陆后即可接入聊天室，与其他探索者实时畅聊。',
        privateTitle: '私域模式',
        privateDesc: '加密的爱情档案库，用来保存属于我的珍贵回忆，仅供舰长本人查阅（哈哈）。'
      },
      education: '数据库：教育',
      educationSchool: '迈阿密大学 (Miami University)',
      educationDegree: '互动媒体研究学士 (STEM)',
      skills: '技术栈',
      experience: '任务记录',
      basedIn: '地球轨道',
      gpa: "GPA: 3.7 • 院长嘉许名单 (Dean's List)",
      jobs: [
        {
          company: 'Gold Woodbath Capital',
          role: '创始人 / 投资人',
          description: '创立专注于科技与新兴市场的私募股权公司。管理投资组合策略。',
          color: 'bg-amber-500'
        },
        {
          company: '货拉拉 (Lalamove)',
          role: '资深前端开发工程师',
          description: '优化核心物流调度系统。提升司机端与用户端 Webview 性能。',
          color: 'bg-orange-500'
        },
        {
          company: '腾讯云',
          role: '前端开发工程师',
          description: '负责 Coding OA 平台前端开发。实施 CI/CD 与自动化测试工具链。',
          color: 'bg-blue-500'
        },
        {
          company: 'BeeHex (NASA 衍生)',
          role: '前端工程师',
          description: '利用 3D 打印技术革新食品自动化。构建 Vue.js 定制平台。',
          color: 'bg-slate-500'
        }
      ]
    },
    comments: {
      title: '通讯频道',
      placeholder: '发送传输...',
      postButton: '发送',
      loginToComment: '验证身份以发送',
      noComments: '未收到传输信号。',
      reply: '响应',
      replyTo: '响应',
      cancel: '终止',
      error: '传输失败。'
    },
    chat: {
      title: '量子链路',
      subtitle: '实时加密的亚空间通讯频道。',
      crewManifest: '乘员名册',
      publicChannel: '公共频道',
      privateChannel: '私人频道',
      connecting: '正在建立上行链路...',
      placeholder: '广播消息...',
      typing: '正在传输...',
      send: '发送',
      me: '我',
      welcome: '欢迎来到舰桥',
      encrypted: '加密'
    },
    delete: {
      confirmTitle: '删除日志？',
      confirmMessage: '此操作不可逆。确认删除，请输入：',
      confirmSecretMessage: '受限操作。请输入密钥以授权删除：',
      button: '确认删除'
    },
    live: {
      title: '实时链路',
      subtitle: '实时神经接口已激活。正在向 Gemini 核心传输音视频数据。',
      connect: '初始化连接',
      disconnect: '终止连接'
    },
    footer: {
      tagline: '通过代码与设计重塑数字体验。',
      rights: '© 2024 Sam Yao. 系统运转正常。',
      builtBy: '由 Sam Yao 倾注荣耀、爱与和平构建',
      strengthHonor: '力量与荣耀'
    },
    privateSpace: {
      tabs: {
        journal: "日志空间",
        leisure: "休闲空间",
        gallery: "胶囊相册",
        fitness: "运动空间"
      },
      leisure: {
        musicTitle: "音乐播放器",
        playUrl: "播放链接",
        search: "搜索曲库",
        placeholderUrl: "MP3 URL...",
        placeholderSearch: "搜索...",
        nowPlaying: "正在播放",
        stopped: "已停止",
        mahjong: "雀魂麻将区",
        mahjongDesc: "接入 Maj-Soul 神经网络",
        clock: {
          title: "智能中枢",
          subtitle: "深圳实时"
        },
        pirate: {
          title: "四皇海战 (华容道)",
          reset: "重置牌局",
          moves: "步数",
          victory: "征服完成",
          victoryDesc: "四海已平定。",
          playAgain: "再战",
          rulesTitle: "任务参数",
          rules: [
            "目标: 将红、蓝、绿、黄四个阵营的滑块同时移动到对应的领地。",
            "领地分布: 红(左上), 蓝(右上), 绿(左下), 黄(右下)。",
            "单位: 每个阵营包含4个单位（船长、船、宝箱、地图）。所有单位必须位于其3x3的领地内。",
            "中立区: 中间列及空位允许通行。",
            "难度: 困难。需要极强的预判能力。"
          ]
        }
      },
      fitness: {
        title: '运动空间',
        subtitle: '追踪您的生理机能与训练数据。',
        tabs: {
          workout: '活动记录',
          status: '身体 & 状态',
          diet: '饮食',
          photos: '照片'
        },
        workout: {
          isDone: '今日打卡?',
          duration: '时长 (分钟)',
          type: '活动类型',
          notes: '今日流水账/高光',
          types: {
            run: '跑步',
            swim: '游泳',
            lift: '举铁',
            yoga: '瑜伽',
            hiit: 'HIIT',
            trip: '出游',
            hike: '爬山',
            movie: '电影',
            love: '爱爱',
            other: '其他'
          }
        },
        status: {
          weight: '体重 (kg)',
          sleep: '睡眠 (小时)',
          mood: '今日心情',
          moods: {
            happy: '开心',
            neutral: '一般',
            bad: '难受'
          }
        },
        diet: {
          content: '今天吃了什么？',
          contentPlaceholder: '早餐：面包，牛奶...',
          water: '喝水 (ml)'
        },
        photos: {
          upload: '上传今日瞬间',
          empty: '今日暂无照片'
        },
        charts: {
          weightTitle: '体重趋势',
          duration: '时长',
          weight: '体重',
        },
        save: '保存记录',
        saved: '记录已更新'
      },
      journal: "我们的日志",
      memories: "篇回忆",
      together: "在一起",
      years: "年",
      days: "天",
      loveMsg: "永远爱你! ❤",
      tasks: "待办事项",
      newTask: "新任务...",
      caughtUp: "全部完成了！",
      emptyJournal: "日志是空的。",
      writeFirst: "在右侧写下第一篇回忆吧。",
      read: "阅读",
      preview: "暂无简介...",
      unknownDate: "未知日期",
      editor: {
        titlePlaceholder: "标题...",
        author: "作者",
        tags: "标签 (空格分隔)",
        private: "私密",
        public: "公开",
        summary: "简介",
        code: "代码 / 脚本",
        publish: "发布故事",
        update: "更新故事",
        cancel: "取消编辑",
        chars: "字数",
        tellStory: "写下你的故事...",
        saving: "保存中...",
        saved: "已保存",
        saveDraft: "保存草稿",
        processing: "处理中..."
      },
      gallery: {
        title: "胶囊相册",
        subtitle: "被光连接的永恒瞬间。",
        upload: "上传照片",
        caption: "备注",
        location: "地点",
        save: "固定到板上",
        cancel: "丢弃",
        replace: "替换图片",
        delete: "删除",
        deleteConfirm: "移除照片?",
        pinTitle: "记录新回忆",
        captionLabel: "标题",
        captionPlaceholder: "给它起个名字...",
        dateLabel: "日期",
        pinButton: "固定",
        developing: "正在冲洗照片...",
        reserved: "预留位"
      }
    }
  }
};