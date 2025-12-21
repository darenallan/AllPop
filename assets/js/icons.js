/**
 * AURUM - Luxury Icon System
 * Based on Lucide Icons with premium styling
 * 
 * Style: Minimalist, high-end, elegant, modern luxury
 * Colors: Gold (#D4AF37) on ivory or deep black
 */

// ============================================
// ICON MAPPINGS - Complete Luxury Icon Set
// ============================================

const AurumIcons = {
  
  // ─────────────────────────────────────────
  // 1. NAVIGATION & ACTIONS
  // ─────────────────────────────────────────
  navigation: {
    home: 'home',
    search: 'search',
    wishlist: 'heart',
    wishlistFilled: 'heart',
    cart: 'shopping-bag',
    user: 'user',
    account: 'user-circle',
    login: 'log-in',
    logout: 'log-out',
    register: 'user-plus',
    filters: 'sliders-horizontal',
    sort: 'arrow-up-down',
    menu: 'menu',
    close: 'x',
    back: 'arrow-left',
    forward: 'arrow-right',
    chevronLeft: 'chevron-left',
    chevronRight: 'chevron-right',
    chevronDown: 'chevron-down',
    chevronUp: 'chevron-up',
    more: 'more-horizontal',
    moreVertical: 'more-vertical',
    share: 'share-2',
    copy: 'copy',
    external: 'external-link',
    download: 'download',
    upload: 'upload',
    refresh: 'refresh-cw',
    eye: 'eye',
    eyeOff: 'eye-off',
  },

  // ─────────────────────────────────────────
  // 2. MARKETPLACE CATEGORIES
  // ─────────────────────────────────────────
  categories: {
    // Mode & Vêtements
    'Mode & Vêtements': 'shirt',
    fashion: 'shirt',
    dress: 'shirt',
    clothing: 'shirt',
    
    // Accessoires
    'Accessoires': 'gem',
    accessories: 'gem',
    
    // Chaussures
    'Chaussures': 'footprints',
    shoes: 'footprints',
    
    // Bijoux
    'Bijoux': 'diamond',
    jewelry: 'diamond',
    
    // Maroquinerie
    'Maroquinerie': 'briefcase',
    leather: 'briefcase',
    bags: 'shopping-bag',
    
    // Beauté & Parfums
    'Beauté, Hygiène & Bien-être': 'sparkles',
    'Beauté & Parfums': 'sparkles',
    beauty: 'sparkles',
    perfume: 'flower-2',
    
    // Restauration & Gastronomie
    'Restauration & Boissons': 'utensils',
    restaurant: 'utensils',
    food: 'chef-hat',
    gastronomy: 'wine',
    
    // Maison & Décoration
    'Maison, Meubles & Décoration': 'lamp',
    home: 'lamp',
    decoration: 'palette',
    furniture: 'armchair',
    
    // Art & Créateurs
    'Art & Créateurs': 'palette',
    art: 'brush',
    creators: 'pencil-ruler',
    
    // High-tech & Lifestyle
    'Électronique, Téléphonie & Informatique': 'smartphone',
    tech: 'laptop',
    electronics: 'cpu',
    
    // Véhicules
    'Véhicules & Mobilité': 'car',
    vehicles: 'car',
    
    // Bâtiment
    'Bâtiment, Quincaillerie & Matériaux': 'hammer',
    construction: 'hard-hat',
    
    // Default
    default: 'shopping-bag'
  },

  // ─────────────────────────────────────────
  // 3. BOUTIQUE & SELLER
  // ─────────────────────────────────────────
  seller: {
    store: 'store',
    boutique: 'store',
    createStore: 'store',
    verified: 'badge-check',
    verifiedSeller: 'shield-check',
    pending: 'clock',
    pendingApproval: 'hourglass',
    expired: 'calendar-x',
    expiredBoutique: 'store-slash',
    subscription: 'credit-card',
    renewal: 'rotate-cw',
    premium: 'crown',
    seller: 'user-check',
    products: 'package',
    addProduct: 'package-plus',
    editProduct: 'package-check',
    inventory: 'boxes',
  },

  // ─────────────────────────────────────────
  // 4. ADMIN DASHBOARD
  // ─────────────────────────────────────────
  admin: {
    dashboard: 'layout-dashboard',
    analytics: 'bar-chart-3',
    statistics: 'pie-chart',
    revenue: 'trending-up',
    money: 'banknote',
    users: 'users',
    userManagement: 'users-round',
    products: 'package',
    orders: 'clipboard-list',
    orderHistory: 'history',
    notifications: 'bell',
    notificationDot: 'bell-dot',
    validation: 'check-circle',
    approval: 'thumbs-up',
    rejection: 'thumbs-down',
    reject: 'x-circle',
    settings: 'settings',
    config: 'wrench',
    security: 'shield',
    logs: 'file-text',
    reports: 'file-bar-chart',
    export: 'download',
    import: 'upload',
  },

  // ─────────────────────────────────────────
  // 5. STATUS & UI ELEMENTS
  // ─────────────────────────────────────────
  status: {
    new: 'sparkle',
    newBadge: 'badge',
    promotion: 'percent',
    discount: 'tag',
    sale: 'tags',
    limitedStock: 'alert-triangle',
    outOfStock: 'package-x',
    inStock: 'package-check',
    bestseller: 'trophy',
    trending: 'flame',
    premium: 'crown',
    exclusive: 'star',
    featured: 'award',
    expired: 'timer-off',
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-circle',
    info: 'info',
    loading: 'loader-2',
    verified: 'badge-check',
  },

  // ─────────────────────────────────────────
  // 6. E-COMMERCE ACTIONS
  // ─────────────────────────────────────────
  ecommerce: {
    addToCart: 'shopping-cart',
    removeFromCart: 'trash-2',
    checkout: 'credit-card',
    payment: 'wallet',
    shipping: 'truck',
    delivery: 'package',
    tracking: 'map-pin',
    address: 'map',
    invoice: 'receipt',
    gift: 'gift',
    giftCard: 'ticket',
    coupon: 'ticket-percent',
    returns: 'rotate-ccw',
    refund: 'undo-2',
    compare: 'git-compare',
    quickView: 'maximize',
  },

  // ─────────────────────────────────────────
  // 7. COMMUNICATION
  // ─────────────────────────────────────────
  communication: {
    message: 'message-circle',
    messages: 'messages-square',
    chat: 'message-square',
    email: 'mail',
    phone: 'phone',
    contact: 'contact',
    support: 'headphones',
    help: 'help-circle',
    faq: 'circle-help',
    send: 'send',
    reply: 'reply',
  },

  // ─────────────────────────────────────────
  // 8. SOCIAL & SHARING
  // ─────────────────────────────────────────
  social: {
    share: 'share-2',
    facebook: 'facebook',
    twitter: 'twitter',
    instagram: 'instagram',
    linkedin: 'linkedin',
    youtube: 'youtube',
    pinterest: 'pin',
    whatsapp: 'message-circle',
    link: 'link',
    qrCode: 'qr-code',
  },

  // ─────────────────────────────────────────
  // 9. RATING & REVIEWS
  // ─────────────────────────────────────────
  ratings: {
    star: 'star',
    starFilled: 'star',
    starHalf: 'star-half',
    review: 'message-square-text',
    thumbUp: 'thumbs-up',
    thumbDown: 'thumbs-down',
    recommend: 'heart-handshake',
  },

  // ─────────────────────────────────────────
  // 10. TIME & DATE
  // ─────────────────────────────────────────
  time: {
    calendar: 'calendar',
    calendarDays: 'calendar-days',
    clock: 'clock',
    timer: 'timer',
    history: 'history',
    schedule: 'calendar-clock',
  }
};

// ============================================
// ICON HELPER FUNCTIONS
// ============================================

/**
 * Get Lucide icon HTML with luxury styling
 * @param {string} iconName - The Lucide icon name
 * @param {object} options - Styling options
 * @returns {string} HTML string for the icon
 */
function getIcon(iconName, options = {}) {
  const {
    size = 24,
    className = '',
    color = 'currentColor',
    strokeWidth = 1.5,
    ariaLabel = '',
    ariaHidden = true
  } = options;

  const classes = ['aurum-icon', className].filter(Boolean).join(' ');
  const ariaAttrs = ariaHidden 
    ? 'aria-hidden="true"' 
    : `aria-label="${ariaLabel}" role="img"`;

  return `<i data-lucide="${iconName}" 
    class="${classes}" 
    style="width:${size}px;height:${size}px;stroke-width:${strokeWidth};color:${color};" 
    ${ariaAttrs}></i>`;
}

/**
 * Get navigation icon
 * @param {string} name - Icon name from navigation set
 * @param {object} options - Styling options
 */
function getNavIcon(name, options = {}) {
  const iconName = AurumIcons.navigation[name] || 'circle';
  return getIcon(iconName, { className: 'nav-icon', ...options });
}

/**
 * Get category icon
 * @param {string} category - Category name
 * @param {object} options - Styling options
 */
function getCatIcon(category, options = {}) {
  const iconName = AurumIcons.categories[category] || AurumIcons.categories.default;
  return getIcon(iconName, { className: 'category-icon', ...options });
}

/**
 * Get seller/boutique icon
 * @param {string} name - Icon name from seller set
 * @param {object} options - Styling options
 */
function getSellerIcon(name, options = {}) {
  const iconName = AurumIcons.seller[name] || 'store';
  return getIcon(iconName, { className: 'seller-icon', ...options });
}

/**
 * Get admin icon
 * @param {string} name - Icon name from admin set
 * @param {object} options - Styling options
 */
function getAdminIcon(name, options = {}) {
  const iconName = AurumIcons.admin[name] || 'settings';
  return getIcon(iconName, { className: 'admin-icon', ...options });
}

/**
 * Get status icon
 * @param {string} name - Icon name from status set
 * @param {object} options - Styling options
 */
function getStatusIcon(name, options = {}) {
  const iconName = AurumIcons.status[name] || 'info';
  return getIcon(iconName, { className: 'status-icon', ...options });
}

/**
 * Get e-commerce action icon
 * @param {string} name - Icon name from ecommerce set
 * @param {object} options - Styling options
 */
function getEcommerceIcon(name, options = {}) {
  const iconName = AurumIcons.ecommerce[name] || 'shopping-cart';
  return getIcon(iconName, { className: 'ecommerce-icon', ...options });
}

/**
 * Create a badge with icon
 * @param {string} iconName - Lucide icon name
 * @param {string} text - Badge text
 * @param {string} type - Badge type (new, promo, premium, etc.)
 */
function createBadge(iconName, text, type = 'default') {
  return `
    <span class="aurum-badge aurum-badge--${type}">
      ${getIcon(iconName, { size: 14, strokeWidth: 2 })}
      <span class="aurum-badge__text">${text}</span>
    </span>
  `;
}

/**
 * Create product status badge
 * @param {string} status - Product status
 */
function getProductBadge(status) {
  const badges = {
    new: { icon: 'sparkle', text: 'Nouveau', type: 'new' },
    promo: { icon: 'percent', text: 'Promo', type: 'promo' },
    bestseller: { icon: 'trophy', text: 'Bestseller', type: 'bestseller' },
    premium: { icon: 'crown', text: 'Premium', type: 'premium' },
    exclusive: { icon: 'star', text: 'Exclusif', type: 'exclusive' },
    limited: { icon: 'alert-triangle', text: 'Stock limité', type: 'warning' },
    outOfStock: { icon: 'package-x', text: 'Rupture', type: 'error' },
  };
  
  const badge = badges[status];
  if (!badge) return '';
  
  return createBadge(badge.icon, badge.text, badge.type);
}

/**
 * Initialize Lucide icons after DOM update
 */
function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ============================================
// ICON BUTTON COMPONENTS
// ============================================

/**
 * Create an icon button
 * @param {string} iconName - Lucide icon name
 * @param {object} options - Button options
 */
function createIconButton(iconName, options = {}) {
  const {
    label = '',
    title = '',
    href = '',
    className = '',
    size = 20,
    variant = 'ghost', // ghost, outline, solid, gold
    onClick = '',
  } = options;

  const tag = href ? 'a' : 'button';
  const hrefAttr = href ? `href="${href}"` : '';
  const onClickAttr = onClick ? `onclick="${onClick}"` : '';
  const classes = `aurum-icon-btn aurum-icon-btn--${variant} ${className}`.trim();

  return `
    <${tag} ${hrefAttr} ${onClickAttr} 
      class="${classes}" 
      title="${title || label}" 
      aria-label="${label}">
      ${getIcon(iconName, { size, strokeWidth: 1.75 })}
      ${label ? `<span class="aurum-icon-btn__label">${label}</span>` : ''}
    </${tag}>
  `;
}

// ============================================
// QUICK ACCESS ICONS (Most Used)
// ============================================

const QuickIcons = {
  // Navigation shortcuts
  home: () => getNavIcon('home'),
  search: () => getNavIcon('search'),
  cart: () => getNavIcon('cart'),
  wishlist: () => getNavIcon('wishlist'),
  user: () => getNavIcon('user'),
  menu: () => getNavIcon('menu'),
  close: () => getNavIcon('close'),
  back: () => getNavIcon('back'),
  
  // Status shortcuts
  success: () => getStatusIcon('success', { color: 'var(--success)' }),
  error: () => getStatusIcon('error', { color: 'var(--danger)' }),
  warning: () => getStatusIcon('warning', { color: 'var(--warning)' }),
  info: () => getStatusIcon('info', { color: 'var(--gold)' }),
  
  // E-commerce shortcuts
  addToCart: () => getEcommerceIcon('addToCart'),
  checkout: () => getEcommerceIcon('checkout'),
  shipping: () => getEcommerceIcon('shipping'),
  
  // Seller shortcuts
  store: () => getSellerIcon('store'),
  verified: () => getSellerIcon('verified', { color: 'var(--success)' }),
  pending: () => getSellerIcon('pending', { color: 'var(--warning)' }),
  
  // Rating
  star: (filled = false) => getIcon('star', { 
    className: filled ? 'star-filled' : 'star-empty',
    color: 'var(--gold)'
  }),
};

// Export for global use
window.AurumIcons = AurumIcons;
window.getIcon = getIcon;
window.getNavIcon = getNavIcon;
window.getCatIcon = getCatIcon;
window.getSellerIcon = getSellerIcon;
window.getAdminIcon = getAdminIcon;
window.getStatusIcon = getStatusIcon;
window.getEcommerceIcon = getEcommerceIcon;
window.createBadge = createBadge;
window.getProductBadge = getProductBadge;
window.createIconButton = createIconButton;
window.refreshIcons = refreshIcons;
window.QuickIcons = QuickIcons;

console.log('✨ AURUM Luxury Icon System loaded');
