document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api';

    // 1. 移动端导航切换
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (hamburger) hamburger.classList.remove('active');
                if (navMenu) navMenu.classList.remove('active');
            });
        });
    }

    // 2. 加载菜单数据 (仅在有菜单容器时执行)
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        let allMenuItems = []; // 存储获取到的菜单数据

        async function fetchMenu() {
            try {
                const response = await fetch(`${API_BASE_URL}/menu`);
                if (!response.ok) throw new Error('网络响应异常');
                allMenuItems = await response.json();
                renderMenu(allMenuItems);
            } catch (error) {
                console.error('加载菜单失败:', error);
                menuContainer.innerHTML = '<p style="text-align:center; color:red;">抱歉，菜单加载失败，请稍后重试。</p>';
            }
        }

        function renderMenu(items) {
            menuContainer.innerHTML = items.map(item => `
                <div class="menu-item ${item.is_featured ? 'featured' : ''}" data-category="${item.category}">
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="menu-img">` : ''}
                    <div class="menu-content">
                        <div class="menu-header">
                            <h3>${item.is_featured ? '<i class="fas fa-star text-accent"></i> ' : ''}${item.name}</h3>
                            <span class="price">¥${item.price}</span>
                        </div>
                        <p class="menu-desc">${item.description}</p>
                    </div>
                </div>
            `).join('');
        }

        // 初始加载
        fetchMenu();
    }

    // 3. 菜单分类过滤
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                
                // 获取当前 DOM 中的所有菜单项进行显示/隐藏切换
                const currentMenuItems = document.querySelectorAll('.menu-item');
                
                currentMenuItems.forEach(item => {
                    if (category === 'all' || item.getAttribute('data-category') === category) {
                        item.style.display = 'flex'; // 注意这里改为 flex 因为我们在 CSS 中设置了 display: flex
                        item.animate([
                            { opacity: 0, transform: 'translateY(20px)' },
                            { opacity: 1, transform: 'translateY(0)' }
                        ], { duration: 300, easing: 'ease-out' });
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // 4. 预订表单提交
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(reservationForm);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch(`${API_BASE_URL}/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    alert(`预订成功！您的预订ID是: ${result.id}\n我们会通过电话与您确认。`);
                    reservationForm.reset();
                } else {
                    alert(`预订失败: ${result.error}`);
                }
            } catch (error) {
                console.error('提交失败:', error);
                alert('提交失败，请检查网络连接。');
            }
        });
    }

    // 5. 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // 如果是在 check-reservation.html 页面点击主页的锚点，不应拦截，让其自然跳转
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});