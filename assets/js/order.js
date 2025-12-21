// ═══════════════════════════════════════════════════════════════════
// AURUM CORP - Order Management System
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    const orderList = document.getElementById('orders-content');
    if (!orderList) return;

    const orders = Store.orders || [];

    if (orders.length === 0) {
        orderList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="package-x"></i>
                <h3>Aucune commande</h3>
                <p>Vous n'avez pas encore passe de commande.</p>
                <a href="catalogue.html" class="btn btn-primary">Decouvrir nos produits</a>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Trier les commandes par date (plus recentes en premier)
    const sortedOrders = [...orders].sort((a, b) => b.date - a.date);

    orderList.innerHTML = sortedOrders.map((order, index) => orderCard(order, sortedOrders.length - index)).join('');
    if (window.lucide) lucide.createIcons();
    if (window.fixLucideIcons) setTimeout(fixLucideIcons, 100);
});

// ═══════════════════════════════════════════════════════════════════
// Obtenir le numero de recu sequentiel
// ═══════════════════════════════════════════════════════════════════
function getReceiptNumber(orderId) {
    const allOrders = [...(Store.orders || [])].sort((a, b) => a.date - b.date);
    const index = allOrders.findIndex(o => o.id === orderId);
    return String(index + 1).padStart(5, '0'); // Format: 00001, 00002, etc.
}

// ═══════════════════════════════════════════════════════════════════
// Carte de commande
// ═══════════════════════════════════════════════════════════════════
function orderCard(order, displayNumber) {
    const date = new Date(order.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const receiptNum = getReceiptNumber(order.id);

    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <span class="order-number">Recu N° ${receiptNum}</span>
                    <span class="order-date">${date}</span>
                </div>
                ${statusPill(order.status || 'processing')}
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image || item.images?.[0] || 'assets/img/placeholder-product-1.svg'}" alt="${item.name}" class="order-item-img" onerror="this.src='assets/img/placeholder-product-1.svg'">
                        <div class="order-item-details">
                            <span class="order-item-name">${item.name}</span>
                            <span class="order-item-qty">Quantite: ${item.qty}</span>
                        </div>
                        <span class="order-item-price">${formatFCFA(item.price * item.qty)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div class="order-total">
                    <span>Total</span>
                    <strong>${formatFCFA(order.total)}</strong>
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="repeatOrder('${order.id}')">
                        <i data-lucide="refresh-cw"></i> Repeter
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="openInvoice('${order.id}')">
                        <i data-lucide="download"></i> Telecharger
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════════
// Indicateur de statut
// ═══════════════════════════════════════════════════════════════════
function statusPill(status) {
    const statusMap = {
        'processing': { label: 'En cours', class: 'status-processing' },
        'shipped': { label: 'Expedie', class: 'status-shipped' },
        'delivered': { label: 'Livre', class: 'status-delivered' },
        'cancelled': { label: 'Annule', class: 'status-cancelled' }
    };
    const s = statusMap[status] || statusMap['processing'];
    return `<span class="status-pill ${s.class}">${s.label}</span>`;
}

// ═══════════════════════════════════════════════════════════════════
// Repeter une commande
// ═══════════════════════════════════════════════════════════════════
function repeatOrder(orderId) {
    const order = Store.orders.find(o => o.id === orderId);
    if (!order) return;

    order.items.forEach(item => {
        const existingItem = Store.cart.find(c => c.id === item.id);
        if (existingItem) {
            existingItem.qty += item.qty;
        } else {
            Store.cart.push({ ...item });
        }
    });

    saveStore();
    showToast('Articles ajoutes au panier', 'success');
    updateCartCount();
}

// ═══════════════════════════════════════════════════════════════════
// Ouvrir la facture / recu
// ═══════════════════════════════════════════════════════════════════
function openInvoice(orderId) {
    const order = Store.orders.find(o => o.id === orderId);
    if (!order) return;

    const receiptNum = getReceiptNumber(orderId);
    const date = new Date(order.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = order.discount || 0;

    const invoiceHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>AURUM CORP - Recu N° ${receiptNum}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f5f5f5; 
            padding: 40px;
            color: #333;
        }
        .invoice { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 50px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border-radius: 8px;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 3px solid #C9A961; 
            padding-bottom: 30px; 
            margin-bottom: 30px; 
        }
        .logo { 
            font-size: 32px; 
            font-weight: 700; 
            color: #C9A961;
            letter-spacing: 4px;
        }
        .logo span { color: #333; }
        .invoice-info { text-align: right; }
        .invoice-info h2 { 
            font-size: 24px; 
            color: #333; 
            margin-bottom: 10px;
        }
        .invoice-info p { color: #666; margin: 4px 0; }
        .receipt-number {
            font-size: 28px;
            font-weight: 700;
            color: #C9A961;
        }
        .section { margin: 30px 0; }
        .section-title { 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            color: #999; 
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        table { width: 100%; border-collapse: collapse; }
        th { 
            text-align: left; 
            padding: 15px 10px; 
            background: #f8f8f8;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #eee;
        }
        th:last-child, td:last-child { text-align: right; }
        td { 
            padding: 20px 10px; 
            border-bottom: 1px solid #f0f0f0;
            vertical-align: middle;
        }
        .item-name { font-weight: 500; color: #333; }
        .item-price { color: #666; }
        .totals { 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 10px 0;
            font-size: 16px;
        }
        .total-row.discount { color: #4CAF50; }
        .total-row.grand-total { 
            font-size: 22px; 
            font-weight: 700;
            color: #C9A961;
            border-top: 2px solid #C9A961;
            margin-top: 15px;
            padding-top: 20px;
        }
        .footer { 
            margin-top: 50px; 
            text-align: center; 
            color: #999;
            font-size: 14px;
            padding-top: 30px;
            border-top: 1px solid #eee;
        }
        .footer p { margin: 5px 0; }
        .thank-you {
            font-size: 18px;
            color: #C9A961;
            font-weight: 600;
            margin-bottom: 15px;
        }
        @media print {
            body { background: white; padding: 0; }
            .invoice { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div>
                <div class="logo">AURUM<span>CORP</span></div>
                <p style="color: #666; margin-top: 10px;">L'excellence en joaillerie de luxe</p>
            </div>
            <div class="invoice-info">
                <h2>RECU</h2>
                <p class="receipt-number">N° ${receiptNum}</p>
                <p>${date}</p>
            </div>
        </div>

        <div class="section">
            <h3 class="section-title">Details de la commande</h3>
            <table>
                <thead>
                    <tr>
                        <th>Article</th>
                        <th style="text-align: center;">Quantite</th>
                        <th style="text-align: right;">Prix unitaire</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td class="item-name">${item.name}</td>
                            <td style="text-align: center;">${item.qty}</td>
                            <td class="item-price" style="text-align: right;">${formatFCFA(item.price)}</td>
                            <td style="text-align: right; font-weight: 600;">${formatFCFA(item.price * item.qty)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Sous-total</span>
                <span>${formatFCFA(subtotal)}</span>
            </div>
            ${discount > 0 ? `
                <div class="total-row discount">
                    <span>Reduction</span>
                    <span>-${formatFCFA(discount)}</span>
                </div>
            ` : ''}
            <div class="total-row">
                <span>Livraison</span>
                <span>Offerte</span>
            </div>
            <div class="total-row grand-total">
                <span>TOTAL</span>
                <span>${formatFCFA(order.total)}</span>
            </div>
        </div>

        <div class="footer">
            <p class="thank-you">Merci pour votre confiance</p>
            <p>AURUM CORP - Joaillerie de Luxe</p>
            <p>contact@aurumcorp.com | www.aurumcorp.com</p>
            <p style="margin-top: 15px; font-size: 12px;">Ce document fait office de recu officiel.</p>
        </div>
    </div>
    <script>window.print();</script>
</body>
</html>
    `;

    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
}
