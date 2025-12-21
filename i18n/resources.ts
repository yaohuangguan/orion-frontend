
import { BlogPost } from "../types";

export const resources = {
  en: {
    header: {
      home: 'Home',
      blog: 'Journal',
      about: 'Profile',
      privateSpace: "Captain's Cabin",
      chat: 'Comm Link',
      signOut: 'Disconnect',
      signIn: 'Connect',
      profile: 'Personal Center',
      settings: 'System Settings',
      audit: 'System Audit',
      notifications: 'Alerts',
      clearAll: 'Clear All',
      emptyNotifications: 'No new alerts',
      footprint: 'Star Map',
      system: 'System Management'
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
    portfolio: {
      title: 'Portfolio',
      subtitle: 'A collection of engineering projects and professional history.',
      resume: 'Resume',
      projects: 'Projects'
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
      downloadBackup: 'Download a backup of all your personal logs in JSON format.',
      // New translations
      height: 'Height (cm)',
      fitnessGoal: 'Fitness Goal',
      barkUrl: 'Bark URL (Push)',
      barkUrlPlaceholder: 'https://api.day.app/your-key/...',
      timezone: 'Timezone',
      goals: {
        cut: 'Fat Loss (Cut)',
        bulk: 'Muscle Gain (Bulk)',
        maintain: 'Maintain'
      },
      role: 'Role Authority',
      updateRole: 'Update Role',
      roles: {
        user: 'User',
        admin: 'Admin',
        super_admin: 'Super Admin',
        bot: 'Bot (Immutable)'
      },
      accessControl: 'Access & Permissions',
      requestPermissionTitle: 'Request Permission',
      permissionKey: 'Permission Key',
      applyAdmin: 'Apply for Admin Role',
      customRequest: 'Custom Permission Request',
      reasonLabel: 'Reason for Request',
      reasonPlaceholder: 'Please describe why you need this permission...',
      submitRequest: 'Submit Request'
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
    system: {
      title: 'System Management',
      subtitle: 'Dashboard for monitoring system resources and external services.',
      cloudinary: {
        title: 'Cloudinary Image Library',
        credits: 'Credits Used',
        plan: 'Current Plan',
        storage: 'Storage',
        bandwidth: 'Bandwidth',
        objects: 'Objects',
        transformations: 'Transformations',
        resources: 'Total Resources',
        lastUpdated: 'Last Updated'
      },
      requests: {
        title: 'Access Requests',
        pending: 'Pending Review',
        approve: 'Approve',
        reject: 'Reject',
        noPending: 'No pending requests.',
        permission: 'Requested Permission',
        reason: 'Reason'
      }
    },
    access: {
      denied: 'Access Denied',
      restricted: 'Restricted Area',
      message: 'You do not have the required security clearance to access this sector.',
      request: 'Request Access',
      requestTitle: 'Submit Access Request',
      reasonPlaceholder: 'Why do you need access to this sector?',
      submit: 'Submit Request',
      cancel: 'Cancel',
      pending: 'Access Request Pending Approval'
    },
    footprint: {
      title: 'Star Map',
      subtitle: 'Tracking footprints across the galaxy.',
      intro: "Light up the provinces you've explored and pin your memories on the global grid.",
      tabs: {
        china: 'China Sector',
        world: 'Global Markers'
      },
      stats: {
        total: 'Total Footprints',
        countries: 'Countries Visited',
        provinces: 'Provinces Lit',
        cities: 'Cities Reached'
      },
      add: 'Add Footprint',
      edit: 'Edit Footprint',
      form: {
        name: 'Location Name',
        province: 'Province',
        city: 'City',
        date: 'Visit Date',
        mood: 'Mood',
        content: 'Memory / Note',
        photos: 'Photos',
        status: 'Status',
        visited: 'Visited',
        planned: 'Planned',
        save: 'Save Footprint'
      },
      mapTip: 'Click map to set coordinates'
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
        privateTitle: "Captain's Cabin",
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
        secondBrain: "Second Brain",
        journal: "Journal",
        leisure: "Leisure",
        gallery: "Gallery",
        fitness: "Fitness"
      },
      secondBrain: {
        title: "Digital Twin",
        subtitle: "Omniscient AI Core",
        welcome: "Hello. I am your Second Brain. I have access to your journal, fitness logs, and project data. How can I assist you?",
        placeholder: "Ask me anything about your data..."
      },
      hotSearch: {
        title: "News Center",
        hot: "Hot Trends",
        finance: "Finance",
        game: "Gaming",
        guonei: "Domestic",
        world: "World",
        updated: "Updated",
        loading: "Scanning network..."
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
        cycle: {
          title: "Moon Cycle",
          subtitle: "Bio-Tracker",
          prediction: "Prediction",
          nextPeriod: "Next Period",
          inDays: "in {days} days",
          log: "Log Period",
          save: "Save Log",
          flow: "Flow",
          symptoms: "Symptoms",
          note: "Note",
          delete: "Delete Record",
          // New I18n Keys
          startDate: "Start Date",
          endDate: "End Date",
          color: "Color",
          flows: {
            light: "Light",
            medium: "Medium",
            heavy: "Heavy"
          },
          symptomList: {
            cramps: "Cramps",
            headache: "Headache",
            backpain: "Back Pain",
            fatigue: "Fatigue",
            bloating: "Bloating",
            acne: "Acne",
            moody: "Moody"
          },
          legend: {
            period: "Period",
            predicted: "Predicted",
            fertile: "Fertile",
            ovulation: "Ovulation"
          }
        },
        chefWheel: {
          title: "AI Smart Kitchen",
          subtitle: "Automated Meal Selection System",
          spin: "START DRAW",
          spinning: "ANALYZING...",
          confirm: "Confirm Selection",
          retry: "Back & Retry",
          recommending: "Gemini is suggesting...",
          recommendations: "You might also like:",
          manage: "Manage Menu",
          viewRecipe: "View Recipe",
          searchMode: "Search Recipes",
          wheelMode: "Wheel Mode",
          backToSearch: "Back to Search",
          searchPlaceholder: "Search for a recipe (e.g. Kung Pao Chicken)...",
          searching: "Searching...",
          library: "Library Management",
          smartPlan: {
            button: "AI Smart Plan",
            title: "Smart Plan",
            nutritionist: "AI Nutritionist",
            personalized: "Personalized Menu Plan",
            target: "Target",
            fallbackTitle: "Priority Logic (Fallback)",
            fallback1: "If you logged your weight in Fitness recently, AI prioritizes the latest log.",
            fallback2: "If you explicitly set a different goal (e.g., 'Bulk') in your Fitness diet log today, AI recommends for that goal instead of your long-term User Profile goal.",
            error: "Nutritional AI is busy. Try again later."
          },
          form: {
            add: "Add Dish",
            edit: "Edit Dish",
            name: "Dish Name",
            image: "Image URL",
            category: "Category",
            tags: "Tags",
            cancel: "Cancel",
            save: "Save"
          },
          filters: {
            healthy: "Healthy Mode",
            cooldown: "Variety Mode", // Cooldown
            category: "Category",
            calories: "Calories",
            tags: "Tags",
            options: {
              any: "All",
              lunch: "Lunch",
              dinner: "Dinner",
              supper: "Supper",
              low: "Low Cal",
              medium: "Medium",
              high: "High Cal"
            },
            tooltips: {
              healthy: "Prioritizes low-calorie and balanced meals.",
              variety: "Avoids dishes eaten recently to ensure variety."
            }
          },
          // Legacy mappings maintained for type safety if needed, but UI uses new structure
          ingredients: {},
          styles: {},
          cats: {},
          menu: {
            add: "Add Dish",
            edit: "Edit Dish",
            name: "Dish Name",
            category: "Category",
            weight: "Priority (1-10)",
            calories: "Calorie Level",
            save: "Save Dish"
          }
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
        // 🔥 New: Fitness Goals
        goals: {
          cut: 'Fat Loss',
          bulk: 'Muscle Gain',
          maintain: 'Maintain'
        },
        calendar: {
          weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          holidays: {
            '1-1': 'New Year', '2-14': 'Valentine', '3-8': 'Women Day', '3-12': 'Arbor Day',
            '4-1': 'April Fools', '5-1': 'Labor Day', '5-4': 'Youth Day', '6-1': 'Children Day',
            '7-1': 'CCP Day', '8-1': 'Army Day', '9-10': 'Teacher Day', '10-1': 'National Day',
            '12-24': 'Xmas Eve', '12-25': 'Christmas'
          },
          terms: [
            "Minor Cold", "Major Cold", "Start of Spring", "Rain Water", "Awakening of Insects", "Spring Equinox", 
            "Pure Brightness", "Grain Rain", "Start of Summer", "Grain Buds", "Grain in Ear", "Summer Solstice",
            "Minor Heat", "Major Heat", "Start of Autumn", "End of Heat", "White Dew", "Autumn Equinox", 
            "Cold Dew", "Frost's Descent", "Start of Winter", "Minor Snow", "Major Snow", "Winter Solstice"
          ],
          noActivity: 'No activity',
          summaryTitle: 'Daily Activity Summary'
        },
        photoWall: {
          title: 'Fitness Gallery',
          captured: '{n} Photos Captured This Month',
          empty: 'No photos uploaded for this range',
          view: 'View Day Photos',
          prev6: 'Prev 6 Months',
          next6: 'Next 6 Months'
        },
        stats: {
          progress: 'Progress',
          userProgress: "{name}'s Progress",
          activeProfile: 'Active Profile',
          loading: 'Loading...',
          loadMore: 'Load More',
          noData: 'No data collected yet'
        },
        input: {
          loggingFor: 'Logging for:',
          selectUser: 'Select User'
        },
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
          height: 'Height (cm)', // New
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
          bmi: 'BMI'
        },
        save: 'Save Record',
        saved: 'Record Updated'
      },
      journal: "Our Journal",
      memories: "MEMORIES",
      together: "在一起",
      years: "年",
      days: "天",
      loveMsg: "永远爱你! ❤",
      bucketList: {
        title: "愿望清单",
        subtitle: "梦想与目标",
        tabs: {
          todo: "心愿单",
          in_progress: "进行中",
          done: "已达成"
        },
        actions: {
            start: "开始",
            complete: "完成",
            later: "稍后",
            wishlist: "心愿单",
            restart: "重开"
        },
        add: "许下愿望",
        edit: "编辑愿望",
        placeholder: "你的梦想是什么？",
        description: "计划 / 攻略 / 描述",
        targetDate: "目标日期",
        evidence: "打卡 / 证据",
        uploadEvidence: "上传照片",
        empty: "这里还没有愿望。大胆做梦吧！",
        status: "当前状态",
        save: "保存愿望",
        update: "更新愿望",
        delete: "删除愿望"
      },
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
  },
  zh: {
    header: {
      home: '主控台',
      blog: '日志',
      about: '档案',
      privateSpace: '舰长室',
      chat: '星际通讯',
      signOut: '断开',
      signIn: '接入',
      profile: '个人中心',
      settings: '系统设置',
      audit: '系统审计',
      notifications: '警报',
      clearAll: '清除',
      emptyNotifications: '无新警报',
      footprint: '星图',
      system: '系统管理'
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
    portfolio: {
      title: '作品集',
      subtitle: '工程项目与职业生涯的合集。',
      resume: '简历',
      projects: '项目'
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
      downloadBackup: '下载所有个人日志的 JSON 备份。',
      // New translations
      height: '身高 (cm)',
      fitnessGoal: '健身目标',
      barkUrl: 'Bark 推送链接',
      barkUrlPlaceholder: 'https://api.day.app/你的Key/...',
      timezone: '时区设置',
      goals: {
        cut: '减脂 (Cut)',
        bulk: '增肌 (Bulk)',
        maintain: '保持 (Maintain)'
      },
      role: '角色权限',
      updateRole: '更新角色',
      roles: {
        user: '普通用户',
        admin: '管理员',
        super_admin: '超级管理员',
        bot: '机器人 (不可变)'
      },
      accessControl: '访问与权限',
      requestPermissionTitle: '申请权限',
      permissionKey: '权限代码',
      applyAdmin: '申请管理员角色',
      customRequest: '自定义权限申请',
      reasonLabel: '申请理由',
      reasonPlaceholder: '请说明申请该权限的具体原因...',
      submitRequest: '提交申请'
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
    system: {
      title: '系统管理',
      subtitle: '系统资源和外部服务监控仪表盘。',
      cloudinary: {
        title: 'Cloudinary 图片库',
        credits: '信用点数使用',
        plan: '当前方案',
        storage: '存储空间',
        bandwidth: '带宽',
        objects: '对象数量',
        transformations: '图像转换',
        resources: '资源总数',
        lastUpdated: '最后更新'
      },
      requests: {
        title: '权限申请',
        pending: '待审核',
        approve: '批准',
        reject: '拒绝',
        noPending: '无待处理申请',
        permission: '申请权限',
        reason: '理由'
      }
    },
    access: {
      denied: '访问被拒绝',
      restricted: '受限区域',
      message: '您没有足够的安全许可进入该扇区。',
      request: '申请访问',
      requestTitle: '提交访问申请',
      reasonPlaceholder: '请说明您需要访问该扇区的理由...',
      submit: '提交申请',
      cancel: '取消',
      pending: '申请审核中'
    },
    footprint: {
      title: '星图计划',
      subtitle: '追踪跨越星系的足迹。',
      intro: '点亮你探索过的省份，在全球坐标上钉住你的独家记忆。',
      tabs: {
        china: '中国扇区',
        world: '全球坐标'
      },
      stats: {
        total: '足迹总数',
        countries: '探索国家',
        provinces: '点亮省份',
        cities: '抵达城市'
      },
      add: '记录足迹',
      edit: '编辑足迹',
      form: {
        name: '地点名称',
        province: '省份 / 区域',
        city: '城市',
        date: '抵达日期',
        mood: '心情指数',
        content: '探索笔记',
        photos: '影像记录',
        status: '状态',
        visited: '已抵达',
        planned: '计划中',
        save: '保存记录'
      },
      mapTip: '点击地图选取坐标'
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
        privateTitle: '舰长室',
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
        secondBrain: "第二大脑",
        journal: "日志空间",
        leisure: "休闲空间",
        gallery: "胶囊相册",
        fitness: "运动空间"
      },
      secondBrain: {
        title: "数字孪生",
        subtitle: "全知 AI 核心",
        welcome: "你好。我是你的第二大脑。我已经接入了你的日志、运动数据和项目记录。请问有什么可以帮你？",
        placeholder: "问我关于你数据的任何事..."
      },
      hotSearch: {
        title: "资讯中心",
        hot: "热搜榜",
        finance: "财经快讯",
        game: "游戏电竞",
        guonei: "国内新闻",
        world: "国际新闻",
        updated: "已更新",
        loading: "正在扫描网络..."
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
        cycle: {
          title: "月相周期",
          subtitle: "生理记录",
          prediction: "周期预测",
          nextPeriod: "下次经期",
          inDays: "{days} 天后",
          log: "记录经期",
          save: "保存记录",
          flow: "流量",
          symptoms: "症状",
          note: "备注",
          delete: "删除记录",
          // New I18n Keys
          startDate: "开始日期",
          endDate: "结束日期",
          color: "经血颜色",
          flows: {
            light: "少量",
            medium: "中等",
            heavy: "大量"
          },
          symptomList: {
            cramps: "痛经",
            headache: "头痛",
            backpain: "腰酸",
            fatigue: "疲乏",
            bloating: "腹胀",
            acne: "痘痘",
            moody: "情绪波动"
          },
          legend: {
            period: "经期",
            predicted: "预测经期",
            fertile: "易孕期",
            ovulation: "排卵日"
          }
        },
        chefWheel: {
          title: "AI 智能厨房",
          subtitle: "全自动膳食决策系统",
          spin: "开始抽取",
          spinning: "分析中...",
          confirm: "确认选择",
          retry: "返回重抽",
          recommending: "Gemini 思考建议中...",
          recommendations: "你可能也喜欢:",
          manage: "管理菜单",
          viewRecipe: "查看做法",
          searchMode: "菜谱搜寻",
          wheelMode: "大转盘",
          backToSearch: "返回搜索",
          searchPlaceholder: "输入菜名 (例如: 宫保鸡丁)...",
          searching: "搜索中...",
          library: "菜单库管理",
          smartPlan: {
            button: "AI 智能膳食",
            title: "智能方案",
            nutritionist: "AI 营养师",
            personalized: "个性化菜单定制",
            target: "目标",
            fallbackTitle: "优先级逻辑 (Fallback)",
            fallback1: "AI 优先参考您最近在「运动空间」记录的体重数据。",
            fallback2: "如果您今日在饮食记录中明确设置了临时目标（如“增肌”），AI 将优先基于该目标推荐，而非个人档案中的长期目标。",
            error: "营养师 AI 正忙，请稍后再试。"
          },
          form: {
            add: "新增菜品",
            edit: "编辑菜品",
            name: "菜名",
            image: "图片链接",
            category: "分类",
            tags: "标签",
            cancel: "取消",
            save: "保存"
          },
          filters: {
            healthy: "健康模式",
            cooldown: "多样化模式", // Cooldown
            category: "分类",
            calories: "热量",
            tags: "标签",
            options: {
              any: "任意",
              lunch: "午餐",
              dinner: "晚餐",
              supper: "夜宵",
              low: "低热量",
              medium: "中等",
              high: "高热量"
            },
            tooltips: {
              healthy: "优先选择低热量且营养均衡的餐食。",
              variety: "避开最近吃过的菜品（冷却期生效）。"
            }
          },
          menu: {
            add: "新增菜品",
            edit: "编辑菜品",
            name: "菜名",
            category: "分类",
            weight: "权重 (1-10)",
            calories: "热量等级",
            save: "保存菜品"
          },
          ingredients: {},
          styles: {},
          cats: {}
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
        // 🔥 New: Fitness Goals
        goals: {
          cut: '减脂',
          bulk: '增肌',
          maintain: '保持'
        },
        calendar: {
          weekdays: ['日', '一', '二', '三', '四', '五', '六'],
          holidays: {
            '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节',
            '4-1': '愚人节', '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节',
            '7-1': '建党节', '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节',
            '12-24': '平安夜', '12-25': '圣诞节'
          },
          terms: [
            "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
            "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
          ],
          noActivity: '无记录',
          summaryTitle: '每日运动摘要'
        },
        photoWall: {
          title: '运动光影墙',
          captured: '本月拍摄 {n} 张',
          empty: '该时段暂无照片',
          view: '查看当日照片',
          prev6: '前半年',
          next6: '后半年'
        },
        stats: {
          progress: '进度',
          userProgress: "{name} 的进度",
          activeProfile: '当前用户',
          loading: '加载中...',
          loadMore: '加载更多',
          noData: '暂无数据'
        },
        input: {
          loggingFor: '记录对象:',
          selectUser: '选择用户'
        },
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
          height: '身高 (cm)', // New
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
          bmi: 'BMI指数'
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
      bucketList: {
        title: "愿望清单",
        subtitle: "梦想与目标",
        tabs: {
          todo: "心愿单",
          in_progress: "进行中",
          done: "已达成"
        },
        actions: {
            start: "开始",
            complete: "完成",
            later: "稍后",
            wishlist: "心愿单",
            restart: "重开"
        },
        add: "许下愿望",
        edit: "编辑愿望",
        placeholder: "你的梦想是什么？",
        description: "计划 / 攻略 / 描述",
        targetDate: "目标日期",
        evidence: "打卡 / 证据",
        uploadEvidence: "上传照片",
        empty: "这里还没有愿望。大胆做梦吧！",
        status: "当前状态",
        save: "保存愿望",
        update: "更新愿望",
        delete: "删除愿望"
      },
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
