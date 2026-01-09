const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root', // 假设默认用户为 root
    password: 'hellohello@2025',
};

async function setupDatabase() {
    let connection;
    try {
        // 1. 连接 MySQL 服务
        connection = await mysql.createConnection(dbConfig);
        console.log('已连接到 MySQL 服务');

        // 2. 创建数据库 zxff (如果不存在)
        await connection.query(`CREATE DATABASE IF NOT EXISTS zxff`);
        console.log('数据库 zxff 检查/创建完成');

        // 3. 切换到 zxff 数据库
        await connection.changeUser({ database: 'zxff' });

        // 4. 创建 menu 表
        const createMenuTable = `
            CREATE TABLE IF NOT EXISTS menu (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                image_url VARCHAR(500),
                is_featured BOOLEAN DEFAULT FALSE
            )
        `;
        await connection.query(createMenuTable);
        console.log('表 menu 检查/创建完成');

        // 5. 创建 reservations 表
        const createReservationTable = `
            CREATE TABLE IF NOT EXISTS reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                guests INT NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createReservationTable);
        console.log('表 reservations 检查/创建完成');

        // 6. 创建 users 表 (新增)
        const createUserTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.query(createUserTable);
        console.log('表 users 检查/创建完成');

        // 7. 初始化管理员用户 (新增)
        const [userRows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (userRows.length === 0) {
            // 注意：生产环境应使用 bcrypt 哈希密码，此处为了演示使用明文或简单处理
            // 假设我们直接存明文，后续在 server.js 中验证
            await connection.query('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', '123456']);
            console.log('管理员用户 admin 创建成功');
        } else {
            console.log('管理员用户已存在');
        }

        // 8. 插入初始化菜单数据 (如果表为空)
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM menu');
        if (rows[0].count === 0) {
            const menuItems = [
                // 前菜 Starter
                {
                    name: '意式烤面包 (Bruschetta)',
                    description: '烤面包配新鲜番茄、罗勒和大蒜橄榄油',
                    price: 38.00,
                    category: 'starter',
                    image_url: 'https://images.unsplash.com/photo-1572695157363-bc31c5d4ef15?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: false
                },
                {
                    name: '卡布里沙拉 (Caprese Salad)',
                    description: '新鲜水牛芝士、番茄、罗勒配香醋汁',
                    price: 58.00,
                    category: 'starter',
                    image_url: 'https://images.unsplash.com/photo-1529312266912-b33cf6227e2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: false
                },
                // 主菜 Main
                {
                    name: '经典肉酱面 (Bolognese)',
                    description: '慢炖牛肉酱配手工宽面，撒上帕尔马干酪',
                    price: 68.00,
                    category: 'main',
                    image_url: 'https://images.unsplash.com/photo-1551183053-bf91b1d3116c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: true
                },
                {
                    name: '香煎牛排 (Ribeye Steak)',
                    description: '澳洲安格斯肋眼牛排，配烤蔬菜和红酒汁',
                    price: 188.00,
                    category: 'main',
                    image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: false
                },
                // 披萨 Pizza
                {
                    name: '玛格丽特披萨 (Margherita)',
                    description: '番茄酱、莫扎里拉芝士、新鲜罗勒',
                    price: 88.00,
                    category: 'pizza',
                    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: false
                },
                {
                    name: '帕尔马火腿披萨 (Prosciutto)',
                    description: '番茄酱、芝士、帕尔马火腿、芝麻菜',
                    price: 108.00,
                    category: 'pizza',
                    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: true
                },
                // 甜点 Dessert
                {
                    name: '提拉米苏 (Tiramisu)',
                    description: '手指饼干浸泡浓缩咖啡，配马斯卡彭芝士',
                    price: 48.00,
                    category: 'dessert',
                    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: false
                },
                {
                    name: '意式奶冻 (Panna Cotta)',
                    description: '香草奶冻配树莓酱',
                    price: 42.00,
                    category: 'dessert',
                    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    is_featured: false
                }
            ];

            const insertQuery = `
                INSERT INTO menu (name, description, price, category, image_url, is_featured)
                VALUES ?
            `;
            const values = menuItems.map(item => [
                item.name,
                item.description,
                item.price,
                item.category,
                item.image_url,
                item.is_featured
            ]);

            await connection.query(insertQuery, [values]);
            console.log(`成功插入 ${values.length} 条菜单数据`);
        } else {
            console.log('菜单数据已存在，跳过初始化');
        }

    } catch (error) {
        console.error('数据库初始化失败:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();