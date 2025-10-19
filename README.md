# 📁 文件码管理系统

一个部署在 Cloudflare Pages 的现代化文件码管理工具，支持文本解析、列表管理、数据持久化和访问控制。

## ✨ 功能特点

### 核心功能
- 🔍 **简化解析**：直接按行处理，每行作为一个完整的文件码内容
- 📝 **列表管理**：编辑备注、一键复制、删除记录、批量合并
- 💾 **数据持久化**：使用 Cloudflare Workers KV 存储数据（AES-256-GCM 加密）
- 🔐 **访问控制**：密码保护，SHA-256 加密验证，防爆破保护
- 🎨 **2025炫酷主题**：渐变色彩、玻璃拟态、霓虹效果、动态动画

### 高级功能
- 🔎 **搜索过滤**：按内容快速搜索，支持多行内容
- ✅ **批量操作**：批量选择、批量删除、批量合并
- 📤 **数据导出**：JSON 格式导出所有数据
- 📊 **统计信息**：实时显示文件码数量
- ⚡ **性能优化**：Rate limiting、会话管理、AES加密
- 🎨 **视觉特效**：2025年流行渐变、玻璃拟态、霓虹发光

## 🚀 快速部署

### 前置要求
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/) 和 npm（用于本地开发）
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)（可选）

### 部署步骤

#### 方法 1：通过 Cloudflare Dashboard（推荐）

1. **创建 KV 命名空间**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 Workers & Pages → KV
   - 点击 "Create a namespace"
   - 命名为 `FILE_CODES_KV`
   - 记下创建的 namespace ID

2. **创建 Pages 项目**
   - 进入 Workers & Pages → Create application → Pages → Connect to Git
   - 选择你的 Git 仓库（GitHub/GitLab）
   - 或者选择 "Direct Upload" 直接上传文件

3. **配置 Pages 项目**
   
   **绑定 KV 命名空间：**
   - 进入 Pages 项目 → Settings → Functions
   - 找到 "KV namespace bindings"
   - 添加绑定：
     - Variable name: `FILE_CODES_KV`
     - KV namespace: 选择刚创建的命名空间

   **设置环境变量：**
   - 进入 Pages 项目 → Settings → Environment variables
   - 添加变量：
     - Variable name: `PASSWORD_HASH`
     - Value: 你的密码的 SHA-256 哈希值
   - 应用到 Production 和 Preview 环境

4. **部署**
   - 如果是 Git 连接：推送代码到仓库即自动部署
   - 如果是 Direct Upload：上传项目文件夹

#### 方法 2：使用 Wrangler CLI

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 创建 KV 命名空间
wrangler kv:namespace create FILE_CODES_KV

# 记下返回的 ID，更新 wrangler.toml 中的 id 字段

# 4. 部署到 Pages
wrangler pages deploy ./ --project-name=file-code-manager

# 5. 配置环境变量（通过 Dashboard）
# 进入 Pages 项目设置添加 PASSWORD_HASH
```

### 生成密码哈希

你需要生成密码的 SHA-256 哈希值。可以使用以下方法：

**在线工具：**
访问 https://emn178.github.io/online-tools/sha256.html 输入密码获取哈希值

**使用 Node.js：**
```javascript
const crypto = require('crypto');
const password = 'your-password-here';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
```

**使用 Python：**
```python
import hashlib
password = 'your-password-here'
hash_value = hashlib.sha256(password.encode()).hexdigest()
print(hash_value)
```

**默认密码：**
- 密码：`admin123`
- 哈希：`240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`

⚠️ **安全提示**：部署到生产环境前，请务必修改默认密码！

## 📁 项目结构

```
file-code-manager/
├── index.html              # 前端单页应用
├── functions/              # Cloudflare Functions
│   └── api/
│       └── [[route]].js   # API 路由处理
├── wrangler.toml          # Cloudflare 配置
├── .gitignore             # Git 忽略文件
└── README.md              # 项目文档
```

## 🔧 配置说明

### wrangler.toml

```toml
name = "file-code-manager"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./"

[[kv_namespaces]]
binding = "FILE_CODES_KV"
id = "your-kv-namespace-id-here"  # 替换为你的 KV ID
```

### 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `PASSWORD_HASH` | 登录密码的 SHA-256 哈希 | 是 |

### KV 绑定

| 绑定名称 | 用途 | KV Key |
|----------|------|---------|
| `FILE_CODES_KV` | 存储文件码数据 | `FILE_CODES_LIST` |

## 📖 使用指南

### 登录
1. 访问部署后的网站
2. 输入密码登录（默认：admin123）
3. 登录状态保持在浏览器会话中

### 解析文本
1. 在"粘贴文本进行解析"区域输入文本（支持多行）
2. 点击"解析并添加"
3. 系统将每行非空内容作为一个完整的文件码添加
4. 自动过滤空白行和纯数字行

### 管理文件码
- **编辑备注**：点击"编辑"按钮修改备注信息
- **复制内容**：点击"复制"按钮复制完整内容到剪贴板
- **删除记录**：点击"删除"按钮（需二次确认）
- **手动添加**：使用"手动添加文件码"表单（支持多行内容）
- **批量合并**：选择多个项目后点击"批量合并"，用空格连接

### 搜索和批量操作
- **搜索**：在搜索框输入关键词过滤列表（支持多行内容搜索）
- **批量选择**：点击"批量选择"进入批量模式
- **批量删除**：选择多个项目后点击"批量删除"
- **批量合并**：选择多个项目后点击"批量合并"，用空格连接内容
- **导出数据**：点击顶部"导出数据"按钮下载 JSON 文件

## 🔒 安全特性

- ✅ SHA-256 密码加密
- ✅ Session 会话管理（24小时过期）
- ✅ Rate Limiting（防止暴力破解）
- ✅ AES-256-GCM 数据加密存储
- ✅ XSS 防护（输入转义）
- ✅ CORS 配置
- ✅ 401 自动退出登录

## 🎨 UI 特性

- 🌈 2025年炫酷渐变主题（粉红-紫色-金色）
- 🌙 深色背景 + 玻璃拟态效果
- 📱 完全响应式布局
- ✨ 流畅的动画效果和霓虹发光
- 🎯 直观的操作反馈
- 📊 实时统计信息
- 🔔 友好的通知提示
- 💫 动态渐变文字和悬停特效

## 🛠️ 本地开发

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd file-code-manager

# 2. 安装 Wrangler（如果还没有）
npm install -g wrangler

# 3. 创建开发环境 KV
wrangler kv:namespace create FILE_CODES_KV --preview

# 4. 更新 wrangler.toml 中的开发环境配置

# 5. 启动本地开发服务器
wrangler pages dev ./ --kv FILE_CODES_KV=<your-dev-kv-id>
```

访问 http://localhost:8788 查看应用。

## 📊 API 接口

### POST /api/auth
登录验证

**请求：**
```json
{
  "password": "sha256_hash_here"
}
```

**响应：**
```json
{
  "success": true,
  "session": "session_id_here"
}
```

### GET /api/data
获取所有文件码数据

**Headers：**
```
X-Session: your_session_id
```

**响应：**
```json
{
  "data": [
    {
      "id": 1234567890,
      "code": "@filepan_bot:abc123",
      "note": "备注信息",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/data
保存文件码数据

**Headers：**
```
X-Session: your_session_id
Content-Type: application/json
```

**请求：**
```json
{
  "data": [...]
}
```

**响应：**
```json
{
  "success": true
}
```

## 🐛 故障排除

### KV 命名空间未绑定
**错误：** "KV namespace not bound"

**解决：** 
1. 确认已创建 KV 命名空间
2. 在 Pages 项目设置中正确绑定
3. 重新部署项目

### 密码验证失败
**错误：** 密码错误

**解决：**
1. 确认 PASSWORD_HASH 环境变量已设置
2. 验证哈希值是否正确
3. 检查是否应用到正确的环境（Production/Preview）

### 401 未授权
**错误：** 频繁跳转到登录页

**解决：**
1. 检查浏览器 sessionStorage 是否被清除
2. 确认 session 未过期（24小时）
3. 检查网络请求中是否包含 X-Session header

## 📝 更新日志

### v2.0.0 (2025-01-01) - 重大更新
- 🎨 **全新2025炫酷主题**：渐变色彩、玻璃拟态、霓虹效果
- 🔄 **简化解析逻辑**：移除复杂正则匹配，直接按行处理
- 🔗 **新增批量合并**：支持多行内容合并功能
- 🔒 **增强安全**：AES-256-GCM 数据加密存储
- 📱 **多行内容支持**：保持换行格式显示
- ⚡ **防爆破保护**：Rate limiting 机制

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🔐 实现密码保护和会话管理
- 💾 集成 Cloudflare KV 存储
- 🎨 现代化 UI 设计
- 🔍 搜索和批量操作功能
- 📤 数据导出功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

**享受使用！** 🎉

