/* Debug Menu Burger */
console.log('🔍 DEBUG Menu Burger');

// Vérifier que les éléments existent
console.log('Vérification des éléments DOM:');
console.log('- #menu-toggle:', document.getElementById('menu-toggle') ? '✅ OK' : '❌ MANQUANT');
console.log('- #close-btn:', document.getElementById('close-btn') ? '✅ OK' : '❌ MANQUANT');
console.log('- #mobile-drawer:', document.getElementById('mobile-drawer') ? '✅ OK' : '❌ MANQUANT');
console.log('- #menu-overlay:', document.getElementById('menu-overlay') ? '✅ OK' : '❌ MANQUANT');

// Vérifier que setupMobileMenu existe
console.log('\nVérification des fonctions:');
console.log('- setupMobileMenu():', typeof setupMobileMenu === 'function' ? '✅ OK' : '❌ MANQUANT');
console.log('- setupAuthUI():', typeof setupAuthUI === 'function' ? '✅ OK' : '❌ MANQUANT');

// Test du toggle
document.addEventListener('DOMContentLoaded', () => {
    console.log('\n🚀 DOMContentLoaded - setupMobileMenu() appelée');
    const btn = document.getElementById('menu-toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            console.log('📌 Click sur menu-toggle');
            const drawer = document.getElementById('mobile-drawer');
            console.log('- État drawer:', drawer?.classList.contains('active') ? 'OUVERT' : 'FERMÉ');
        });
    }
});
