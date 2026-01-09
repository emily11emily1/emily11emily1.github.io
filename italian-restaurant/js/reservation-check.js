document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api';

    // 元素获取
    const loginPanel = document.getElementById('login-panel');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const searchBtn = document.getElementById('search-btn');
    const searchPhoneInput = document.getElementById('search-phone');
    const reservationResult = document.getElementById('reservation-result');

    // 菜单管理相关元素
    const menuListContainer = document.getElementById('menu-list-container');
    const addMenuBtn = document.getElementById('add-menu-btn');
    const menuModal = document.getElementById('menu-modal');
    const closeModal = document.querySelector('.close-modal');
    const menuForm = document.getElementById('menu-form');
    const modalTitle = document.getElementById('modal-title');

    // Tab 切换
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = document.querySelectorAll('.admin-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            if (targetId === 'menu-section') {
                loadMenu();
            } else if (targetId === 'reservations-section') {
                loadReservations();
            }
        });
    });

    // 状态管理
    let token = localStorage.getItem('adminToken');
    let allMenuItems = [];

    // 初始化界面状态
    function updateUI() {
        if (token) {
            if (loginPanel) loginPanel.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'block';
            if (adminPanel) loadReservations(); // 登录后默认加载预定
        } else {
            if (loginPanel) loginPanel.style.display = 'block';
            if (adminPanel) adminPanel.style.display = 'none';
            if (reservationResult) reservationResult.innerHTML = '';
        }
    }

    // 处理登录
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            const username = usernameInput ? usernameInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    token = data.token;
                    localStorage.setItem('adminToken', token);
                    updateUI();
                } else {
                    alert(data.error || '登录失败');
                }
            } catch (error) {
                console.error('登录错误:', error);
                alert('登录请求失败');
            }
        });
    }

    // 处理注销
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            token = null;
            localStorage.removeItem('adminToken');
            updateUI();
        });
    }

    // --- 预定管理逻辑 ---

    async function loadReservations() {
        if (!token || !reservationResult) return;

        const phone = searchPhoneInput ? searchPhoneInput.value.trim() : '';
        reservationResult.innerHTML = '<p style="text-align:center;">加载中...</p>';

        try {
            const url = phone 
                ? `${API_BASE_URL}/reservations?phone=${phone}`
                : `${API_BASE_URL}/reservations`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (handleAuthError(response)) return;

            const reservations = await response.json();

            if (reservations.length === 0) {
                reservationResult.innerHTML = '<p style="text-align:center;">未找到匹配的预订记录。</p>';
                return;
            }

            reservationResult.innerHTML = reservations.map(res => `
                <div class="reservation-card" style="position: relative;">
                    <h4>${res.name} <small style="color:#666; font-weight:normal;">(${new Date(res.date).toLocaleDateString()} ${res.time})</small></h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                        <p><strong>人数:</strong> ${res.guests}人</p>
                        <p><strong>手机:</strong> ${res.phone}</p>
                    </div>
                    <p style="margin-top: 5px;"><strong>备注:</strong> ${res.message || '无'}</p>
                    <span class="status" style="position: absolute; top: 15px; right: 15px; background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">已接收</span>
                </div>
            `).join('');

        } catch (error) {
            console.error('查询失败:', error);
            reservationResult.innerHTML = '<p style="color:red; text-align:center;">数据加载出错，请稍后重试。</p>';
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', loadReservations);
    }

    // --- 菜单管理逻辑 ---

    async function loadMenu() {
        if (!menuListContainer) return;
        menuListContainer.innerHTML = '<p style="text-align:center;">加载菜单中...</p>';

        try {
            const response = await fetch(`${API_BASE_URL}/menu`);
            if (!response.ok) throw new Error('网络响应异常');
            allMenuItems = await response.json();
            renderAdminMenu(allMenuItems);
        } catch (error) {
            console.error('加载菜单失败:', error);
            menuListContainer.innerHTML = '<p style="text-align:center; color:red;">菜单加载失败。</p>';
        }
    }

    function renderAdminMenu(items) {
        if (items.length === 0) {
            menuListContainer.innerHTML = '<p style="text-align:center;">暂无菜品。</p>';
            return;
        }

        menuListContainer.innerHTML = items.map(item => `
            <div class="menu-list-item">
                <img src="${item.image_url || 'https://via.placeholder.com/60'}" alt="${item.name}">
                <div class="menu-list-info">
                    <h4 style="margin: 0 0 5px 0;">
                        ${item.name} 
                        <small style="color: #666; font-weight: normal;">(¥${item.price})</small>
                        ${item.is_featured ? '<i class="fas fa-star" style="color: gold; font-size: 0.8rem;"></i>' : ''}
                    </h4>
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">${item.category}</p>
                </div>
                <div class="menu-list-actions">
                    <button class="btn-edit" onclick="editMenu(${item.id})"><i class="fas fa-edit"></i> 编辑</button>
                    <button class="btn-delete" onclick="deleteMenu(${item.id})"><i class="fas fa-trash"></i> 删除</button>
                </div>
            </div>
        `).join('');
    }

    // 暴露给全局以便 onclick 调用
    window.editMenu = (id) => {
        const item = allMenuItems.find(m => m.id === id);
        if (!item) return;

        document.getElementById('menu-id').value = item.id;
        document.getElementById('menu-name').value = item.name;
        document.getElementById('menu-desc').value = item.description || '';
        document.getElementById('menu-price').value = item.price;
        document.getElementById('menu-category').value = item.category;
        
        // 默认显示 URL 输入框，填入当前值
        document.getElementById('source-type-url').checked = true;
        document.getElementById('image-input-url').style.display = 'block';
        document.getElementById('image-input-file').style.display = 'none';
        document.getElementById('menu-image').value = item.image_url || '';
        document.getElementById('menu-image-file').value = ''; // 清空文件选择

        document.getElementById('menu-featured').checked = !!item.is_featured;

        if (modalTitle) modalTitle.innerText = '编辑菜品';
        if (menuModal) menuModal.style.display = 'block';
    };

    window.deleteMenu = async (id) => {
        if (!confirm('确定要删除这个菜品吗？此操作不可恢复。')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/menu/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (handleAuthError(response)) return;

            if (response.ok) {
                alert('删除成功');
                loadMenu();
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('删除错误:', error);
            alert('删除请求出错');
        }
    };

    // 模态框操作
    if (addMenuBtn) {
        addMenuBtn.addEventListener('click', () => {
            if (menuForm) menuForm.reset();
            document.getElementById('menu-id').value = '';
            if (modalTitle) modalTitle.innerText = '新增菜品';
            if (menuModal) menuModal.style.display = 'block';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (menuModal) menuModal.style.display = 'none';
        });
    }

    window.onclick = (event) => {
        if (menuModal && event.target == menuModal) {
            menuModal.style.display = 'none';
        }
    };

    // 菜单表单提交
    if (menuForm) {
        menuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('menu-id').value;
            const menuData = {
                name: document.getElementById('menu-name').value,
                description: document.getElementById('menu-desc').value,
                price: parseFloat(document.getElementById('menu-price').value),
                category: document.getElementById('menu-category').value,
                image_url: document.getElementById('menu-image').value,
                is_featured: document.getElementById('menu-featured').checked
            };

            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_BASE_URL}/menu/${id}` : `${API_BASE_URL}/menu`;

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(menuData)
                });

                if (handleAuthError(response)) return;

                const result = await response.json();

                if (response.ok && result.success) {
                    alert(id ? '更新成功' : '添加成功');
                    if (menuModal) menuModal.style.display = 'none';
                    loadMenu();
                } else {
                    alert('操作失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('保存错误:', error);
                alert('保存请求出错');
            }
        });
    }

    // 辅助函数：处理 Auth 错误
    function handleAuthError(response) {
        if (response.status === 401) {
            alert('登录已过期，请重新登录');
            token = null;
            localStorage.removeItem('adminToken');
            updateUI();
            return true;
        }
        return false;
    }

    // 初始检查
    updateUI();
});