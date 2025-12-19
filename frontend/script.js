class InventoryApp {
    constructor() {
        this.API_BASE = 'http://localhost:5000/api/items';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.categoryChart = null;
        this.lowStockChart = null;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadItems();
        await this.loadAnalytics();
        this.startAutoRefresh();
    }

    bindEvents() {
        // Search & Filter
        document.getElementById('searchInput').addEventListener('input', debounce(this.searchItems.bind(this), 300));
        document.getElementById('categoryFilter').addEventListener('change', this.searchItems.bind(this));
        
        // Modal
        document.getElementById('addBtn').addEventListener('click', () => this.openModal());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('itemForm').addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.loadItems();
            }
        });
    }

    async loadItems() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...(this.searchQuery || {})
            });
            
            const response = await fetch(`${this.API_BASE}?${params}`);
            const data = await response.json();
            
            this.renderItems(data.items);
            this.renderPagination(data.pagination);
            this.updateStats();
        } catch (error) {
            console.error('Error loading items:', error);
        }
    }

    renderItems(items) {
        const tbody = document.getElementById('itemsBody');
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>
                    <span class="category-badge ${item.category.toLowerCase()}">${item.category}</span>
                </td>
                <td><strong>${item.quantity}</strong></td>
                <td>${item.minThreshold}</td>
                <td>₹${item.price.toLocaleString()}</td>
                <td>₹${(item.quantity * item.price).toLocaleString()}</td>
                <td>
                    <span class="status ${item.isLowStock ? 'low' : 'normal'}">
                        ${item.isLowStock ? 'LOW STOCK' : 'OK'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-edit" onclick="app.editItem('${item._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-delete" onclick="app.deleteItem('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async searchItems() {
        this.searchQuery = {
            search: document.getElementById('searchInput').value,
            category: document.getElementById('categoryFilter').value
        };
        this.currentPage = 1;
        await this.loadItems();
    }

    async loadAnalytics() {
        try {
            const [categoryRes, lowStockRes] = await Promise.all([
                fetch(`${this.API_BASE}/analytics/category`),
                fetch(`${this.API_BASE}/analytics/lowstock`)
            ]);
            
            const categoryData = await categoryRes.json();
            const lowStockData = await lowStockRes.json();
            
            this.renderCategoryChart(categoryData);
            this.renderLowStockChart(lowStockData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    renderCategoryChart(data) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (this.categoryChart) this.categoryChart.destroy();
        
        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d._id),
                datasets: [{
                    data: data.map(d => d.totalQuantity),
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: 'white' } },
                    title: { display: true, text: 'Stock by Category', color: 'white', font: { size: 16 } }
                }
            }
        });
    }

    openModal(item = null) {
        document.getElementById('itemModal').style.display = 'block';
        document.getElementById('modalTitle').textContent = item ? 'Edit Item' : 'Add New Item';
        
        if (item) {
            document.getElementById('name').value = item.name;
            document.getElementById('category').value = item.category;
            document.getElementById('quantity').value = item.quantity;
            document.getElementById('minThreshold').value = item.minThreshold;
            document.getElementById('price').value = item.price;
            this.editingId = item._id;
        }
    }

    closeModal() {
        document.getElementById('itemModal').style.display = 'none';
        document.getElementById('itemForm').reset();
        this.editingId = null;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            category: document.getElementById('category').value,
            quantity: parseInt(document.getElementById('quantity').value),
            minThreshold: parseInt(document.getElementById('minThreshold').value),
            price: parseFloat(document.getElementById('price').value)
        };

        try {
            const url = this.editingId 
                ? `${this.API_BASE}/${this.editingId}`
                : this.API_BASE;
            
            const method = this.editingId ? 'PUT' : 'POST';
            
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            this.closeModal();
            this.loadItems();
            this.loadAnalytics();
        } catch (error) {
            alert('Error saving item: ' + error.message);
        }
    }

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await fetch(`${this.API_BASE}/${id}`, { method: 'DELETE' });
                this.loadItems();
                this.loadAnalytics();
            } catch (error) {
                alert('Error deleting item: ' + error.message);
            }
        }
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadItems();
            this.updateStats();
        }, 30000); // 30 seconds
    }

    async updateStats() {
        // Simple stats from current data - in production fetch from API
        const items = document.querySelectorAll('#itemsBody tr');
        document.getElementById('totalItems').textContent = items.length;
        const lowStock = Array.from(items).filter(row => 
            row.querySelector('.status.low')
        ).length;
        document.getElementById('lowStockCount').textContent = lowStock;
    }
}

// Utils
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const app = new InventoryApp();
