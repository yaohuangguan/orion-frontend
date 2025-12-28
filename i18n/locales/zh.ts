export const zh = {
  header: {
    home: '首页',
    blog: '日志',
    about: '关于',
    privateSpace: '舰长室',
    chat: '通讯链路',
    signOut: '登出',
    signIn: '登入',
    profile: '个人中心',
    settings: '系统设置',
    audit: '系统审计',
    notifications: '通知',
    clearAll: '清除全部',
    emptyNotifications: '暂无新通知',
    footprint: '星图足迹',
    system: '系统管理'
  },
  pwa: {
    title: 'Orion',
    desc: '安装到主屏幕以获得更好的体验',
    install: '安装',
    ios: "点击分享 <i class='fas fa-share-square'></i> 然后选择 <b>'添加到主屏幕'</b>"
  },
  bottomNav: {
    home: '首页',
    archives: '归档',
    cabin: '座舱',
    me: '我'
  },
  hero: {
    status: '系统在线',
    title1: '探索',
    title2: '未知领域',
    introPrefix: '我是 ',
    introName: 'Sam',
    introSuffix: '。航行于数字宇宙，构建稳健架构，探索人工智能的疆界。',
    ctaPrimary: '查阅日志',
    ctaSecondary: '系统档案'
  },
  portfolio: {
    title: '作品集',
    subtitle: '工程项目与职业生涯记录。',
    resume: '简历',
    projects: '项目',
    liveDemo: '在线演示',
    sourceCode: '源代码',
    demoOptions: {
      title: '选择预览模式',
      local: '在此预览',
      newTab: '新标签页',
      iframeTitle: '实时预览'
    }
  },
  blogList: {
    title: '日志与洞察',
    subtitle: '关于技术、投资与个人成长的思考。',
    titlePrivate: '加密金库',
    subtitlePrivate: '机密文档与个人日志。',
    viewAll: '查看所有日志',
    readArticle: '读取数据',
    systemLog: '系统日志 // 公开访问',
    entries: '条目',
    status: '状态',
    online: '在线',
    searchPlaceholder: '搜索日志关键词...',
    filter: '筛选:',
    all: '全部',
    noLogs: '未找到日志',
    adjustSearch: '请调整搜索参数',
    clearFilters: '清除筛选',
    page: '页码'
  },
  auditLog: {
    title: '系统活动日志',
    subtitle: '追踪主机内的所有操作指令。',
    operator: '操作员',
    action: '指令',
    target: '目标对象',
    time: '时间戳',
    ip: '来源IP',
    noData: '当前扇区无活动记录。'
  },
  pagination: {
    prev: '上一扇区',
    next: '下一扇区',
    page: '扇区'
  },
  login: {
    welcome: '身份识别',
    welcomeRegister: '新实体',
    welcomeReset: '重置访问',
    subtitle: '验证身份以访问受限扇区',
    subtitleRegister: '注册以获取权限',
    subtitleReset: '使用机密协议恢复访问',
    name: '代号',
    email: '通讯链路',
    emailOrPhone: '邮箱或电话',
    phone: '电话号码',
    phoneError: '格式无效',
    password: '访问密钥',
    newPassword: '新密钥',
    secretKey: '机密协议密钥',
    confirmPassword: '确认密钥',
    signin: '验证',
    register: '初始化',
    reset: '恢复',
    toRegister: '无权限？初始化',
    toLogin: '已授权？验证',
    forgotPassword: '丢失访问密钥？',
    backToLogin: '返回验证',
    error: '验证失败。访问被拒绝。',
    passwordMismatch: '访问密钥不匹配。'
  },
  profile: {
    title: '个人中心',
    subtitle: '管理您的身份与权限详情。',
    displayName: '显示名称',
    email: '注册邮箱',
    phone: '电话号码',
    uid: '实体ID',
    save: '更新身份',
    developing: '模块开发中...',
    security: '安全协议',
    changePassword: '更改访问密钥',
    oldPassword: '当前密钥',
    newPassword: '新密钥',
    admin: '管理控制台',
    grantVip: '授予VIP权限',
    targetEmail: '目标实体邮箱',
    dataManagement: '数据管理',
    exportLogs: '导出日志',
    active: '活跃',
    vipBadge: 'VIP',
    downloadBackup: '下载所有个人日志的JSON备份。',
    height: '身高 (cm)',
    fitnessGoal: '健身目标',
    barkUrl: 'Bark URL (推送)',
    barkUrlPlaceholder: 'https://api.day.app/your-key/...',
    timezone: '时区',
    goals: {
      cut: '减脂 (Cut)',
      bulk: '增肌 (Bulk)',
      maintain: '保持'
    },
    role: '角色权限',
    updateRole: '更新角色',
    roles: {
      user: '用户',
      admin: '管理员',
      super_admin: '超级管理员',
      bot: '机器人 (不可变)'
    },
    accessControl: '访问与权限',
    requestPermissionTitle: '申请权限',
    permissionKey: '权限键值',
    applyAdmin: '申请管理员角色',
    customRequest: '自定义权限申请',
    reasonLabel: '申请理由',
    reasonPlaceholder: '请描述为何需要此权限...',
    submitRequest: '提交申请'
  },
  settings: {
    title: '系统配置',
    subtitle: '调整界面参数与本地化设置。',
    theme: '视觉界面',
    language: '语言协议',
    light: '日间模式',
    dark: '夜间模式',
    en: '英语',
    zh: '中文'
  },
  system: {
    title: '系统管理',
    subtitle: '监控系统资源与外部服务的仪表盘。',
    tabs: {
      resources: '资源',
      users: '用户',
      roles: '角色',
      permissions: '权限',
      requests: '请求'
    },
    cloudinary: {
      title: 'Cloudinary 图片库',
      credits: '已用额度',
      plan: '当前计划',
      storage: '存储',
      bandwidth: '带宽',
      objects: '对象数',
      transformations: '转换数',
      resources: '总资源',
      lastUpdated: '最后更新'
    },
    r2: {
      title: 'Cloudflare R2 存储',
      tab_storage: '存储 (R2)',
      tab_cloudinary: '媒体 (Cloudinary)',
      plan: '免费层状态',
      planDesc: '使用 Cloudflare R2 对象存储。无流量费。',
      storageUsage: 'A类操作',
      estCost: '预估成本',
      overage: '超额',
      freeTier: '免费层',
      images: '图片',
      backups: '备份',
      others: '其他',
      totalObjects: '总对象数',
      allBuckets: '跨所有存储桶',
      distribution: '存储分布',
      empty: '此存储桶/前缀下无文件。',
      loadMore: '加载更多文件',
      upload: '上传文件',
      deleteTitle: '删除文件？',
      deleteMsg: '确定要从 {storage} 永久删除此文件吗？',
      deleteSuccess: '文件已成功删除。',
      home: '根目录',
      folders: '文件夹'
    },
    backup: {
      terminalTitle: '数据库备份终端',
      processing: '处理中...',
      init: '> 初始化备份序列...',
      reqDump: '> 请求服务器 mongodump 流...',
      success: '> 备份流完成。文件已下载。',
      terminated: '> 进程终止。',
      viewFiles: '查看备份',
      wait: '请稍候...'
    },
    common: {
      loading: '加载中...',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      actions: '操作',
      update: '更新'
    },
    requests: {
      title: '访问请求',
      pending: '待处理',
      approve: '批准',
      reject: '拒绝',
      noPending: '无待处理请求。',
      permission: '申请权限',
      reason: '理由'
    },
    roles: {
      title: '角色管理',
      add: '添加角色',
      edit: '编辑角色',
      name: '角色名称',
      desc: '描述',
      perms: '权限列表',
      save: '保存角色',
      delete: '删除角色'
    },
    permissions: {
      title: '权限注册表',
      add: '添加权限',
      edit: '编辑权限',
      key: '键值',
      name: '名称',
      category: '分类',
      desc: '描述',
      save: '保存权限',
      delete: '删除权限'
    },
    users: {
      search: '搜索用户...',
      vipStatus: 'VIP 状态',
      active: '已激活',
      inactive: '未激活',
      grant: '授予 VIP',
      revoke: '撤销 VIP',
      verifyTitle: '验证授权',
      verifyMsg: '请输入密钥以确认此操作。',
      verifyBtn: '验证',
      role: '角色',
      directPerms: '直接权限',
      botError: '无法修改机器人账户。'
    }
  },
  access: {
    denied: '访问拒绝',
    restricted: '受限区域',
    message: '您没有访问此扇区所需的安全许可。',
    request: '申请访问',
    requestTitle: '提交访问申请',
    reasonPlaceholder: '为何需要访问此扇区？',
    submit: '提交申请',
    cancel: '取消',
    pending: '访问申请审核中'
  },
  footprint: {
    title: '星图',
    subtitle: '追踪穿越星系的足迹。',
    intro: '点亮你探索过的省份，将记忆钉在星球网格上。',
    tabs: {
      china: '中国扇区',
      world: '全球标记'
    },
    stats: {
      total: '足迹总数',
      countries: '访问国家',
      provinces: '点亮省份',
      cities: '抵达城市'
    },
    add: '添加足迹',
    edit: '编辑足迹',
    form: {
      name: '地点名称',
      province: '省份 / 地区',
      city: '城市',
      date: '访问日期',
      mood: '心情',
      content: '记忆 / 笔记',
      photos: '照片',
      status: '状态',
      visited: '已访问',
      planned: '计划中',
      save: '保存足迹'
    },
    mapTip: '点击地图设置坐标'
  },
  resume: {
    role: '工程师 / 旅行者',
    bio: '专注于技术、投资与个人成长。',
    credentials: '前腾讯 & Lalamove 高级开发',
    siteIntro: {
      title: '系统架构',
      subtitle: '此数字空间可用模块概览。',
      journalTitle: '公开日志',
      journalDesc: '我的个人传输日志。分享关于技术、代码和生活经历的见解。',
      profileTitle: '舰长档案',
      profileDesc: '我的旅程档案：大厂经历、创业历程和金融探索。',
      chatTitle: '星际通讯',
      chatDesc: '实时量子链路。需登录。连接并与系统中的其他旅行者聊天。',
      privateTitle: '舰长室',
      privateDesc: '加密金库，存放我的爱情故事和私人记忆。仅限舰长阅览（哈哈）。'
    },
    websiteIntro: {
      title: '网站规格说明',
      description:
        '本平台采用微前端架构构建，使用 React 18、TypeScript 和 Tailwind CSS。拥有自定义组件库和稳健的后端服务。',
      viewSpecs: '查看系统规格',
      modalTitle: '系统规格',
      sections: {
        public: {
          title: '公共扇区',
          desc: '所有访客可访问。',
          features: [
            '<b>博客引擎：</b> Markdown 渲染、代码高亮。',
            '<b>作品集：</b> 交互式项目展示。',
            '<b>性能：</b> SSR 与静态生成。'
          ]
        },
        private: {
          title: '私人扇区',
          desc: '加密的个人空间。',
          features: [
            '<b>日记：</b> 带自动保存的富文本编辑器。',
            '<b>健身追踪：</b> 图表与日历可视化。',
            '<b>财务：</b> 资产追踪（隐藏）。'
          ]
        },
        admin: {
          title: '指挥中心',
          desc: '系统管理。',
          features: [
            '<b>用户管理：</b> RBAC 与权限控制。',
            '<b>系统资源：</b> R2 与 Cloudinary 监控。',
            '<b>审计日志：</b> 安全追踪。'
          ]
        },
        stack: {
          title: '技术栈',
          list: [
            'React 18',
            'TypeScript',
            'Tailwind CSS',
            'Node.js',
            'MongoDB',
            'Redis',
            'Cloudflare R2'
          ]
        }
      }
    },
    orion: {
      etymology1: '(法语：金)',
      etymology2: '(猎户座)',
      description: '夜空中最亮的星座。指引你在数字宇宙中发现自我价值的导航星。',
      slogan: '导航你的价值'
    },
    education: '数据库：教育',
    educationSchool: '迈阿密大学 (Miami University)',
    educationDegree: 'BA, 交互媒体研究 (STEM)',
    skills: '技术栈',
    experience: '任务历史',
    basedIn: '地球轨道',
    gpa: "GPA: 3.7 • 院长名单 (Dean's List)",
    jobs: [
      {
        company: 'Gold Woodbath Capital',
        role: '创始人 / 投资人',
        description: '创立专注于技术和新兴市场的私募股权公司。管理投资组合策略。',
        color: 'bg-amber-500'
      },
      {
        company: 'Lalamove',
        role: '高级前端工程师',
        description: '优化核心物流调度系统。增强司机端和用户端应用的 Webview 体验。',
        color: 'bg-orange-500'
      },
      {
        company: '腾讯云',
        role: '前端开发工程师',
        description: '主导 Coding OA 平台的前端开发。实施 DevOps 工具链。',
        color: 'bg-blue-500'
      },
      {
        company: 'BeeHex (NASA 衍生公司)',
        role: '前端工程师',
        description: '利用 3D 打印技术革新食品自动化。构建 Vue.js 定制平台。',
        color: 'bg-slate-500'
      }
    ]
  },
  comments: {
    title: '通讯频道',
    placeholder: '传输讯息...',
    postButton: '发送传输',
    loginToComment: '验证身份以传输',
    noComments: '未收到传输信号。',
    reply: '回复',
    replyTo: '回复给',
    cancel: '中止',
    error: '传输失败。'
  },
  chat: {
    title: '量子链路',
    subtitle: '加密实时亚空间通讯频道。',
    crewManifest: '船员名册',
    publicChannel: '公共频道',
    privateChannel: '私人频道',
    connecting: '建立上行链路...',
    placeholder: '广播消息...',
    typing: '正在传输...',
    send: '传输',
    me: '我',
    welcome: '欢迎来到舰桥',
    encrypted: '已加密'
  },
  delete: {
    confirmTitle: '删除日志？',
    confirmMessage: '此操作不可逆。确认删除请键入：',
    confirmSecretMessage: '受限操作。输入机密密钥以授权删除：',
    button: '删除日志'
  },
  live: {
    title: '实时上行',
    subtitle: '实时神经接口已激活。正在将音视频数据流传输至 Gemini 核心。',
    connect: '初始化链路',
    disconnect: '终止链路'
  },
  footer: {
    tagline: '通过代码与设计升华数字体验。',
    rights: '© 2024 Sam Yao. 系统运转正常。',
    builtBy: 'Sam Yao 用自豪、爱与和平构建',
    strengthHonor: '力量与荣耀'
  },
  privateSpace: {
    tabs: {
      secondBrain: '第二大脑',
      journal: '日志空间',
      leisure: '休闲空间',
      gallery: '照片墙',
      fitness: '运动空间'
    },
    secondBrain: {
      title: '数字孪生',
      subtitle: '全知 AI 核心',
      welcome: '你好。我是你的第二大脑。我可以访问你的日志、健身记录和项目数据。有什么可以帮你？',
      placeholder: '问我任何关于你数据的问题...'
    },
    hotSearch: {
      title: '资讯中心',
      hot: '热榜',
      finance: '财经',
      game: '游戏',
      guonei: '国内',
      world: '国际',
      updated: '已更新',
      loading: '扫描网络...'
    },
    leisure: {
      musicTitle: '声波播放器',
      playUrl: '播放 URL',
      search: '库',
      placeholderUrl: 'MP3 URL...',
      placeholderSearch: '搜索...',
      nowPlaying: '正在播放',
      stopped: '空闲',
      mahjong: '雀魂特区',
      mahjongDesc: '接入 Maj-Soul 网络。',
      drawingBoard: '绘图板',
      drawingDesc: '释放你的创造力。',
      clock: {
        title: '智能枢纽',
        subtitle: '深圳实况'
      },
      cycle: {
        title: '月相周期',
        subtitle: '生物追踪',
        prediction: '预测',
        nextPeriod: '下一次经期',
        inDays: '{days} 天后',
        log: '记录经期',
        save: '保存',
        flow: '流量',
        symptoms: '症状',
        note: '备注',
        delete: '删除',
        startDate: '开始日期',
        endDate: '结束日期',
        color: '颜色',
        flows: {
          light: '少量',
          medium: '中等',
          heavy: '大量'
        },
        symptomList: {
          cramps: '痛经',
          headache: '头痛',
          backpain: '背痛',
          fatigue: '疲劳',
          bloating: '腹胀',
          acne: '痤疮',
          moody: '情绪波动'
        },
        legend: {
          period: '经期',
          predicted: '预测',
          fertile: '易孕期',
          ovulation: '排卵日'
        }
      },
      chefWheel: {
        title: 'AI 智慧厨房',
        subtitle: '自动膳食决策系统',
        spin: '旋转',
        spinning: '分析中...',
        confirm: '确认选择',
        retry: '返回重试',
        recommending: 'Gemini 建议...',
        recommendations: '你可能也喜欢：',
        manage: '管理菜单',
        viewRecipe: '查看食谱',
        searchMode: '搜索食谱',
        wheelMode: '转盘模式',
        backToSearch: '返回搜索',
        searchPlaceholder: '搜索食谱 (如：宫保鸡丁)...',
        searching: '搜索中...',
        library: '库管理',
        smartPlan: {
          button: 'AI 智能计划',
          title: '智能计划',
          nutritionist: 'AI 营养师',
          personalized: '个性化菜单计划',
          target: '目标',
          fallbackTitle: '优先级逻辑 (回退)',
          fallback1: '如果你最近在健身模块记录了体重，AI 将优先使用最新记录。',
          fallback2:
            '如果你今天在饮食记录中明确设定了不同的目标（如‘增肌’），AI 将针对该目标进行推荐。',
          error: '营养师 AI 正忙。请稍后再试。'
        },
        form: {
          add: '添加菜品',
          edit: '编辑菜品',
          name: '菜名',
          image: '图片 URL',
          category: '类别',
          tags: '标签',
          cancel: '取消',
          save: '保存'
        },
        filters: {
          healthy: '健康模式',
          cooldown: '多样化模式',
          category: '类别',
          calories: '卡路里',
          tags: '标签',
          options: {
            any: '任意',
            lunch: '午餐',
            dinner: '晚餐',
            supper: '夜宵',
            low: '低卡',
            medium: '中等',
            high: '高卡'
          },
          tooltips: {
            healthy: '优先推荐低卡路里和均衡的膳食。',
            variety: '避免最近吃过的菜品。'
          }
        },
        menu: {
          add: '添加菜品',
          edit: '编辑菜品',
          name: '菜名',
          category: '类别',
          weight: '权重 (1-10)',
          calories: '卡路里等级',
          save: '保存菜品'
        },
        ingredients: {},
        styles: {},
        cats: {}
      },
      pirate: {
        title: '四大海盗领主',
        reset: '重置',
        moves: '步数',
        victory: '已征服',
        victoryDesc: '四海臣服。',
        playAgain: '再玩一次',
        rulesTitle: '任务参数',
        rules: [
          '目标：同时协调 4 个阵营（红、蓝、绿、黄）回到各自的领地。',
          '领地：红（左上），蓝（右上），绿（左下），黄（右下）。',
          '单位：每个阵营有 4 个单位（船长、船只、宝藏、地图）。所有 4 个单位必须位于其颜色的 3x3 区域内。',
          '中立区：中央列和空白处允许移动。',
          '难度：困难。需要提前规划。'
        ]
      }
    },
    fitness: {
      title: '健身空间',
      subtitle: '追踪身体与运动指标。',
      goals: {
        cut: '减脂',
        bulk: '增肌',
        maintain: '保持'
      },
      calendar: {
        weekdays: ['日', '一', '二', '三', '四', '五', '六'],
        holidays: {
          '1-1': '元旦',
          '2-14': '情人节',
          '3-8': '妇女节',
          '3-12': '植树节',
          '4-1': '愚人节',
          '5-1': '劳动节',
          '5-4': '青年节',
          '6-1': '儿童节',
          '7-1': '建党节',
          '8-1': '建军节',
          '9-10': '教师节',
          '10-1': '国庆节',
          '12-24': '平安夜',
          '12-25': '圣诞节'
        },
        terms: [
          '小寒',
          '大寒',
          '立春',
          '雨水',
          '惊蛰',
          '春分',
          '清明',
          '谷雨',
          '立夏',
          '小满',
          '芒种',
          '夏至',
          '小暑',
          '大暑',
          '立秋',
          '处暑',
          '白露',
          '秋分',
          '寒露',
          '霜降',
          '立冬',
          '小雪',
          '大雪',
          '冬至'
        ],
        noActivity: '无活动',
        summaryTitle: '每日活动摘要'
      },
      photoWall: {
        title: '健身画廊',
        captured: '本月拍摄 {n} 张照片',
        empty: '此时间段无照片',
        view: '查看当日照片',
        prev6: '前 6 月',
        next6: '后 6 月'
      },
      stats: {
        progress: '进度',
        userProgress: '{name} 的进度',
        activeProfile: '活跃档案',
        loading: '加载中...',
        loadMore: '加载更多',
        noData: '尚未收集数据'
      },
      input: {
        loggingFor: '记录对象：',
        selectUser: '选择用户'
      },
      tabs: {
        workout: '活动',
        status: '身体 & 心情',
        diet: '饮食',
        photos: '照片'
      },
      workout: {
        isDone: '任务完成？',
        duration: '时长 (分钟)',
        type: '活动类型',
        notes: '今日亮点',
        types: {
          run: '跑步',
          swim: '游泳',
          lift: '举铁',
          yoga: '瑜伽',
          hiit: 'HIIT',
          trip: '出行',
          hike: '徒步',
          movie: '观影',
          love: '恋爱',
          other: '其他'
        }
      },
      status: {
        weight: '体重 (kg)',
        height: '身高 (cm)',
        sleep: '睡眠 (小时)',
        mood: '心情',
        moods: {
          happy: '开心',
          neutral: '平淡',
          bad: '糟糕'
        }
      },
      diet: {
        content: '吃了什么？',
        contentPlaceholder: '早餐：面包，牛奶...',
        water: '饮水量 (ml)'
      },
      photos: {
        upload: '上传瞬间',
        empty: '今日无照片'
      },
      charts: {
        weightTitle: '体重趋势',
        duration: '时长',
        weight: '体重',
        bmi: 'BMI'
      },
      save: '保存记录',
      saved: '记录已更新'
    },
    journal: '我们的日志',
    memories: '回忆',
    together: '在一起',
    years: '年',
    days: '天',
    loveMsg: '永远爱你！ ❤',
    bucketList: {
      title: '愿望清单',
      subtitle: '梦想与目标',
      subtitleRoutine: '每日习惯',
      types: {
        wish: '心愿',
        routine: '例程'
      },
      tabs: {
        todo: '心愿',
        in_progress: '进行中',
        done: '已实现'
      },
      actions: {
        start: '开始',
        complete: '完成',
        later: '稍后',
        wishlist: '心愿单',
        restart: '重启'
      },
      add: '许愿',
      edit: '编辑心愿',
      placeholder: '你的梦想是什么？',
      description: '计划 / 指南 / 描述',
      targetDate: '目标日期',
      evidence: '证据 / 照片',
      uploadEvidence: '上传照片',
      empty: '暂无心愿。大胆做梦！',
      status: '当前状态',
      save: '保存心愿',
      update: '更新心愿',
      delete: '删除心愿',
      priority: {
        label: '优先级',
        active: '普通',
        timeSensitive: '紧急',
        passive: '被动',
        critical: '严重',
        desc: {
          active: '标准通知，点亮屏幕。',
          timeSensitive: '高优先级，突破勿扰模式。',
          passive: '静默通知，仅添加到列表。',
          critical: '最高警报，播放持续警报音。'
        }
      },
      sounds: {
        label: '通知音效',
        none: '无音效 (静音)',
        minuet: '小步舞曲',
        alarm: '警报',
        birdsong: '鸟鸣',
        glass: '玻璃',
        noir: '黑色电影',
        fanfare: '号角',
        ladder: '阶梯',
        bell: '钟声',
        electronic: '电子音',
        horn: '喇叭',
        anticipate: '期待',
        bloom: '绽放',
        calypso: '卡利普索',
        chime: '风铃',
        chao: '潮',
        descent: '下降',
        gotosleep: '该睡了',
        healthnotification: '健康提醒',
        mailsent: '邮件已发',
        multiwayinvitation: '多方邀请',
        newmail: '新邮件',
        newsflash: '快讯',
        paymentsuccess: '支付成功',
        shake: '摇晃',
        sherwoodforest: '舍伍德森林',
        silence: '静音',
        spell: '咒语',
        suspense: '悬疑',
        telegraph: '电报',
        tiptoes: '脚尖',
        typewriters: '打字机',
        update: '更新',
        desc: {
          minuet: '适合标准提醒。',
          alarm: '用于关键截止日期或叫醒服务。',
          birdsong: '轻松，适合休息提醒。',
          glass: '非常短促和微妙的提示音。',
          noir: '深沉神秘。',
          fanfare: '胜利之声。',
          ladder: '上升音调。',
          bell: '叮一声。',
          electronic: '数字哔哔声。',
          horn: '喇叭声。',
          anticipate: '短促提醒。',
          bloom: '柔和悦耳。',
          calypso: '欢快节奏。',
          chime: '清脆铃声。',
          chao: '快速节奏。',
          descent: '下降音调。',
          gotosleep: '柔和催眠。',
          healthnotification: '信息提示。',
          mailsent: '发送声。',
          multiwayinvitation: '叮咚。',
          newmail: '经典邮件声。',
          newsflash: '新闻警报。',
          paymentsuccess: '收银声。',
          shake: '震动声。',
          sherwoodforest: '森林号角。',
          silence: '静音。',
          spell: '魔法音效。',
          suspense: '戏剧性。',
          telegraph: '电报哔哔。',
          tiptoes: '悄悄话。',
          typewriters: '打字声。',
          update: '标准通知。'
        }
      },
      icons: {
        alarm: '闹钟',
        calendar: '日历',
        health: '健康',
        mail: '邮件',
        idea: '灵感',
        task: '任务',
        money: '财务',
        travel: '旅行',
        home: '家庭',
        game: '游戏',
        code: '编程',
        music: '音乐',
        server: '服务器',
        book: '阅读'
      },
      notify: {
        label: '通知用户',
        select: '选择用户...'
      },
      routine: {
        startTime: '开始时间',
        rule: '重复规则',
        nextRun: '下次运行',
        recurrenceOptions: {
          none: '一次性',
          m10: '每10分钟',
          m30: '每30分钟',
          h1: '每小时',
          workday9to18: '工作日 (9-18)',
          dailyMorning: '每天上午9点',
          daily12: '每天中午12点',
          daily18: '每天下午6点',
          mon8: '每周一上午8点',
          customDays: '自定义 (Cron)'
        },
        descriptions: {
          none: '在指定时间触发一次。',
          m10: '每10分钟重复一次。',
          m30: '每30分钟重复一次。',
          h1: '每小时重复一次。',
          workday9to18: '周一至周五，从09:00到18:00每小时。',
          daily8: '每天上午09:00。',
          daily12: '每天中午12:00。',
          daily18: '每天下午18:00。',
          mon8: '每周一早上8点。',
          custom: '使用高级 Cron 语法。'
        },
        config: {
          bark: 'Bark 通知配置',
          test: '测试推送',
          testing: '发送中...',
          icon: '图标 URL',
          url: '跳转 URL',
          urlPlaceholder: 'scheme:// 或 https://',
          image: '图片 URL',
          callMode: '连续响铃 (电话模式)'
        }
      },
      config: {
        bark: 'Bark 通知配置',
        test: '测试推送',
        testing: '发送中...',
        icon: '图标 URL',
        url: '跳转 URL',
        urlPlaceholder: 'scheme:// 或 https://',
        image: '图片 URL',
        callMode: '连续响铃 (电话模式)'
      }
    },
    tasks: '任务',
    newTask: '新任务...',
    caughtUp: '全部完成！',
    emptyJournal: '日志是空的。',
    writeFirst: '在右侧写下你的第一条回忆。',
    read: '阅读',
    preview: '无预览...',
    unknownDate: '未知日期',
    editor: {
      titlePlaceholder: '标题...',
      author: '作者',
      tags: '标签 (空格分隔)',
      private: '私密',
      public: '公开',
      summary: '摘要',
      code: '代码 / 脚本',
      publish: '发布条目',
      update: '更新条目',
      cancel: '取消编辑',
      chars: '字数',
      tellStory: '讲述你的故事...',
      saving: '保存中...',
      saved: '已保存',
      saveDraft: '保存草稿',
      processing: '处理中...'
    },
    gallery: {
      title: '胶囊画廊',
      subtitle: '由光影连接的永恒瞬间。',
      upload: '上传照片',
      caption: '标题',
      location: '地点',
      save: '钉住',
      cancel: '丢弃',
      replace: '替换图片',
      delete: '删除',
      deleteConfirm: '移除照片？',
      pinTitle: '记录回忆',
      captionLabel: '标题',
      captionPlaceholder: '命名这段回忆...',
      dateLabel: '日期',
      pinButton: '钉住',
      developing: '照片显影中...',
      reserved: '预留'
    },
    articleView: {
      back: '返回洞察',
      ctaTitle: '传输结束',
      ctaMessage: '与此信号共鸣？点赞增加频率，或向你的网络广播此链接。',
      like: '点赞',
      liked: '已赞',
      share: '分享链接',
      copied: '链接已复制'
    }
  }
};
