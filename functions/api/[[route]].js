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

function checkRateLimit(ip, limit = 100, window = 60000) {
    const now = Date.now();
    const key = ip;
    
    if (!rateLimits.has(key)) {
        rateLimits.set(key, { count: 1, resetAt: now + window });
        return true;
    }
    
    const record = rateLimits.get(key);
    
    if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + window;
        return true;
    }
    
    if (record.count >= limit) {
        return false;
    }
    
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
            return jsonResponse({ 
                success: false, 
                error: '密码错误' 
            }, 401);
        }
    } catch (error) {
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
        
        const dataStr = await kvNamespace.get('FILE_CODES_LIST');
        const data = dataStr ? JSON.parse(dataStr) : [];
        
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
        
        // 保存到 KV
        const kvNamespace = env.FILE_CODES_KV;
        
        if (!kvNamespace) {
            return jsonResponse({ error: 'KV namespace 未配置' }, 500);
        }
        
        await kvNamespace.put('FILE_CODES_LIST', dataStr);
        
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

