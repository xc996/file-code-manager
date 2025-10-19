# 📁 项目结构说明

## 文件树

```
file-codes-manager/
│
├── 📄 index.html              # 前端主页面（单页应用）
│   ├── 登录界面
│   ├── 文本解析功能
│   ├── 列表管理界面
│   ├── 搜索和批量操作
│   └── 完整的样式和脚本
│
├── 📁 functions/              # Cloudflare Functions
│   └── 📁 api/
│       └── 📄 [[route]].js   # API 路由处理器
│           ├── /api/auth      # 登录验证
│           └── /api/data      # 数据存取
│
├── 📄 wrangler.toml          # Cloudflare 配置文件
│   ├── 项目基本信息
│   ├── KV 命名空间绑定
│   └── 环境配置
│
├── 📄 package.json           # Node.js 依赖配置
│   └── 部署脚本
│
├── 📄 .gitignore             # Git 忽略规则
├── 📄 _headers               # HTTP 安全头
├── 📄 .dev.vars.example      # 环境变量示例
│
├── 📖 README.md              # 项目主文档
├── 📖 DEPLOYMENT.md          # 详细部署指南
├── 📖 QUICKSTART.md          # 快速开始指南
└── 📖 STRUCTURE.md           # 本文档
```

---

## 核心文件详解

### 1. index.html (前端应用)

**功能模块：**

```
index.html
│
├── 🎨 样式层 (CSS)
│   ├── 全局样式和变量
│   ├── 登录界面样式
│   ├── 主界面样式
│   ├── 卡片和表单样式
│   ├── 列表项样式
│   ├── 模态框和通知
│   └── 响应式布局
│
├── 🏗️ 结构层 (HTML)
│   ├── 登录屏幕 (#loginScreen)
│   │   └── 密码输入框
│   │
│   └── 主界面 (#mainScreen)
│       ├── 顶部导航
│       ├── 统计卡片
│       ├── 文本解析区
│       ├── 手动添加区
│       ├── 搜索框
│       ├── 批量操作栏
│       └── 文件码列表
│
└── ⚡ 逻辑层 (JavaScript)
    ├── 登录模块
    │   ├── login()          # 登录处理
    │   ├── sha256()         # 密码哈希
    │   ├── checkSession()   # 会话检查
    │   └── logout()         # 退出登录
    │
    ├── 数据模块
    │   ├── loadData()       # 从 API 加载
    │   ├── saveData()       # 保存到 API
    │   └── exportData()     # 导出 JSON
    │
    ├── 解析模块
    │   ├── parseText()      # 解析文本
    │   └── addManual()      # 手动添加
    │
    ├── 列表模块
    │   ├── renderList()     # 渲染列表
    │   ├── editNote()       # 编辑备注
    │   ├── saveNote()       # 保存备注
    │   ├── deleteItem()     # 删除单项
    │   └── copyCode()       # 复制文件码
    │
    ├── 批量操作模块
    │   ├── toggleSelectMode()  # 切换选择模式
    │   ├── toggleSelect()      # 切换单项选择
    │   ├── batchDelete()       # 批量删除
    │   └── cancelSelection()   # 取消选择
    │
    ├── 搜索模块
    │   └── filterList()     # 过滤列表
    │
    └── UI 辅助
        ├── showNotification() # 显示通知
        └── escapeHtml()       # HTML 转义
```

**特点：**
- ✅ 纯前端，无需构建
- ✅ 自包含（HTML + CSS + JS 一体）
- ✅ 响应式设计
- ✅ 深色主题
- ✅ 无外部依赖

---

### 2. functions/api/[[route]].js (后端 API)

**功能模块：**

```
[[route]].js
│
├── 🔒 安全模块
│   ├── generateSessionId()   # 生成会话 ID
│   ├── verifySession()        # 验证会话
│   └── checkRateLimit()       # 频率限制
│
├── 🔀 路由处理
│   ├── onRequest()            # 主处理函数
│   ├── handleAuth()           # POST /api/auth
│   ├── handleGetData()        # GET /api/data
│   └── handleSaveData()       # POST /api/data
│
├── 💾 数据操作
│   ├── KV 读取
│   ├── KV 写入
│   └── 数据验证
│
└── 🌐 HTTP 辅助
    ├── CORS 处理
    ├── JSON 响应
    └── 错误处理
```

**API 端点：**

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/auth` | POST | 登录验证 | ❌ |
| `/api/data` | GET | 获取数据 | ✅ |
| `/api/data` | POST | 保存数据 | ✅ |

**特点：**
- ✅ 自动路由匹配 `[[route]]`
- ✅ Session 会话管理
- ✅ Rate limiting 防护
- ✅ KV 存储集成
- ✅ CORS 支持

---

### 3. wrangler.toml (Cloudflare 配置)

**配置项：**

```toml
[项目信息]
name                      # 项目名称
compatibility_date        # 兼容性日期

[Pages 配置]
pages_build_output_dir    # 构建输出目录

[KV 绑定]
binding                   # 变量名（在代码中使用）
id                        # KV 命名空间 ID

[环境配置]
[env.development]         # 开发环境
[env.production]          # 生产环境
```

**特点：**
- ✅ 定义 KV 绑定
- ✅ 多环境支持
- ✅ Wrangler CLI 使用

---

## 数据流向

### 登录流程

```
用户输入密码
    ↓
前端 SHA-256 哈希
    ↓
POST /api/auth
    ↓
后端验证哈希
    ↓
生成 Session ID
    ↓
返回前端
    ↓
存入 sessionStorage
    ↓
后续请求带 X-Session header
```

### 数据保存流程

```
用户操作（添加/编辑/删除）
    ↓
更新前端 fileData 数组
    ↓
POST /api/data
    ↓
验证 Session
    ↓
写入 KV: FILE_CODES_LIST
    ↓
返回成功
    ↓
前端显示通知
```

### 数据加载流程

```
页面加载/登录成功
    ↓
GET /api/data
    ↓
验证 Session
    ↓
从 KV 读取: FILE_CODES_LIST
    ↓
返回 JSON 数据
    ↓
前端渲染列表
```

---

## 技术架构图

```
┌─────────────────────────────────────────┐
│         Cloudflare Global Network       │
│              (CDN + Edge)               │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐       ┌──────────────┐
│  Static      │       │  Functions   │
│  Assets      │       │  (Serverless)│
│              │       │              │
│  index.html  │       │  [[route]].js│
└──────────────┘       └──────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Workers KV      │
                    │  (Key-Value DB)  │
                    │                  │
                    │  FILE_CODES_LIST │
                    └──────────────────┘
```

---

## 部署架构

```
开发环境                     生产环境
┌─────────┐                ┌─────────┐
│  Local  │                │ GitHub  │
│  Files  │                │  Repo   │
└────┬────┘                └────┬────┘
     │                          │
     │ wrangler                 │ Git Push
     │ pages deploy             │
     │                          │
     ▼                          ▼
┌──────────────────────────────────┐
│     Cloudflare Dashboard         │
│  ┌─────────┐     ┌─────────┐    │
│  │   KV    │     │  Pages  │    │
│  │  Setup  │────▶│  Deploy │    │
│  └─────────┘     └─────────┘    │
│         │              │         │
│         │  Binding     │         │
│         └──────────────┘         │
└──────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │   Production     │
    │  your-app.pages  │
    │      .dev        │
    └──────────────────┘
```

---

## 环境变量和密钥

### 环境变量位置

| 环境 | 位置 | 用途 |
|------|------|------|
| 本地开发 | `.dev.vars` | Wrangler 本地运行 |
| 生产环境 | Dashboard | Pages 环境变量 |
| 预览环境 | Dashboard | Pages 环境变量 |

### 必需的配置

| 配置项 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `PASSWORD_HASH` | 环境变量 | ✅ | 密码 SHA-256 哈希 |
| `FILE_CODES_KV` | KV 绑定 | ✅ | KV 命名空间绑定 |

---

## 文件大小和性能

| 文件 | 大小 | 说明 |
|------|------|------|
| index.html | ~25KB | 压缩后更小 |
| [[route]].js | ~8KB | 边缘计算 |
| 总计 | ~33KB | 极小体积 |

**性能特点：**
- ⚡ 全球 CDN 分发
- ⚡ 边缘计算（接近用户）
- ⚡ 0 冷启动（Pages Functions）
- ⚡ 毫秒级响应

---

## 扩展和定制

### 添加新的文件码格式

编辑 `index.html` 中的 `parseText()` 函数：

```javascript
const patterns = [
    /@filepan_bot:([a-zA-Z0-9_-]+)/g,
    /showfilesbot_([a-zA-Z0-9_-]+)/g,
    /你的新格式_([a-zA-Z0-9_-]+)/g,  // 添加这里
];
```

### 添加新的 API 端点

编辑 `functions/api/[[route]].js`：

```javascript
if (path === 'your-new-endpoint') {
    return await handleYourEndpoint(request, env);
}
```

### 修改主题颜色

编辑 `index.html` 中的 CSS 变量：

```css
:root {
    --primary-color: #60a5fa;  /* 修改主色调 */
    --bg-color: #1e1e2e;       /* 修改背景色 */
}
```

---

## 限制和配额

### Cloudflare 免费版限制

| 资源 | 限制 | 说明 |
|------|------|------|
| KV 读取 | 100,000/天 | 足够个人使用 |
| KV 写入 | 1,000/天 | 足够个人使用 |
| KV 存储 | 1GB | 可存储大量文件码 |
| Functions 请求 | 100,000/天 | 足够个人使用 |
| 带宽 | 无限 | ✅ |

### 应用层限制

| 限制项 | 值 | 位置 |
|--------|------|------|
| 单次数据大小 | 5MB | `[[route]].js` |
| Rate Limit | 100 req/min/IP | `[[route]].js` |
| Session 过期 | 24 小时 | `[[route]].js` |

---

## 最佳实践

### 1. 安全
- ✅ 使用强密码（16+ 字符）
- ✅ 定期更换密码
- ✅ 不暴露部署 URL
- ✅ 监控访问日志

### 2. 数据
- ✅ 定期导出备份
- ✅ 验证导入数据
- ✅ 控制数据大小

### 3. 性能
- ✅ 利用 CDN 缓存
- ✅ 减少 KV 写入频率
- ✅ 客户端数据缓存

### 4. 维护
- ✅ 监控 KV 使用量
- ✅ 定期检查日志
- ✅ 及时更新依赖

---

## 相关资源

- 📚 Cloudflare Pages 文档: https://developers.cloudflare.com/pages/
- 📚 Workers KV 文档: https://developers.cloudflare.com/kv/
- 📚 Functions 文档: https://developers.cloudflare.com/pages/functions/
- 📚 Wrangler 文档: https://developers.cloudflare.com/workers/wrangler/

---

**理解项目结构，轻松定制和扩展！** 🚀

