// Cloudflare Pages Functions - API 路由处理

// 简单的 session 存储（使用内存，重启后失效）
const sessions = new Map();

// 生成随机 session ID
function generateSessionId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// 验证 session
function verifySession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return false;
    
    // 检查 session 是否过期（24小时）
    const now = Date.now();
    if (now - session.createdAt > 24 * 60 * 60 * 1000) {
        sessions.delete(sessionId);
        return false;
    }
    
    // 更新最后访问时间
    session.lastAccess = now;
    return true;
}

// Rate limiting - 简单的内存实现
const rateLimits = new Map();

// 加密/解密工具函数
async function encryptData(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // 生成随机 IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    // 加密数据
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        dataBuffer
    );
    
    // 组合 IV + 加密数据
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    // 转换为 base64
    return btoa(String.fromCharCode(...result));
}

async function decryptData(encryptedData, key) {
    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // 从 base64 解码
        const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // 分离 IV 和加密数据
        const iv = data.slice(0, 12);
        const encrypted = data.slice(12);
        
        // 导入密钥
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        // 解密数据
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encrypted
        );
        
        // 解析 JSON
        return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

// 生成加密密钥（基于密码哈希）
function generateEncryptionKey(passwordHash) {
    // 使用密码哈希的前32个字符作为密钥
    return passwordHash.substring(0, 32).padEnd(32, '0');
}

function checkRateLimit(ip, limit = 100, window = 60000) {
    const now = Date.now();
    const key = ip;
    
    if (!rateLimits.has(key)) {
        rateLimits.set(key, { count: 0, resetAt: now + window });
    }
    
    const record = rateLimits.get(key);
    
    // 检查是否超过时间窗口
    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + window;
    }
    
    // 检查是否超过限制
    if (record.count >= limit) {
        return false;
    }
    
    // 增加计数
    record.count++;
    return true;
}

// CORS 头
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session',
};

// 主处理函数
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    // 处理 OPTIONS 请求（CORS preflight）
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP)) {
        return jsonResponse({ error: '请求过于频繁，请稍后再试' }, 429);
    }
    
    // 路由处理
    try {
        if (path === 'auth' && request.method === 'POST') {
            return await handleAuth(request, env);
        }
        
        if (path === 'data') {
            // 验证 session
            const sessionId = request.headers.get('X-Session');
            if (!sessionId || !verifySession(sessionId)) {
                return jsonResponse({ error: '未授权' }, 401);
            }
            
            if (request.method === 'GET') {
                return await handleGetData(env);
            }
            
            if (request.method === 'POST') {
                return await handleSaveData(request, env);
            }
        }
        
        return jsonResponse({ error: '路由未找到' }, 404);
    } catch (error) {
        console.error('API Error:', error);
        return jsonResponse({ error: '服务器错误: ' + error.message }, 500);
    }
}

// 处理认证
async function handleAuth(request, env) {
    try {
        // 获取客户端 IP
        const clientIP = request.headers.get('CF-Connecting-IP') || 
                        request.headers.get('X-Forwarded-For') || 
                        'unknown';
        
        // 防爆破检查 - 更严格的限制
        const authRateLimitAllowed = checkRateLimit(`auth_${clientIP}`, 5, 300000); // 5次/5分钟
        if (!authRateLimitAllowed) {
            console.warn(`Auth rate limit exceeded for IP: ${clientIP}`);
            return jsonResponse({ 
                success: false, 
                error: '登录尝试过于频繁，请5分钟后再试' 
            }, 429);
        }
        
        const body = await request.json();
        const { password } = body;
        
        if (!password) {
            return jsonResponse({ error: '密码不能为空' }, 400);
        }
        
        // 从环境变量获取密码哈希
        const correctPasswordHash = env.PASSWORD_HASH;
        
        if (!correctPasswordHash) {
            // 如果没有设置密码，使用默认密码的哈希
            // 默认密码: admin123
            // SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
            console.warn('PASSWORD_HASH not set, using default password');
        }
        
        const expectedHash = correctPasswordHash || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        
        if (password === expectedHash) {
            // 登录成功，清除失败计数
            rateLimits.delete(`auth_${clientIP}`);
            
            // 生成 session
            const sessionId = generateSessionId();
            sessions.set(sessionId, {
                createdAt: Date.now(),
                lastAccess: Date.now()
            });
            
            return jsonResponse({ 
                success: true, 
                session: sessionId 
            });
        } else {
            // 登录失败，记录失败尝试
            console.warn(`Failed login attempt from IP: ${clientIP}`);
            
            return jsonResponse({ 
                success: false, 
                error: '密码错误' 
            }, 401);
        }
    } catch (error) {
        console.error('Auth error:', error);
        return jsonResponse({ error: '认证失败: ' + error.message }, 400);
    }
}

// 获取数据
async function handleGetData(env) {
    try {
        // 从 KV 读取数据
        const kvNamespace = env.FILE_CODES_KV;
        
        if (!kvNamespace) {
            console.warn('KV namespace not bound');
            return jsonResponse({ data: [] });
        }
        
        const encryptedData = await kvNamespace.get('FILE_CODES_LIST');
        
        if (!encryptedData) {
            return jsonResponse({ data: [] });
        }
        
        // 生成解密密钥
        const passwordHash = env.PASSWORD_HASH || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        const encryptionKey = generateEncryptionKey(passwordHash);
        
        // 尝试解密数据
        const data = await decryptData(encryptedData, encryptionKey);
        
        if (data === null) {
            console.warn('Failed to decrypt data, returning empty array');
            return jsonResponse({ data: [] });
        }
        
        return jsonResponse({ data });
    } catch (error) {
        console.error('Get data error:', error);
        return jsonResponse({ data: [], error: error.message });
    }
}

// 保存数据
async function handleSaveData(request, env) {
    try {
        const body = await request.json();
        const { data } = body;
        
        if (!Array.isArray(data)) {
            return jsonResponse({ error: '数据格式错误' }, 400);
        }
        
        // 验证数据大小（限制为 5MB）
        const dataStr = JSON.stringify(data);
        if (dataStr.length > 5 * 1024 * 1024) {
            return jsonResponse({ error: '数据过大' }, 400);
        }
        
        // 生成加密密钥
        const passwordHash = env.PASSWORD_HASH || '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
        const encryptionKey = generateEncryptionKey(passwordHash);
        
        // 加密数据
        const encryptedData = await encryptData(data, encryptionKey);
        
        // 保存到 KV
        const kvNamespace = env.FILE_CODES_KV;
        
        if (!kvNamespace) {
            return jsonResponse({ error: 'KV namespace 未配置' }, 500);
        }
        
        await kvNamespace.put('FILE_CODES_LIST', encryptedData);
        
        return jsonResponse({ success: true });
    } catch (error) {
        console.error('Save data error:', error);
        return jsonResponse({ error: '保存失败: ' + error.message }, 500);
    }
}

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}

