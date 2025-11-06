const apiUrl = window.location.hostname === 'localhost' 
    ? "http://localhost:8081/api/products" 
    : "/api/products";

let productsData = []; // Сохраняем данные о товарах для подсказок

async function loadProducts() {
    try {
        console.log("Загружаем товары из:", apiUrl);
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Получены данные:", data);
        productsData = data; // Сохраняем данные

        const table = document.querySelector("#productsTable tbody");
        table.innerHTML = "";

        let totalStockValue = 0;

        data.forEach(p => {
            const stockValue = p.stockValue || (p.purchasePrice * p.quantity);
            totalStockValue += stockValue;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${p.name}</td>
                <td><strong>${p.sku}</strong></td>
                <td>${p.purchasePrice.toFixed(2)}</td>
                <td>${p.sellPrice.toFixed(2)}</td>
                <td>${p.quantity}</td>
                <td>${stockValue.toFixed(2)}</td>
            `;
            table.appendChild(row);
        });

        // Добавляем строку с общей суммой
        const totalRow = document.createElement("tr");
        totalRow.style.fontWeight = "bold";
        totalRow.style.backgroundColor = "#f0f0f0";
        totalRow.innerHTML = `
            <td colspan="5" style="text-align: right;">Общая стоимость на складе:</td>
            <td>${totalStockValue.toFixed(2)}</td>
        `;
        table.appendChild(totalRow);

        // Обновляем подсказки для артикулов
        updateSkuSuggestions();

    } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
        const table = document.querySelector("#productsTable tbody");
        table.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Ошибка загрузки: ${error.message}</td></tr>`;
    }
}

// Функции для управления формами
function showReceiveForm() {
    hideAllForms();
    document.getElementById('receiveForm').style.display = 'block';
    document.getElementById('forms').style.display = 'block';
    updateSkuSuggestions('receive');
}

function showSellForm() {
    hideAllForms();
    document.getElementById('sellForm').style.display = 'block';
    document.getElementById('forms').style.display = 'block';
    updateSkuSuggestions('sell');
}

function hideForm(formId) {
    document.getElementById(formId).style.display = 'none';
    // Скрываем контейнер форм, если все формы скрыты
    if (!isAnyFormVisible()) {
        document.getElementById('forms').style.display = 'none';
    }
}

function hideAllForms() {
    document.getElementById('receiveForm').style.display = 'none';
    document.getElementById('sellForm').style.display = 'none';
}

function isAnyFormVisible() {
    return document.getElementById('receiveForm').style.display === 'block' ||
           document.getElementById('sellForm').style.display === 'block';
}

// Обновляем подсказки для артикулов
function updateSkuSuggestions(type = 'all') {
    const datalist = document.getElementById('skuList');
    datalist.innerHTML = '';
    
    productsData.forEach(product => {
        const option = document.createElement('option');
        option.value = product.sku;
        option.textContent = `${product.sku} - ${product.name}`;
        datalist.appendChild(option);
    });

    // Обновляем текстовые подсказки
    if (type === 'receive' || type === 'all') {
        const receiveSuggestions = document.getElementById('receiveSuggestions');
        receiveSuggestions.innerHTML = 'Доступные артикулы: ' + 
            productsData.map(p => 
                `<span class="suggestion-item" onclick="document.getElementById('receiveSku').value='${p.sku}'">${p.sku}</span>`
            ).join(' ');
    }

    if (type === 'sell' || type === 'all') {
        const sellSuggestions = document.getElementById('sellSuggestions');
        sellSuggestions.innerHTML = 'Доступные артикулы: ' + 
            productsData.map(p => 
                `<span class="suggestion-item" onclick="document.getElementById('sellSku').value='${p.sku}'">${p.sku}</span>`
            ).join(' ');
    }
}

// Операции с товарами по артикулу
async function receiveStock() {
    try {
        const sku = document.getElementById('receiveSku').value.trim();
        const quantity = document.getElementById('receiveQuantity').value;

        if (!sku || !quantity) {
            alert("Заполните артикул и количество");
            return;
        }

        if (quantity <= 0) {
            alert("Количество должно быть положительным числом");
            return;
        }

        const response = await fetch(`${apiUrl}/receive-by-sku/${encodeURIComponent(sku)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parseInt(quantity))
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const updatedProduct = await response.json();
        
        // Очищаем форму и скрываем её
        document.getElementById('receiveSku').value = '';
        document.getElementById('receiveQuantity').value = '';
        hideForm('receiveForm');
        
        // Обновляем список товаров
        await loadProducts();
        alert(`✅ Товар "${updatedProduct.name}" (${sku}) успешно принят на склад! Добавлено: ${quantity} единиц`);
        
    } catch (error) {
        console.error("Ошибка при приходе товара:", error);
        alert(`❌ Ошибка при приходе товара: ${error.message}`);
    }
}

async function sellStock() {
    try {
        const sku = document.getElementById('sellSku').value.trim();
        const quantity = document.getElementById('sellQuantity').value;

        if (!sku || !quantity) {
            alert("Заполните артикул и количество");
            return;
        }

        if (quantity <= 0) {
            alert("Количество должно быть положительным числом");
            return;
        }

        const response = await fetch(`${apiUrl}/sell-by-sku/${encodeURIComponent(sku)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parseInt(quantity))
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const updatedProduct = await response.json();
        
        // Очищаем форму и скрываем её
        document.getElementById('sellSku').value = '';
        document.getElementById('sellQuantity').value = '';
        hideForm('sellForm');
        
        // Обновляем список товаров
        await loadProducts();
        alert(`✅ Товар "${updatedProduct.name}" (${sku}) успешно продан! Продано: ${quantity} единиц`);
        
    } catch (error) {
        console.error("Ошибка при продаже товара:", error);
        alert(`❌ Ошибка при продаже товара: ${error.message}`);
    }
}

// Добавление нового товара
document.querySelector("#productForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const product = {
            name: document.querySelector("#name").value.trim(),
            sku: document.querySelector("#sku").value.trim(),
            purchasePrice: parseFloat(document.querySelector("#purchasePrice").value),
            sellPrice: parseFloat(document.querySelector("#sellPrice").value),
            quantity: parseInt(document.querySelector("#quantity").value)
        };

        if (!product.name || !product.sku || isNaN(product.purchasePrice) || 
            isNaN(product.sellPrice) || isNaN(product.quantity)) {
            alert("Заполните все поля корректно");
            return;
        }

        if (product.quantity < 0) {
            alert("Количество не может быть отрицательным");
            return;
        }

        // Проверяем, нет ли уже товара с таким артикулом
        const existingProduct = productsData.find(p => p.sku === product.sku);
        if (existingProduct) {
            if (!confirm(`Товар с артикулом "${product.sku}" уже существует (${existingProduct.name}). Хотите добавить новый товар с этим артикулом?`)) {
                return;
            }
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        // Очищаем форму
        e.target.reset();
        
        // Обновляем список товаров
        await loadProducts();
        alert("✅ Товар успешно добавлен!");
        
    } catch (error) {
        console.error("Ошибка при создании товара:", error);
        alert(`❌ Ошибка при создании товара: ${error.message}`);
    }
});

// Загружаем товары при старте
loadProducts();