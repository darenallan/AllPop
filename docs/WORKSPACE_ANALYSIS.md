# AurumCorp Workspace Analysis Report
**Generated:** March 14, 2026  
**Purpose:** Comprehensive structure analysis for modularization planning

---

## 1. ROOT-LEVEL HTML FILES

### Summary
**Total HTML pages:** 27 files  
**Primary categories:**
- E-commerce pages (product, cart, catalogue, wishlist)
- Authentication pages (login, register)
- Seller/Admin pages (seller, admin, seller-application)
- Information pages (about, contact, help/FAQ)
- Utility pages (404, invoice, delivery, messages)

---

### Detailed HTML File Analysis

| File | Scripts Loaded | Purpose | Theme |
|------|---|---|---|
| **index.html** | Firebase libs, config.js, header.js, data.js (defer), app.js (defer) | Homepage with hero section, category showcase | Premium dark theme (cursor, reveal animation) |
| **404.html** | Firebase libs, header.js | Error page with 404 animation | Dark theme, minimal JS (cursor + header only) |
| **about.html** (also "apropos.html") | Firebase libs, config.js, header.js, data.js (defer), app.js (defer), styles.css | Company story, mission, stats counters from Firebase | Glass header, reveal-on-scroll |
| **admin.html** | Firebase libs (inline config/auth in `<script>`) | Admin dashboard - manages shops, users, promos, products | Inline complete auth + UI system |
| **boutique-list.html** | Firebase libs, config.js, categories.js, header.js, data.js (defer) | Shop gallery with category filtering | Marquee animation, shop cards |
| **boutique.html** | Firebase libs, config.js, header.js, categories.js, data.js | Single shop profile page with products grid | Page-specific shop data loading |
| **cart.html** | Firebase libs, config.js, header.js, data.js (defer), app.js (defer) | Shopping cart with promo codes, checkout prep | Scoped CSS (#ct namespace) |
| **catalogue.html** | Firebase libs, config.js, categories.js, header.js, data.js (defer) | Product listing with sidebar filters | Sidebar with search/filters, reveal animations |
| **contact.html** | Firebase libs, config.js, header.js, app.js (defer) | Contact form with email/phone info | Scoped CSS (#ct namespace), form submission |
| **delivery.html** | Firebase (inline config) | Delivery dashboard for couriers | Guarded wall pattern, tab navigation |
| **invoice.html** | Firebase libs, html2canvas, jsPDF, config.js, header.js, data.js (defer), app.js (defer) | Invoice generation & PDF export | PDF export functionality |
| **login.html** | Firebase libs, config.js, header.js, app.js (defer) | Authentication form | Scoped CSS (#lg namespace), form handling |
| **messages.html** | Firebase libs, config.js, header.js, data.js (defer), messaging.js (defer) | Messaging inbox/chat interface | Real-time Firestore chat |
| **product.html** (produit.html) | Firebase libs, config.js, header.js, data.js (defer), messaging.js (defer) | Single product page with images, reviews, messaging | Product detail layout, messaging sidebar |
| **profile.html** | Firebase libs, config.js, header.js, data.js (defer), app.js (defer), messaging.js (defer) | User profile dashboard | Dynamic hero with initials watermark |
| **register.html** | Firebase libs, config.js, header.js, app.js (defer) | Registration form | Scoped CSS (#rg namespace), form handling |
| **seller.html** | Firebase libs (4 modules), config.js, header.js, data.js (defer), app.js (defer), messaging.js (defer) | Seller dashboard with sidebar | Scoped CSS (#sd namespace), grid layout |
| **seller-application.html** | Firebase libs, config.js, header.js, app.js (defer) | Seller onboarding form with multi-step progress | Progress bar, form sections (§17 in prime.js) |
| **seller-onboarding.html** | Firebase libs, similar to seller-application | Alternative seller onboarding flow | Seller-specific UX |
| **wishlist.html** | Firebase libs, config.js, header.js, data.js (defer), app.js (defer) | Saved favorites list | Scoped CSS (#wl namespace) |
| **privacy.html** | Firebase libs, config.js, header.js, app.js (defer) | Privacy policy page | Information page |
| **A.html** | Firebase libs, config.js, header.js, app.js (defer) | Help/FAQ/Legal (Aide, CGU, Mentions légales) | Tabs interface, FAQ accordion (§3 in prime.js) |
| **theking.html** | (needs inspection) | Debug/test page | Unknown purpose |
| **test-firestore-debug.html** | (needs inspection) | Firestore testing utility | Dev only |
| **boutique-list.html** | Duplicate or variant | Shop browsing | - |
| **delivery.html** | Courier dashboard | Delivery tracking | Guarded access |
| **messages.html** | Messaging hub | User chats | Real-time |

---

## 2. JAVASCRIPT FILES ARCHITECTURE

### File Overview

```
assets/js/
├── config.js                  ← [LOAD FIRST] Firebase init, Auth, Utils
├── components/
│   └── header.js             ← Universal header component (injected)
├── footer.js                 ← Universal footer component (injected)
├── categories.js             ← Category cascade system
├── data.js                   ← Demo data for dev environment
├── app.js                    ← Core app logic (cart, wishlist, products)
├── admin.js                  ← Seller dashboard functions
├── messaging.js              ← Chat/messaging real-time sync
├── delivery.js               ← Courier dashboard (inline in delivery.html)
├── debug-menu.js             ← Debug utilities (optional)
├── prime.js                  ← Page-specific logic by §0-§20
└── prime-new.js              ← Alternative version
```

---

## 3. GLOBAL VS PAGE-SPECIFIC FUNCTIONALITY

### GLOBAL (Loaded on Most Pages)

#### **config.js** - Core Global Module
**Executes immediately (not deferred)**

| Function/Feature | Purpose | Global? |
|---|---|---|
| `firebase.initializeApp()` | Firebase initialization | YES |
| `window.auth` | Firebase Auth reference | YES |
| `window.db` | Firestore reference | YES |
| `window.Store` | Fallback data object | YES |
| `window.Auth.register()` | User registration | YES |
| `window.Auth.login()` | User login | YES |
| `window.Auth.logout()` | User logout | YES |
| `window.syncCurrentUser()` | Sync current user to localStorage | YES |
| `window.formatFCFA()` | Currency formatter (FCFA) | YES |
| `window.formatDate()` | Date formatter (fr-FR) | YES |
| `window.showToast()` | Toast notifications | YES |
| `window.copyToClipboard()` | Clipboard copy utility | YES |
| `window.updateCartBadge()` | Cart count update | YES |

#### **header.js** - Universal Header Component
**Injected into `<div id="header-placeholder"></div>`**

| Feature | Global? |
|---|---|
| Logo + navigation | YES |
| Cart icon + badge | YES |
| Mobile menu (burger) | YES |
| User profile dropdown | YES |
| Dark/light theme switch via `data-theme` | YES |
| Cursor ring animation (supports all prefixes) | YES |
| Scroll-triggered glass effect | YES |
| Newsletter subscription | YES |

**Functions Exported:**
- `window.refreshCartCount()` - Update cart badge
- `window.refreshMsgBadge()` - Update message count

#### **footer.js** - Universal Footer Component  
**Injected before `</body>`**

| Feature | Global? |
|---|---|
| Brand section | YES |
| Links (Help, Legal, etc.) | YES |
| Social media links | YES |
| Newsletter form | YES |
| Dynamic copyright year | YES |

#### **prime.js §0-§1** - Cursor + Reveal Animation
**Loaded on most pages**

| §0 - Cursor Animation | §1 - Reveal on Scroll |
|---|---|
| Supports multiple cursor prefixes (cur-, bp-, ct-, lg-, pr-, rg-, wl-, sd-, dv-) | Observes all `.rv` elements |
| Toggles hover states on interactive elements | Adds `.on` class at 8% intersection |
| Smooth easing with requestAnimationFrame | Cascade delays (rv1-rv5) for staggered effect |
| Z-index 99999 | Typical 0.85-0.9s duration |

---

### PAGE-SPECIFIC (Conditional or Deferred Loading)

#### **app.js** - Client-Facing Commerce Logic
**Loaded deferred on:** index, about, cart, contact, login, messages, product, profile, register, seller, wishlist

**Functions:**
| Function | Purpose | Pages |
|---|---|---|
| `getCartItems()` | Fetch cart from localStorage | Multiple |
| `addToCart(productId, qty, productObj)` | Add to cart with validation | product, catalogue |
| `updateCartQty(productId, newQty)` | Modify quantity | cart |
| `removeFromCart(productId)` | Delete item | cart |
| `clearCart()` | Empty cart | cart |
| `isInWishlist(productId)` | Check favorited status | Multiple |
| `toggleWishlist(productId)` | Add/remove favorite | product, catalogue, boutique |
| `clearWishlist()` | Empty favorites | wishlist |
| `loadProducts()` | Fetch from Firestore (limit 8) | index |
| `initCart()` | Cart page render + summary | cart |
| `initCheckout()` | Handles payment/order | cart |
| **Promo code logic** | Apply discount codes | cart |

---

#### **admin.js** - Seller Dashboard
**Loaded deferred on:** seller, seller-onboarding

**Key Functions:**
| Function | Purpose |
|---|---|
| `nav(tabId, btn)` → `window.navigateSellerTab()` | Tab navigation |
| `compressImageToBase64()` | Image compression for logo/banner/products |
| `setupProductUpload()` | Drag-drop file handler |
| `handleProductFiles()` | Process and store product images |
| `listenToSellerProducts()` | Real-time product listener (onSnapshot) |
| `loadSellerOrders(userEmail)` | Fetch seller's orders from Firestore |
| `updateShopUI(shop)` | Populate shop form fields |
| `setupProfileUpload()` | Logo/banner upload handlers |

**Key State:**
```javascript
let currentShop     = null;
let currentProducts = [];
let productImages   = [];
let logoBase64      = '';
let bannerBase64    = '';
let _unsubProducts  = null; // Cleanup listener
```

---

#### **categories.js** - Category System  
**Loaded on:** boutique-list, boutique, seller-application, catalogue

**Exports:**
| Export | Type | Purpose |
|---|---|---|
| `window.aurumCategories` | Object | Hierarchical category tree (3 levels) |
| `window.shopCategoryToProductCategories` | Mapping | Shop category → allowed product categories |
| `window.getAllowedProductCategories(shopCat)` | Function | Get products allowed in shop |
| `window.initCategoryCascade(opts)` | Function | Render 3-level select dropdowns |

**Example hierarchy:**
```
Mode
├── Homme [T-shirts, Chemises, Pantalons, ...]
├── Femme [Robes, Tops, ...]
├── Enfant [Fille, Garçon, Bébé]
└── Accessoires [Ceintures, Chapeaux, ...]
```

---

#### **messaging.js** - Real-Time Chat
**Loaded deferred on:** product, profile, seller, messages

**Key Functions:**
| Function | Purpose |
|---|---|
| `openSellerChat(shopInfo)` | Open chat with seller |
| `subscribeUserChats()` | Listen to user's conversations |
| `sendMessage(chatId, text)` | Send chat message |
| `sanitizeMessage(text)` | Mask phone/email in messages |
| `buildChatId(buyerId, sellerId, shopId)` | Generate unique chat ID |
| `resolveSellerIdFromShop(shopId)` | Get seller UID from shop data |

**Security Feature:** Contact info (phone, email) masked in messages

---

#### **data.js** - Development Demo Data
**Loaded deferred on:** Most pages (auto-disabled in production)

**Features:**
- Detects production vs. dev environment (localhost check)
- Hydrates `window.Store` with demo products/shops/users
- Persists to localStorage for session consistency
- Quality gate: version tracking to clear outdated data

---

#### **delivery.js** - Courier Dashboard
**Inline in delivery.html**

**Key Features:**
- Guarded "wall" pattern (courier role check)
- Tab navigation (pending, history, profile)
- Toast notifications
- Date display (fr-FR format)
- Real-time access control

---

### PRIME.JS - Page-Specific Logic by Section (§0-§20)

| §# | Page | Logic | Key Features |
|---|---|---|---|
| §0 | (All) | Cursor animation | Multi-prefix support, smooth easing |
| §1 | (All) | Reveal animation | IntersectionObserver, .rv class |
| §2 | 404.html | (None) | Uses §0-§1 only |
| §3 | A.html (Aide) | Tab switching + FAQ accordion | Smooth max-height animation |
| §4 | about.html | Counter animation from Firebase | Loads product/shop counts |
| §5 | boutique-list.html | Shop grid rendering + category filter | Firebase query, fallback data |
| §6 | boutique.html | Single shop profile + products | Dynamic product loading |
| §7 | cart.html | Checkout flow (legacy) | Promo validation, summary calc |
| §8 | catalogue.html | (Managed by header/app.js) | - |
| §9 | contact.html | (Form handled by app.js) | - |
| §10 | delivery.html | Courier dashboard | Guarded access, tab nav |
| §11 | index.html | Hero animations, featured products | Scroll triggers, product grid |
| §12 | login.html | Auth form submission | Firebase auth integration |
| §13 | messages.html | Chat interface | Real-time Firestore sync |
| §14 | produit.html | Product detail page | Dynamic product load, images, messaging |
| §15 | profile.html | User profile dashboard | Dynamic watermark (user initials) |
| §16 | register.html | Registration form | Auth + user profile creation |
| §17 | seller-application.html | Multi-step form with progress | Progress bar, form sections |
| §18 | seller-onboarding.html | Alternative onboarding | Similar to §17 |
| §19 | seller.html | (Handled by admin.js) | Sidebar, tab nav |
| §20 | wishlist.html | Favorite products grid | Display saved items |

---

## 4. DATA FLOW & DEPENDENCIES

### Load Order (Critical)

```
1. Firebase libs (async)
2. config.js     (immediate - sets up window.auth, window.db)
3. components/header.js (deferred - injects header)
4. footer.js            (deferred - injects footer)
5. categories.js        (if page needs it)
6. data.js              (deferred - dev demo data)
7. messaging.js         (if page has chat)
8. app.js               (deferred - commerce logic)
9. admin.js             (if seller page)
10. prime.js            (deferred - page-specific + cursor + reveal)
```

### State Management

**LocalStorage Keys:**
- `ac_cart` - Shopping cart items
- `ac_wishlist` - Favorite product IDs
- `ac_currentUser` - Current logged-in user
- `ac_users` - Demo user list
- `ac_shops` - Demo shops
- `ac_products` - Demo products
- `ac_orders` - Demo orders
- `ac_promos` - Available promo codes
- `ac_data_version` - Demo data version lock

**Global Objects:**
- `window.auth` - Firebase Auth
- `window.db` - Firestore instance
- `window.Store` - In-memory demo store
- `window.allProducts` - Cached product list
- `window.currentProduct` - Current product detail page
- `window.currentUser` - Current user (from sync)

---

## 5. GLOBAL FUNCTIONALITY MATRIX

| Feature | config.js | header.js | footer.js | prime.js | Shared | Page-Specific |
|---|---|---|---|---|---|---|
| Firebase init | ✅ | - | - | - | Core | - |
| User auth | ✅ | ✅ (dropdown) | - | - | Core | app.js, admin.js |
| Cart badge | ✅ (update) | ✅ (display) | - | - | Core | - |
| Cursor ring | - | ✅ (setup) | - | ✅ (animation) | User Experience | - |
| Reveal scroll | - | - | - | ✅ | User Experience | - |
| Notifications | ✅ (showToast) | - | - | - | Core | - |
| Newsletter | - | - | ✅ (form) | - | Optional | - |
| Product cart | ✅ (formatFCFA) | - | - | - | Core | app.js |
| Shop browsing | - | - | - | - | - | prime.js §5, §6 |
| Messaging | - | - | - | - | - | messaging.js |
| Admin panel | - | - | - | - | - | admin.js |

---

## 6. RECOMMENDED MODULARIZATION STRATEGY

### Current Issues to Resolve

1. **prime.js is 2000+ lines** - Split by section (§1-§20 into separate files)
2. **admin.js couples seller + delivery** - Separate seller dashboard from delivery
3. **app.js + admin.js have overlapping cart logic** - Extract cart module
4. **CSS duplication** - Each page has scoped namespace (ct, lg, rg, wl, sd) - consolidate
5. **Inline admin config in admin.html** - Move to external admin-config.js

### Proposed Modules

```
assets/js/
├── global/
│   ├── config.js          (Firebase, Auth, Utils) ✅ KEEP
│   ├── constants.js       (NEW) - FCFA format, colors, configs
│   └── utils.js           (NEW) - Shared helpers
├── components/
│   ├── header.js          ✅ KEEP (but extract cursor logic)
│   ├── footer.js          ✅ KEEP
│   └── cursor.js          (NEW) - Global cursor animation
├── core/
│   ├── auth.js            (EXTRACT from config.js)
│   ├── cart.js            (EXTRACT from app.js)
│   ├── wishlist.js        (EXTRACT from app.js)
│   ├── products.js        (EXTRACT from app.js)
│   └── categories.js      ✅ KEEP
├── features/
│   ├── messaging.js       ✅ KEEP
│   ├── delivery.js        (EXTRACT from delivery.html)
│   ├── seller-dashboard.js (EXTRACT from admin.js)
│   └── admin-panel.js     (EXTRACT admin.js)
├── animations/
│   ├── reveal-scroll.js   (NEW - EXTRACT from prime.js §1)
│   └── transitions.js     (NEW)
└── pages/
    ├── page-home.js       (prime.js §11)
    ├── page-product.js    (prime.js §14)
    ├── page-cart.js       (prime.js §7)
    ├── page-catalogue.js  (prime.js §8)
    ├── page-boutique.js   (prime.js §6)
    ├── page-seller-app.js (prime.js §17)
    ├── page-faq.js        (prime.js §3)
    ├── page-aboutous.js   (prime.js §4)
    └── ... (others)
```

---

## 7. SECURITY & PERFORMANCE NOTES

### Auth Gates
- **deliveryhtml**: Guarded wall pattern (courier role check)
- **admin.html**: Inline check for `aurumcorporate.d@gmail.com`
- **seller.html**: Role-based access (admin/seller/maintainer)

### Image Optimization
- admin.js compresses to WebP (fallback JPEG)
- Canvas resize + quality control (0.4-0.85)
- Recursive recompression if > 900 KB

### Data Sanitization
- messaging.js masks phone/email in chat
- Regex patterns detect and replace contact info
- Prevents seller/buyer contact exchange in messages

### Performance Optimizations
- LocalStorage cache (products, cart, wishlist)
- Demo data version checking (prevents stale data)
- Deferred script loading (app.js, prime.js, data.js)
- Lazy image loading (loading="lazy" on product images)
- IntersectionObserver for reveal animation

---

## 8. QUICK REFERENCE: FUNCTION LOCATIONS

| Function | File | Type |
|---|---|---|
| `showToast()` | config.js | Global Toast |
| `formatFCFA()` | config.js | Formatter |
| `Auth.login()` | config.js | Auth |
| `Auth.register()` | config.js | Auth |
| `refreshCartCount()` | header.js | Header |
| `initCategoryCascade()` | categories.js | UI |
| `openSellerChat()` | messaging.js | Chat |
| `sanitizeMessage()` | messaging.js | Security |
| `navTo()` / `nav()` | admin.js | Navigation |
| `addToCart()` | app.js | Commerce |
| `toggleWishlist()` | app.js | Commerce |
| `initCart()` | app.js | Cart Page |
| `compressImageToBase64()` | admin.js | Image |
| `initCursor()` | prime.js §0 | Animation |
| `initReveal()` | prime.js §1 | Animation |

---

## 9. CSS ARCHITECTURE

### Design System (Global)
Located in: `assets/css/styles.css`, `aurum-light.css`, `prime.css`

**Color Variables (root):**
```css
--ink: #0B0A08
--gold: #C8A84B
--smoke: #7A7570
--white: #FEFCF8
--danger: #D94F4F
--ok: #4A9E72
```

**Scoped Namespaces (Per Page):**
- `#bp-*` - Boutique profile
- `#ct-*` - Contact/Cart
- `#lg-*` - Login
- `#rg-*` - Register
- `#wl-*` - Wishlist
- `#sd-*` - Seller dashboard
- `#dv-*` - Delivery
- `#pr-*` - Product detail
- `#ab-*` - About/Apropos
- `#hl-*` - Help/FAQ (A.html)
- `#sa-*` - Seller application

---

## 10. FINAL SUMMARY TABLE

| Aspect | Count | Status |
|---|---|---|
| Total HTML files | 27 | ✅ Comprehensive |
| Core JS modules | 10 | ⚠ Could be split |
| Global functions | ~30 | ✅ Well-organized |
| Page-specific logic | 20 sections (prime.js) | ⚠ Needs modularization |
| CSS variables | ~20 | ✅ Consistent |
| Scoped namespaces | 12 | ✅ Good isolation |
| Firestore collections | 8+ | ✅ Firebase-native |
| LocalStorage keys | 8 | ✅ Clear naming |
| Auth methods | 4 main | ✅ Secure |
| Image formats | WebP + JPEG | ✅ Modern |

---

## CONCLUSION

The AurumCorp codebase is **well-structured but monolithic**. The main opportunities for modularization are:

1. **Extract prime.js sections** into individual page modules
2. **Split admin.js** into seller-dashboard + admin-panel
3. **Extract cart logic** from app.js into standalone module
4. **Consolidate CSS** scoped namespaces into reusable components
5. **Extract global utilities** (cursor, reveal, animations) into separate files

**Recommended approach:** Use the proposed modulea structure above as a blueprint while maintaining backward compatibility by keeping current file names as entry points that re-export from new modules.
