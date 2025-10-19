# 🚀 详细部署指南

本文档提供详细的 Cloudflare Pages 部署步骤和配置说明。

## 📋 部署前准备

### 1. 创建 Cloudflare 账号
- 访问 https://dash.cloudflare.com/sign-up
- 完成注册和邮箱验证

### 2. 生成密码哈希

**重要：** 在部署前，你需要生成密码的 SHA-256 哈希值。

#### 方法 A：使用在线工具（最简单）
1. 访问 https://emn178.github.io/online-tools/sha256.html
2. 输入你想要设置的密码
3. 复制生成的哈希值

#### 方法 B：使用浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 粘贴以下代码：

```javascript
async function generateHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('密码:', password);
  console.log('哈希:', hashHex);
  return hashHex;
}

// 替换 'your-password' 为你的密码
generateHash('your-password');
```

#### 方法 C：使用 Node.js
```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

#### 默认密码
如果暂时使用默认密码（仅用于测试）：
- 密码：`admin123`
- 哈希：`240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`

⚠️ **生产环境必须更改默认密码！**

## 🎯 方法一：通过 GitHub + Cloudflare Pages（推荐）

### 步骤 1：上传代码到 GitHub

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/file-codes-manager.git

# 推送到 GitHub
git push -u origin main
```

### 步骤 2：创建 KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **Workers & Pages**
3. 切换到 **KV** 标签
4. 点击 **Create a namespace**
5. 输入命名空间名称：`FILE_CODES_KV`
6. 点击 **Add**
7. **记录显示的 Namespace ID**（后面需要用到）

### 步骤 3：创建 Pages 项目

1. 在 **Workers & Pages** 页面
2. 点击 **Create application**
3. 选择 **Pages** 标签
4. 点击 **Connect to Git**
5. 授权并选择你的 GitHub 仓库
6. 配置构建设置：
   - **Project name**: `file-codes-manager`（或自定义）
   - **Production branch**: `main`
   - **Build command**: 留空
   - **Build output directory**: `/`
7. 点击 **Save and Deploy**

### 步骤 4：配置 KV 绑定

1. 部署完成后，进入项目详情页
2. 点击 **Settings** 标签
3. 左侧选择 **Functions**
4. 滚动到 **KV namespace bindings** 部分
5. 点击 **Add binding**
   - **Variable name**: `FILE_CODES_KV`
   - **KV namespace**: 选择之前创建的 `FILE_CODES_KV`
6. 点击 **Save**

### 步骤 5：设置环境变量

1. 在 **Settings** 标签下
2. 左侧选择 **Environment variables**
3. 点击 **Add variables**
4. 添加变量：
   - **Variable name**: `PASSWORD_HASH`
   - **Value**: 粘贴你生成的密码哈希
   - **Environment**: 选择 Production 和 Preview
5. 点击 **Save**

### 步骤 6：重新部署

1. 进入项目的 **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Retry deployment**
4. 等待部署完成

### 步骤 7：访问应用

1. 部署成功后，会显示部署 URL（格式：`https://your-project.pages.dev`）
2. 点击 URL 访问应用
3. 使用你设置的密码登录

## 🎯 方法二：直接上传（无需 Git）

### 步骤 1：创建 KV 命名空间
（同方法一的步骤 2）

### 步骤 2：创建 Pages 项目

1. 在 **Workers & Pages** 页面
2. 点击 **Create application**
3. 选择 **Pages** 标签
4. 点击 **Upload assets**
5. 输入项目名称：`file-codes-manager`
6. 将项目文件夹拖放到上传区域（或选择文件）
7. 点击 **Deploy site**

### 步骤 3-7
（同方法一的步骤 4-7）

## 🎯 方法三：使用 Wrangler CLI

### 步骤 1：安装 Wrangler

```bash
# 使用 npm
npm install -g wrangler

# 或使用 yarn
yarn global add wrangler
```

### 步骤 2：登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器进行授权。

### 步骤 3：创建 KV 命名空间

```bash
# 生产环境
wrangler kv:namespace create FILE_CODES_KV

# 开发环境（可选）
wrangler kv:namespace create FILE_CODES_KV --preview
```

命令会输出类似以下内容：
```
🌀 Creating namespace with title "file-codes-manager-FILE_CODES_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "FILE_CODES_KV", id = "abc123def456" }
```

### 步骤 4：更新 wrangler.toml

编辑 `wrangler.toml` 文件，将 namespace ID 更新为上一步获得的 ID：

```toml
[[kv_namespaces]]
binding = "FILE_CODES_KV"
id = "abc123def456"  # 替换为你的实际 ID
```

### 步骤 5：部署

```bash
wrangler pages deploy ./ --project-name=file-codes-manager
```

首次部署会询问是否创建新项目，选择 Yes。

### 步骤 6：配置环境变量

```bash
# 设置密码哈希
wrangler pages secret put PASSWORD_HASH --project-name=file-codes-manager
# 粘贴你的密码哈希值，按回车
```

或者通过 Dashboard 设置（参考方法一步骤 5）。

### 步骤 7：访问应用

部署成功后，Wrangler 会显示部署 URL。

## 🔍 验证部署

### 1. 检查 KV 绑定
```bash
wrangler pages deployment list --project-name=file-codes-manager
```

### 2. 查看环境变量
通过 Dashboard：Settings → Environment variables

### 3. 测试功能
1. 访问部署 URL
2. 输入密码登录
3. 添加测试文件码
4. 刷新页面，检查数据是否持久化

## 🐛 常见问题

### Q: 提示 "KV namespace not bound"
**A:** 
1. 确认已在 Pages 设置中绑定 KV
2. 变量名必须是 `FILE_CODES_KV`
3. 重新部署项目

### Q: 登录后立即跳转回登录页
**A:**
1. 检查浏览器是否禁用 sessionStorage
2. 检查 PASSWORD_HASH 环境变量是否正确设置
3. 打开浏览器开发者工具查看网络请求

### Q: 密码正确但无法登录
**A:**
1. 确认密码哈希计算正确（SHA-256）
2. 检查环境变量是否应用到正确的环境
3. 查看 Functions 日志（Dashboard → Workers & Pages → 项目 → Logs）

### Q: 数据保存失败
**A:**
1. 检查 KV 配额（免费版有限制）
2. 确认数据大小不超过 5MB
3. 查看 Functions 日志排查错误

### Q: 部署后提示 404
**A:**
1. 确认 `index.html` 在项目根目录
2. 检查 Build output directory 设置为 `/`
3. 确认 `functions/api/[[route]].js` 路径正确

## 📊 监控和日志

### 查看访问日志
Dashboard → Workers & Pages → 项目 → Logs

### 查看 KV 使用情况
Dashboard → Workers & Pages → KV → 选择命名空间

### 设置告警（可选）
Dashboard → 项目 → Alerts

## 🔄 更新和维护

### 更新代码（Git 方式）
```bash
# 修改代码后
git add .
git commit -m "Update feature"
git push

# Cloudflare 会自动部署
```

### 更新代码（Direct Upload 方式）
1. 在 Dashboard 进入项目
2. 点击 Deployments → Upload new version
3. 上传新文件

### 更新代码（Wrangler 方式）
```bash
wrangler pages deploy ./ --project-name=file-codes-manager
```

### 备份数据
定期使用应用的"导出数据"功能导出 JSON 备份。

### 更改密码
1. 生成新密码的哈希
2. 在 Dashboard 更新 PASSWORD_HASH 环境变量
3. 重新部署（或等待自动生效）

## 🌐 自定义域名（可选）

### 添加自定义域名
1. Dashboard → 项目 → Custom domains
2. 点击 **Set up a custom domain**
3. 输入域名（如 `files.yourdomain.com`）
4. 按指引添加 CNAME 记录
5. 等待 DNS 生效（通常几分钟）

### SSL/TLS
Cloudflare 自动提供免费 SSL 证书。

## 📈 性能优化

### 启用缓存
在 `functions/api/[[route]].js` 中添加缓存头：
```javascript
// 对静态内容启用缓存
headers['Cache-Control'] = 'public, max-age=3600';
```

### CDN 加速
Cloudflare Pages 自动使用全球 CDN，无需额外配置。

### 监控性能
Dashboard → 项目 → Analytics

## 🔒 安全建议

1. ✅ 使用强密码（至少 12 位，包含大小写字母、数字、特殊字符）
2. ✅ 定期更换密码
3. ✅ 不要在公共场合分享部署 URL
4. ✅ 定期备份数据
5. ✅ 监控 Functions 日志，检查异常访问
6. ✅ 考虑添加 IP 白名单（在 Functions 中实现）

## 📞 获取帮助

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Cloudflare Community: https://community.cloudflare.com/
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/

---

**祝部署顺利！** 🎉

