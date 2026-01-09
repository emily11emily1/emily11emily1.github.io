const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = 3000;

// 简单的内存 Token 存储
const sessions = new Set();

// 配置 Multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // 使用时间戳前缀防止重名，并保留扩展名
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // 托管静态文件

// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'hellohello@2025',
    database: 'zxff'
};

// 获取数据库连接池
const pool = mysql.createPool(dbConfig);

// 鉴权中间件
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (sessions.has(token)) {
            return next();
        }
    }
    res.status(401).json({ error: '未授权：请先登录' });
};

// 路由：管理员登录 (查询数据库)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (rows.length > 0) {
            const user = rows[0];
            // 简单比对明文密码 (实际生产环境应使用 bcrypt.compare)
            if (user.password === password) {
                const token = crypto.randomBytes(16).toString('hex');
                sessions.add(token);
                res.json({ success: true, token });
                return;
            }
        }
        res.status(401).json({ error: '用户名或密码错误' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 路由：获取所有菜单项
app.get('/api/menu', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM menu');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '无法获取菜单数据' });
    }
});

// 路由：新增菜单项 (需要管理员权限)
app.post('/api/menu', authenticateAdmin, async (req, res) => {
    const { name, description, price, category, image_url, is_featured } = req.body;
    
    if (!name || !price || !category) {
        return res.status(400).json({ error: '名称、价格和分类为必填项' });
    }

    try {
        const insertQuery = `
            INSERT INTO menu (name, description, price, category, image_url, is_featured)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(insertQuery, [
            name, 
            description || '', 
            price, 
            category, 
            image_url || '', 
            is_featured ? 1 : 0
        ]);
        res.status(201).json({ success: true, id: result.insertId, message: '菜品添加成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '添加失败' });
    }
});

// 路由：更新菜单项 (需要管理员权限)
app.put('/api/menu/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_featured } = req.body;

    try {
        const updateQuery = `
            UPDATE menu 
            SET name = ?, description = ?, price = ?, category = ?, image_url = ?, is_featured = ?
            WHERE id = ?
        `;
        await pool.query(updateQuery, [
            name, 
            description || '', 
            price, 
            category, 
            image_url || '', 
            is_featured ? 1 : 0, 
            id
        ]);
        res.json({ success: true, message: '菜品更新成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '更新失败' });
    }
});

// 路由：删除菜单项 (需要管理员权限)
app.delete('/api/menu/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM menu WHERE id = ?', [id]);
        res.json({ success: true, message: '菜品删除成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '删除失败' });
    }
});

// 路由：提交预定
app.post('/api/reservations', async (req, res) => {
    const { name, phone, date, time, guests, message } = req.body;
    
    // 简单验证
    if (!name || !phone || !date || !time || !guests) {
        return res.status(400).json({ error: '请填写所有必填字段' });
    }

    try {
        const insertQuery = `
            INSERT INTO reservations (name, phone, date, time, guests, message)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(insertQuery, [name, phone, date, time, guests, message]);
        res.status(201).json({ message: '预定成功', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '预定失败，请稍后重试' });
    }
});

// 路由：查询预定 (需要管理员权限)
app.get('/api/reservations', authenticateAdmin, async (req, res) => {
    const { phone } = req.query;

    try {
        let query = 'SELECT * FROM reservations';
        const params = [];

        if (phone) {
            query += ' WHERE phone LIKE ?';
            params.push(`%${phone}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '查询失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});