let currentUser = null;

// Проверка авторизации
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    showSection('stats');
    document.getElementById('addProductForm')?.addEventListener('submit', addProduct);
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.user && data.user.role === 'admin') {
            currentUser = data.user;
            loadStats();
        } else {
            window.location.href = '/';
        }
    })
    .catch(() => window.location.href = '/');
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

function showSection(section) {
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('productsSection').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    document.getElementById('addProductSection').style.display = 'none';
    
    document.getElementById(`${section}Section`).style.display = 'block';
    
    if (section === 'products') loadProducts();
    if (section === 'orders') loadOrders();
    if (section === 'stats') loadStats();
}

function loadStats() {
    const token = localStorage.getItem('token');
    fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(stats => {
        document.getElementById('stats').innerHTML = `
            <div class="stat-card">
                <h3>Всего заказов</h3>
                <div class="value">${stats.totalOrders}</div>
            </div>
            <div class="stat-card">
                <h3>Всего пользователей</h3>
                <div class="value">${stats.totalUsers}</div>
            </div>
            <div class="stat-card">
                <h3>Всего товаров</h3>
                <div class="value">${stats.totalProducts}</div>
            </div>
            <div class="stat-card">
                <h3>Выручка</h3>
                <div class="value">${stats.totalRevenue} ₽</div>
            </div>
        `;
    });
}

function loadProducts() {
    const token = localStorage.getItem('token');
    fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(products => {
        document.getElementById('productsList').innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>Название</th><th>Цена</th><th>В наличии</th><th>Действия</th></tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.price} ₽</td>
                            <td>${product.stock}</td>
                            <td>
                                <button onclick="deleteProduct('${product._id}')">Удалить</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    });
}

function loadOrders() {
    const token = localStorage.getItem('token');
    fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(orders => {
        document.getElementById('ordersList').innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr><th>Заказ #</th><th>Покупатель</th><th>Сумма</th><th>Статус</th><th>Действия</th></tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order._id.slice(-6)}</td>
                            <td>${order.customerInfo?.name || order.user?.name || '-'}</td>
                            <td>${order.totalAmount} ₽</td>
                            <td>
                                <select onchange="updateOrderStatus('${order._id}', this.value)">
                                    <option value="new" ${order.status === 'new' ? 'selected' : ''}>Новый</option>
                                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обработке</option>
                                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменён</option>
                                </select>
                            </td>
                            <td>
                                <button onclick="viewOrder('${order._id}')">Детали</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    });
}

function addProduct(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    
    const product = {
        name: formData.get('name'),
        substance: formData.get('substance'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        description: formData.get('description'),
        instructions: formData.get('instructions')
    };
    
    const data = new FormData();
    data.append('product', JSON.stringify(product));
    if (formData.get('image').size > 0) {
        data.append('image', formData.get('image'));
    }
    
    fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            alert('Товар добавлен');
            e.target.reset();
            showSection('products');
        } else {
            alert(data.error || 'Ошибка');
        }
    });
}

function deleteProduct(id) {
    if (confirm('Удалить товар?')) {
        const token = localStorage.getItem('token');
        fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(() => {
            alert('Товар удалён');
            loadProducts();
        });
    }
}

function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
    fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then(() => {
        alert('Статус обновлён');
    });
}

function viewOrder(orderId) {
    alert('Функция просмотра деталей заказа');
}