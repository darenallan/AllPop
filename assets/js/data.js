
// Version des données de démo (incrémenter pour forcer un refresh)
const DATA_VERSION = 12;

// Vérifier si on doit réinitialiser les données
const storedVersion = parseInt(localStorage.getItem('ac_data_version') || '0', 10);
const needsReset = storedVersion < DATA_VERSION;
if (needsReset) {
  // Supprimer les anciennes données pour forcer le rechargement
  localStorage.removeItem('ac_products');
  localStorage.removeItem('ac_shops');
  localStorage.removeItem('ac_invoices');
  localStorage.setItem('ac_data_version', DATA_VERSION.toString());
}

// Données de démonstration + stockage local
const Store = {
  users: JSON.parse(localStorage.getItem('ac_users')||'[]'),
  shops: JSON.parse(localStorage.getItem('ac_shops')||'[]'),
  products: JSON.parse(localStorage.getItem('ac_products')||'[]'),
  orders: JSON.parse(localStorage.getItem('ac_orders')||'[]'),
  invoices: JSON.parse(localStorage.getItem('ac_invoices')||'[]'),
  categories: ['Mode & Vêtements','Beauté, Hygiène & Bien-être','Électronique, Téléphonie & Informatique','Maison, Meubles & Décoration','Bâtiment, Quincaillerie & Matériaux','Véhicules & Mobilité','Restauration & Boissons'],
  // Sous-catégories Mode & Vêtements
  modeSubcategories: ['Streetwear','Luxueux','Accessoires','Chaussures','Homme','Femme','Enfant'],
  // Catégories principales pour les boutiques (avec possibilité de sous-catégories futures)
  // lucideIcon = nom de l'icône Lucide, icon = emoji fallback
  shopCategories: [
    { id: 'mode', name: 'Mode & Vêtements', lucideIcon: 'shirt', icon: '👗', subcategories: ['Streetwear','Luxueux','Accessoires','Chaussures','Homme','Femme','Enfant'] },
    { id: 'beaute', name: 'Beauté, Hygiène & Bien-être', lucideIcon: 'sparkles', icon: '🧴', subcategories: ['Parfum','Soin visage','Soin corps','Maquillage','Hygiène','Cheveux','Bien-être'] },
    { id: 'electronique', name: 'Électronique, Téléphonie & Informatique', lucideIcon: 'smartphone', icon: '📱', subcategories: ['Smartphone','Tablette','Ordinateur','Accessoire','Audio','TV & Écran','Console & Gaming'] },
    { id: 'maison', name: 'Maison, Meubles & Décoration', lucideIcon: 'home', icon: '🏠', subcategories: ['Canapé & Fauteuil','Lit & Matelas','Table & Chaise','Rangement','Luminaire','Décoration','Cuisine'] },
    { id: 'batiment', name: 'Bâtiment, Quincaillerie & Matériaux', lucideIcon: 'hammer', icon: '🏗️', subcategories: ['Ciment & Béton','Fer & Métaux','Bois & Menuiserie','Peinture','Plomberie','Électricité','Outillage'] },
    { id: 'vehicules', name: 'Véhicules & Mobilité', lucideIcon: 'car', icon: '🚗', subcategories: ['Voiture','Moto','Scooter','Vélo','Pièces détachées','Accessoires auto'] },
    { id: 'restauration', name: 'Restauration & Boissons', lucideIcon: 'utensils', icon: '🍽️', subcategories: ['Africain','Fast-food','Grillades','Pizzeria','Asiatique','Pâtisserie','Café'] }
  ],
  disabledCategories: JSON.parse(localStorage.getItem('ac_disabled_categories')||'[]'),
  colors: ['Noir','Blanc','Or','Bleu nuit','Rouge'],
  sizes: ['XS','S','M','L','XL','XXL'],
  // Sous-catégories Beauté
  beautyTypes: ['Parfum','Soin visage','Soin corps','Maquillage','Hygiène','Cheveux','Bien-être'],
  skinTypes: ['Tous types','Peau sèche','Peau grasse','Peau mixte','Peau sensible'],
  beautyBrands: ['Aurum Beauty','Shea Moisture','Nivea','Dove','L\'Oréal','Maybelline','Garnier'],
  // Sous-catégories Électronique
  techTypes: ['Smartphone','Téléphone basique','Tablette','Ordinateur portable','Ordinateur bureau','Accessoire','Audio','TV & Écran','Console & Gaming','Appareil photo'],
  techCapacities: ['16 Go','32 Go','64 Go','128 Go','256 Go','512 Go','1 To','2 To'],
  techConditions: ['Neuf','Reconditionné certifié','Occasion - Comme neuf','Occasion - Bon état','Occasion - État correct'],
  techBrands: ['Samsung','Apple','Xiaomi','Huawei','Oppo','Tecno','Infinix','HP','Lenovo','Dell','Asus','Sony','JBL','LG','Autres'],
  // Sous-catégories Maison, Meubles & Décoration
  homeTypes: ['Canapé & Fauteuil','Lit & Matelas','Table & Chaise','Rangement','Luminaire','Décoration murale','Tapis & Textile','Cuisine','Salle de bain','Jardin & Extérieur'],
  homeMaterials: ['Bois massif','Bois MDF','Métal','Tissu','Cuir','Verre','Plastique','Rotin','Bambou'],
  homeDimensions: ['Petit (< 50cm)','Moyen (50-100cm)','Grand (100-150cm)','Très grand (> 150cm)'],
  homeStyles: ['Moderne','Traditionnel','Scandinave','Industriel','Bohème','Minimaliste'],
  // Sous-catégories Bâtiment, Quincaillerie & Matériaux
  btpTypes: ['Ciment & Béton','Fer & Métaux','Bois & Menuiserie','Peinture & Revêtement','Plomberie','Électricité','Outillage','Carrelage & Sols','Toiture','Quincaillerie'],
  btpUnits: ['Pièce','Kg','Sac (50kg)','Mètre','M²','M³','Litre','Rouleau','Lot','Palette'],
  btpClientTypes: ['Tous','B2B (Professionnels)','B2C (Particuliers)'],
  btpBrands: ['Cimburkina','Dangote','Diamond','Sika','Lafarge','Fischer','Bosch','Makita','Stanley','Local/Artisanal'],
  // Sous-catégories Véhicules & Mobilité
  vehicleTypes: ['Voiture','Moto','Scooter','Vélo','Camion','Utilitaire','Pièces détachées','Accessoires auto'],
  vehicleConditions: ['Neuf','Occasion - Comme neuf','Occasion - Très bon état','Occasion - Bon état','Occasion - À réviser','Pour pièces'],
  vehicleYears: Array.from({length:25}, (_,i) => (new Date().getFullYear() - i).toString()),
  vehicleFuels: ['Essence','Diesel','Électrique','Hybride','GPL','N/A'],
  vehicleTransmissions: ['Manuelle','Automatique','N/A'],
  vehicleBrands: ['Toyota','Honda','Mercedes-Benz','BMW','Peugeot','Renault','Hyundai','Kia','Suzuki','Yamaha','Piaggio','Autres'],
  // Sous-catégories Restauration & Boissons
  cuisineTypes: ['Africain','Fast-food','Grillades','Pizzeria','Asiatique','Libanais','Français','Burgers','Poulet','Pâtisserie','Jus & Smoothies','Café'],
  priceRanges: ['€ (Économique)','€€ (Modéré)','€€€ (Premium)'],
  deliveryOptions: ['Livraison','À emporter','Sur place'],
  restaurants: JSON.parse(localStorage.getItem('ac_restaurants')||'[]'),
  promos: JSON.parse(localStorage.getItem('ac_promos')||'[{"code":"AURUM10","percent":10,"expires":'+(Date.now()+7*86400000)+'}]'),
};

// Comptes de test (NE PAS utiliser en production tels quels)
const TestAccounts = {
  admin: {email:'aurumcorporate.d@gmail.com', password:'GhostAllan@2252', role:'superadmin', name:'Super Admin'},
  maint: {email:'maint@aurumcorp.local', password:'maint', role:'maintainer', name:'Maintenancier'},
  seller: {email:'vente.lll@gmail.com', password:'1234', role:'seller', name:'Vendeur Pop', shop:'popppp'},
  client: {email:'client.add@gmail.com', password:'4561', role:'client', name:'Client Démo'},
  // === COMPTES VENDEURS TEST PAR CATÉGORIE (environnement test uniquement) ===
  sellerAlimentation: {email:'alimentation@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Alimentation', shop:'test-alimentation', categoryId:'mode', category:'Mode & Accessoires'},
  sellerBeaute: {email:'beaute@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Beauté', shop:'test-beaute', categoryId:'beaute', category:'Beauté, Hygiène & Bien-être'},
  sellerElectronique: {email:'electronique@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Électronique', shop:'test-electronique', categoryId:'electronique', category:'Électronique, Téléphonie & Informatique'},
  sellerMaison: {email:'maison@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Maison', shop:'test-maison', categoryId:'maison', category:'Maison, Meubles & Décoration'},
  sellerBatiment: {email:'batiment@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Bâtiment', shop:'test-batiment', categoryId:'batiment', category:'Bâtiment, Quincaillerie & Matériaux'},
  sellerVehicules: {email:'vehicules@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Véhicules', shop:'test-vehicules', categoryId:'vehicules', category:'Véhicules & Mobilité'},
  sellerRestauration: {email:'restauration@testmarket.com', password:'test1234', role:'seller', name:'Vendeur Restauration', shop:'test-restauration', categoryId:'restauration', category:'Restauration & Boissons'},
};

// Liste des comptes vendeurs de test (pour initialisation automatique)
const TestSellerAccounts = [
  TestAccounts.sellerAlimentation,
  TestAccounts.sellerBeaute,
  TestAccounts.sellerElectronique,
  TestAccounts.sellerMaison,
  TestAccounts.sellerBatiment,
  TestAccounts.sellerVehicules,
  TestAccounts.sellerRestauration,
];

// Génération de menu pour les restaurants
function generateMenu(cuisineType, index) {
  const menus = {
    'Africain': {
      categories: [
        { name: 'Plats principaux', items: [
          { id: 'AF1', name: 'Riz gras au poulet', price: 2500, description: 'Riz parfumé avec morceaux de poulet et légumes', available: true, popular: true },
          { id: 'AF2', name: 'Tô sauce gombo', price: 1500, description: 'Tô traditionnel avec sauce gombo', available: true },
          { id: 'AF3', name: 'Poulet bicyclette braisé', price: 4500, description: 'Poulet entier braisé aux épices locales', available: true, popular: true },
          { id: 'AF4', name: 'Attieké poisson', price: 3000, description: 'Semoule de manioc avec poisson braisé', available: true },
          { id: 'AF5', name: 'Sauce arachide riz', price: 2000, description: 'Riz blanc sauce arachide et viande', available: false },
        ]},
        { name: 'Boissons', items: [
          { id: 'AFB1', name: 'Bissap', price: 500, description: 'Jus d\'hibiscus frais', available: true },
          { id: 'AFB2', name: 'Gingembre', price: 500, description: 'Jus de gingembre épicé', available: true },
          { id: 'AFB3', name: 'Zoom Koom', price: 500, description: 'Boisson au mil', available: true },
        ]},
        { name: 'Desserts', items: [
          { id: 'AFD1', name: 'Fruits de saison', price: 1000, description: 'Assortiment de fruits frais', available: true },
        ]}
      ]
    },
    'Burgers': {
      categories: [
        { name: 'Burgers', items: [
          { id: 'BU1', name: 'Classic Burger', price: 2500, description: 'Steak, salade, tomate, oignon, sauce maison', available: true, popular: true },
          { id: 'BU2', name: 'Cheese Burger', price: 3000, description: 'Double steak, double cheddar', available: true, popular: true },
          { id: 'BU3', name: 'Chicken Burger', price: 2800, description: 'Poulet croustillant, salade, mayo', available: true },
          { id: 'BU4', name: 'Veggie Burger', price: 2500, description: 'Galette de légumes, avocat, sauce verte', available: true },
        ]},
        { name: 'Accompagnements', items: [
          { id: 'BUS1', name: 'Frites maison', price: 1000, description: 'Portion de frites croustillantes', available: true },
          { id: 'BUS2', name: 'Onion Rings', price: 1200, description: 'Rondelles d\'oignon panées', available: true },
        ]},
        { name: 'Boissons', items: [
          { id: 'BUB1', name: 'Coca-Cola', price: 500, description: '33cl', available: true },
          { id: 'BUB2', name: 'Milkshake', price: 1500, description: 'Vanille, chocolat ou fraise', available: true },
        ]}
      ]
    },
    'Pizzeria': {
      categories: [
        { name: 'Pizzas', items: [
          { id: 'PZ1', name: 'Margherita', price: 4000, description: 'Tomate, mozzarella, basilic', available: true },
          { id: 'PZ2', name: 'Pepperoni', price: 5000, description: 'Tomate, mozzarella, pepperoni', available: true, popular: true },
          { id: 'PZ3', name: 'Quatre Fromages', price: 5500, description: 'Mozzarella, gorgonzola, parmesan, chèvre', available: true },
          { id: 'PZ4', name: 'Végétarienne', price: 4500, description: 'Légumes grillés, olives, mozzarella', available: true },
          { id: 'PZ5', name: 'Royale', price: 6000, description: 'Jambon, champignons, olives, poivrons', available: false },
        ]},
        { name: 'Boissons', items: [
          { id: 'PZB1', name: 'Eau minérale', price: 500, available: true },
          { id: 'PZB2', name: 'Soda', price: 700, available: true },
        ]}
      ]
    },
    'Grillades': {
      categories: [
        { name: 'Viandes grillées', items: [
          { id: 'GR1', name: 'Brochettes boeuf (6)', price: 3000, description: 'Brochettes marinées aux épices', available: true, popular: true },
          { id: 'GR2', name: 'Côtelettes agneau', price: 5000, description: 'Côtelettes grillées aux herbes', available: true },
          { id: 'GR3', name: 'Entrecôte grillée', price: 7000, description: 'Entrecôte 300g avec beurre persillé', available: true },
          { id: 'GR4', name: 'Capitaine braisé', price: 6000, description: 'Poisson entier aux épices', available: true },
        ]},
        { name: 'Accompagnements', items: [
          { id: 'GRS1', name: 'Frites', price: 1000, available: true },
          { id: 'GRS2', name: 'Salade verte', price: 800, available: true },
          { id: 'GRS3', name: 'Alloco', price: 800, description: 'Bananes plantains frites', available: true },
        ]}
      ]
    },
    'Poulet': {
      categories: [
        { name: 'Poulet', items: [
          { id: 'PL1', name: 'Poulet braisé entier', price: 5000, description: 'Poulet entier mariné et braisé', available: true, popular: true },
          { id: 'PL2', name: 'Demi poulet', price: 3000, description: 'Demi poulet braisé', available: true },
          { id: 'PL3', name: 'Cuisses (2)', price: 2500, description: '2 cuisses braisées aux épices', available: true },
          { id: 'PL4', name: 'Ailes (6)', price: 2000, description: '6 ailes croustillantes', available: true },
        ]},
        { name: 'Formules', items: [
          { id: 'PLF1', name: 'Formule complète', price: 4000, description: 'Demi poulet + frites + salade + boisson', available: true, popular: true },
        ]},
        { name: 'Accompagnements', items: [
          { id: 'PLS1', name: 'Frites', price: 1000, available: true },
          { id: 'PLS2', name: 'Attieké', price: 500, available: true },
        ]}
      ]
    },
    'Asiatique': {
      categories: [
        { name: 'Plats', items: [
          { id: 'AS1', name: 'Riz cantonais', price: 3000, description: 'Riz sauté aux légumes et oeufs', available: true, popular: true },
          { id: 'AS2', name: 'Nouilles sautées', price: 3500, description: 'Nouilles aux légumes et poulet', available: true },
          { id: 'AS3', name: 'Poulet curry', price: 4000, description: 'Poulet au curry jaune et lait de coco', available: true },
          { id: 'AS4', name: 'Boeuf sauté', price: 4500, description: 'Boeuf sauté aux oignons et poivrons', available: true },
        ]},
        { name: 'Entrées', items: [
          { id: 'ASE1', name: 'Nems (4)', price: 1500, description: 'Nems croustillants', available: true },
          { id: 'ASE2', name: 'Raviolis vapeur (6)', price: 2000, available: true },
        ]}
      ]
    },
    'Libanais': {
      categories: [
        { name: 'Mezze', items: [
          { id: 'LB1', name: 'Houmous', price: 1500, description: 'Purée de pois chiches au tahini', available: true },
          { id: 'LB2', name: 'Taboulé', price: 1800, description: 'Salade de persil et boulgour', available: true },
          { id: 'LB3', name: 'Fattouch', price: 2000, description: 'Salade libanaise au pain grillé', available: true },
        ]},
        { name: 'Grillades', items: [
          { id: 'LBG1', name: 'Chawarma poulet', price: 3500, description: 'Sandwich chawarma poulet', available: true, popular: true },
          { id: 'LBG2', name: 'Kebab mixte', price: 6000, description: 'Assortiment de viandes grillées', available: true },
          { id: 'LBG3', name: 'Falafel assiette', price: 3000, description: 'Falafels avec houmous et salade', available: true },
        ]}
      ]
    },
    'Café': {
      categories: [
        { name: 'Cafés', items: [
          { id: 'CF1', name: 'Espresso', price: 800, available: true },
          { id: 'CF2', name: 'Cappuccino', price: 1200, available: true, popular: true },
          { id: 'CF3', name: 'Café Latte', price: 1500, available: true },
          { id: 'CF4', name: 'Café glacé', price: 1800, available: true },
        ]},
        { name: 'Thés', items: [
          { id: 'CFT1', name: 'Thé vert', price: 800, available: true },
          { id: 'CFT2', name: 'Thé à la menthe', price: 1000, available: true },
        ]},
        { name: 'Pâtisseries', items: [
          { id: 'CFP1', name: 'Croissant', price: 700, available: true },
          { id: 'CFP2', name: 'Pain au chocolat', price: 800, available: true },
        ]}
      ]
    },
    'Jus & Smoothies': {
      categories: [
        { name: 'Jus frais', items: [
          { id: 'JU1', name: 'Jus d\'orange', price: 1000, description: '100% pressé', available: true, popular: true },
          { id: 'JU2', name: 'Jus mangue', price: 1000, available: true },
          { id: 'JU3', name: 'Jus ananas', price: 1000, available: true },
          { id: 'JU4', name: 'Cocktail tropical', price: 1500, description: 'Mangue, ananas, passion', available: true },
        ]},
        { name: 'Smoothies', items: [
          { id: 'JUS1', name: 'Smoothie banane', price: 1500, available: true, popular: true },
          { id: 'JUS2', name: 'Smoothie fruits rouges', price: 1800, available: true },
          { id: 'JUS3', name: 'Smoothie vert', price: 2000, description: 'Épinards, banane, pomme', available: true },
        ]}
      ]
    },
    'Pâtisserie': {
      categories: [
        { name: 'Gâteaux', items: [
          { id: 'PT1', name: 'Part de gâteau chocolat', price: 1500, available: true, popular: true },
          { id: 'PT2', name: 'Cheesecake', price: 2000, available: true },
          { id: 'PT3', name: 'Tiramisu', price: 2000, available: true },
        ]},
        { name: 'Viennoiseries', items: [
          { id: 'PTV1', name: 'Croissant beurre', price: 500, available: true },
          { id: 'PTV2', name: 'Pain au chocolat', price: 600, available: true },
          { id: 'PTV3', name: 'Chausson aux pommes', price: 700, available: true },
        ]},
        { name: 'Glaces', items: [
          { id: 'PTG1', name: '2 boules au choix', price: 1500, available: true },
          { id: 'PTG2', name: 'Coupe glacée', price: 2500, available: true },
        ]}
      ]
    },
    'Français': {
      categories: [
        { name: 'Entrées', items: [
          { id: 'FR1', name: 'Soupe à l\'oignon', price: 2500, available: true },
          { id: 'FR2', name: 'Salade niçoise', price: 3000, available: true },
        ]},
        { name: 'Plats', items: [
          { id: 'FRP1', name: 'Steak frites', price: 7500, description: 'Entrecôte 250g, frites maison', available: true, popular: true },
          { id: 'FRP2', name: 'Magret de canard', price: 9000, description: 'Avec sauce aux fruits', available: true },
          { id: 'FRP3', name: 'Filet de poisson', price: 8000, description: 'Poisson du jour grillé', available: true },
        ]},
        { name: 'Desserts', items: [
          { id: 'FRD1', name: 'Crème brûlée', price: 2500, available: true },
          { id: 'FRD2', name: 'Mousse au chocolat', price: 2000, available: true },
        ]}
      ]
    }
  };
  
  // Retourner le menu correspondant ou un menu par défaut (Africain)
  return menus[cuisineType] || menus['Africain'];
}

// Initialisation de démo
(function initDemo(){
  // Force products reset if empty or version changed
  const forceProductsReset = Store.products.length === 0 || needsReset;
  if(Store.users.length===0){
    // Ajouter tous les comptes de test y compris les vendeurs par catégorie
    Store.users = [
      TestAccounts.admin, 
      TestAccounts.maint, 
      TestAccounts.seller, 
      TestAccounts.client,
      ...TestSellerAccounts
    ];
    localStorage.setItem('ac_users', JSON.stringify(Store.users));
  }
  if(Store.shops.length===0){
    const start = Date.now();
    const oneYear = 365 * 86400000;
    Store.shops = [
      {id:'popppp', name:'popppp', description:'Boutique streetwear premium', category:'Streetwear', ownerEmail:'vente.lll@gmail.com', startDate: start, endDate: start+30*86400000, itemLimit:50, status:'active'},
      // Boutiques de test par catégorie
      {id:'test-alimentation', name:'🍎 Alimentation Test', description:'Boutique test pour la catégorie Alimentation & Épicerie', categoryId:'mode', category:'Mode & Accessoires', categoryIcon:'✨', ownerEmail:'alimentation@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
      {id:'test-beaute', name:'🧴 Beauté Test', description:'Boutique test pour la catégorie Beauté, Hygiène & Bien-être', categoryId:'beaute', category:'Beauté, Hygiène & Bien-être', categoryIcon:'🧴', ownerEmail:'beaute@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
      {id:'test-electronique', name:'📱 Électronique Test', description:'Boutique test pour la catégorie Électronique, Téléphonie & Informatique', categoryId:'electronique', category:'Électronique, Téléphonie & Informatique', categoryIcon:'📱', ownerEmail:'electronique@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
      {id:'test-maison', name:'🏠 Maison Test', description:'Boutique test pour la catégorie Maison, Meubles & Décoration', categoryId:'maison', category:'Maison, Meubles & Décoration', categoryIcon:'🏠', ownerEmail:'maison@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
      {id:'test-batiment', name:'🏗️ Bâtiment Test', description:'Boutique test pour la catégorie Bâtiment, Quincaillerie & Matériaux', categoryId:'batiment', category:'Bâtiment, Quincaillerie & Matériaux', categoryIcon:'🏗️', ownerEmail:'batiment@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
      {id:'test-vehicules', name:'🚗 Véhicules Test', description:'Boutique test pour la catégorie Véhicules & Mobilité', categoryId:'vehicules', category:'Véhicules & Mobilité', categoryIcon:'🚗', ownerEmail:'vehicules@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
      {id:'test-restauration', name:'🍽️ Restauration Test', description:'Boutique test pour la catégorie Restauration & Boissons', categoryId:'restauration', category:'Restauration & Boissons', categoryIcon:'🍽️', ownerEmail:'restauration@testmarket.com', startDate: start, endDate: start+oneYear, itemLimit:100, status:'active'},
    ];
    localStorage.setItem('ac_shops', JSON.stringify(Store.shops));
  }
  if(forceProductsReset || Store.products.length===0){
    // Images réelles (Unsplash - mode/vêtements/accessoires)
    const realImages = [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop', // T-shirt blanc
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop', // Chemise
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop', // Jean
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop', // Veste
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&h=500&fit=crop', // Robe
      'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400&h=500&fit=crop', // Accessoire
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop', // Sneakers
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop', // Veste cuir
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop', // T-shirt noir
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop', // Chemise femme
      'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400&h=500&fit=crop', // Pantalon
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=500&fit=crop', // Tenue mode
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', // Mannequin robe
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop', // Sac à dos
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=500&fit=crop', // Baskets
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop', // Sac cuir
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop', // Sweat
      'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&h=500&fit=crop', // Casquette
      'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=400&h=500&fit=crop', // Montre
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop', // Robe élégante
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=400&h=500&fit=crop', // Lunettes
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=500&fit=crop', // Chaussures cuir
      'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=500&fit=crop', // Polo
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&h=500&fit=crop', // T-shirt coloré
    ];
    const productNames = [
      'T-Shirt Premium Blanc',
      'Chemise Élégante',
      'Jean Slim Noir',
      'Veste Urbaine',
      'Robe Chic',
      'Sac Bandoulière Or',
      'Sneakers Street Gold',
      'Blouson Cuir Luxe',
      'T-Shirt Noir Classic',
      'Blouse Femme Satin',
      'Pantalon Cargo',
      'Ensemble Mode Urbain',
      'Robe de Soirée',
      'Sac à Dos Premium',
      'Baskets Running',
      'Sacoche Cuir Marron',
      'Sweat à Capuche',
      'Casquette Street',
      'Montre Dorée Luxe',
      'Robe Longue Élégante',
      'Lunettes de Soleil',
      'Mocassins Cuir',
      'Polo Classic Fit',
      'T-Shirt Imprimé Art'
    ];
    const prices = [12500, 18900, 22500, 35000, 28000, 15000, 42000, 89000, 9500, 24000, 19500, 45000, 55000, 32000, 38000, 27000, 16500, 8500, 125000, 62000, 18000, 75000, 14500, 11000];
    const demo = Array.from({length:24}).map((_,i)=>({
      id:'P'+(i+1), 
      name: productNames[i], 
      price: prices[i], 
      stock: 10 + Math.floor(Math.random()*40), 
      color: ['Noir','Or','Bleu nuit','Blanc','Rouge','Marron','Gris'][i%7], 
      size: ['XS','S','M','L','XL','XXL'][i%6],
      category: Store.categories[i%Store.categories.length], 
      images:[realImages[i]],
      shopId:'popppp', 
      rating: (4 + Math.random()*0.9).toFixed(1), 
      reviews:[
        {user:'Client Démo', comment:'Excellent produit !', stars:5},
        {user:'Amara K.', comment:'Très bonne qualité', stars:4},
        {user:'Fatou S.', comment:'Livraison rapide', stars:5}
      ],
      views: Math.floor(Math.random()*800), 
      wishlist: Math.floor(Math.random()*100), 
      sales: Math.floor(Math.random()*60)
    }));
    
    // Produits Beauté, Hygiène & Bien-être
    const beautyImages = [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop', // Parfum
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop', // Maquillage
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=500&fit=crop', // Crème visage
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=500&fit=crop', // Produits beauté
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=500&fit=crop', // Soins corps
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=500&fit=crop', // Shampooing
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=500&fit=crop', // Cosmétiques
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=500&fit=crop', // Savon
      'https://images.unsplash.com/photo-1573575155376-b5010099301b?w=400&h=500&fit=crop', // Parfum luxe
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=500&fit=crop', // Maquillage pro
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=500&fit=crop', // Huiles essentielles
      'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=400&h=500&fit=crop', // Crème hydratante
    ];
    const beautyNames = [
      'Parfum Élégance Dorée',
      'Kit Maquillage Premium',
      'Crème Visage Anti-Âge',
      'Sérum Éclat Vitamine C',
      'Lait Corps Hydratant',
      'Shampooing Karité Bio',
      'Palette Ombres Luxe',
      'Savon Naturel Beurre de Karité',
      'Eau de Parfum Intense',
      'Rouge à Lèvres Longue Tenue',
      'Huile Relaxante Bien-être',
      'Crème Mains Réparatrice'
    ];
    const beautyPrices = [45000, 32000, 28000, 35000, 15000, 8500, 42000, 5500, 65000, 12000, 18000, 9500];
    const beautyTypes = ['Parfum','Maquillage','Soin visage','Soin visage','Soin corps','Cheveux','Maquillage','Hygiène','Parfum','Maquillage','Bien-être','Soin corps'];
    const skinTypes = ['Tous types','Tous types','Peau sèche','Peau mixte','Tous types','Tous types','Tous types','Peau sensible','Tous types','Tous types','Tous types','Peau sèche'];
    const beautyBrands = ['Aurum Beauty','Aurum Beauty','Garnier','L\'Oréal','Nivea','Shea Moisture','Maybelline','Dove','Aurum Beauty','Maybelline','Aurum Beauty','Nivea'];
    
    const beautyDemo = Array.from({length:12}).map((_,i)=>({
      id:'PB'+(i+1), 
      name: beautyNames[i], 
      price: beautyPrices[i], 
      stock: 15 + Math.floor(Math.random()*30), 
      color: ['Rose','Blanc','Or','Transparent','Beige','Noir'][i%6],
      category: 'Beauté, Hygiène & Bien-être',
      beautyType: beautyTypes[i],
      skinType: skinTypes[i],
      brand: beautyBrands[i],
      sizeType: 'none', // Pas de taille pour les cosmétiques
      images:[beautyImages[i]],
      shopId:'popppp', 
      rating: (4.2 + Math.random()*0.7).toFixed(1), 
      reviews:[
        {user:'Aïcha M.', comment:'Sent divinement bon !', stars:5},
        {user:'Fatou D.', comment:'Texture agréable', stars:4},
        {user:'Marie K.', comment:'Très efficace', stars:5}
      ],
      views: Math.floor(Math.random()*600), 
      wishlist: Math.floor(Math.random()*80), 
      sales: Math.floor(Math.random()*45)
    }));
    
    // Produits Électronique, Téléphonie & Informatique
    const techImages = [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop', // iPhone
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=500&fit=crop', // Samsung Galaxy
      'https://images.unsplash.com/photo-1544866092-1935c5ef2a8f?w=400&h=500&fit=crop', // Tablette
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=500&fit=crop', // Laptop
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=500&fit=crop', // PC Gaming
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=500&fit=crop', // Casque audio
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=500&fit=crop', // AirPods
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=500&fit=crop', // Smart TV
      'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=400&h=500&fit=crop', // Console PS5
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=500&fit=crop', // Appareil photo
      'https://images.unsplash.com/photo-1628815113969-0487917f7a4c?w=400&h=500&fit=crop', // Écouteurs
      'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=500&fit=crop', // Clavier gaming
    ];
    const techNames = [
      'iPhone 14 Pro Max 256Go',
      'Samsung Galaxy S23 Ultra',
      'iPad Pro 12.9" M2',
      'MacBook Air M2 256Go',
      'PC Gaming RTX 4070',
      'Casque Sony WH-1000XM5',
      'AirPods Pro 2ème Gén',
      'Samsung Smart TV 55" 4K',
      'PlayStation 5 Standard',
      'Canon EOS R6 Mark II',
      'JBL Tune 760NC',
      'Clavier Mécanique RGB'
    ];
    const techPrices = [850000, 720000, 680000, 750000, 1200000, 180000, 145000, 450000, 380000, 1500000, 55000, 45000];
    const techTypesArr = ['Smartphone','Smartphone','Tablette','Ordinateur portable','Ordinateur bureau','Audio','Audio','TV & Écran','Console & Gaming','Appareil photo','Audio','Accessoire'];
    const techCapacitiesArr = ['256 Go','256 Go','256 Go','256 Go','1 To','N/A','N/A','N/A','1 To','N/A','N/A','N/A'];
    const techConditionsArr = ['Neuf','Neuf','Neuf','Neuf','Neuf','Neuf','Neuf','Neuf','Neuf','Neuf','Occasion - Comme neuf','Neuf'];
    const techBrandsArr = ['Apple','Samsung','Apple','Apple','Asus','Sony','Apple','Samsung','Sony','Canon','JBL','Autres'];
    
    const techDemo = Array.from({length:12}).map((_,i)=>({
      id:'PT'+(i+1), 
      name: techNames[i], 
      price: techPrices[i], 
      stock: 5 + Math.floor(Math.random()*20), 
      color: ['Noir','Gris','Argent','Blanc','Bleu'][i%5],
      category: 'Électronique, Téléphonie & Informatique',
      techType: techTypesArr[i],
      capacity: techCapacitiesArr[i],
      condition: techConditionsArr[i],
      techBrand: techBrandsArr[i],
      sizeType: 'none', // Pas de taille pour l'électronique
      warrantyWarning: true, // Flag pour afficher l'avertissement garantie
      images:[techImages[i]],
      shopId:'popppp', 
      rating: (4.3 + Math.random()*0.6).toFixed(1), 
      reviews:[
        {user:'Ibrahim T.', comment:'Excellent produit, livraison rapide !', stars:5},
        {user:'Moussa K.', comment:'Très bon rapport qualité/prix', stars:4},
        {user:'Aminata B.', comment:'Fonctionne parfaitement', stars:5}
      ],
      views: Math.floor(Math.random()*900), 
      wishlist: Math.floor(Math.random()*120), 
      sales: Math.floor(Math.random()*35)
    }));
    
    // Produits Maison, Meubles & Décoration
    const homeImages = [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop', // Canapé
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=500&fit=crop', // Lit
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=500&fit=crop', // Table
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=500&fit=crop', // Étagère
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=500&fit=crop', // Lampe
      'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&h=500&fit=crop', // Miroir
      'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=400&h=500&fit=crop', // Tapis
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=500&fit=crop', // Ustensiles cuisine
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=500&fit=crop', // Salle de bain
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=500&fit=crop', // Chaise jardin
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=500&fit=crop', // Fauteuil
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=500&fit=crop', // Commode
    ];
    const homeNames = [
      'Canapé 3 Places Velours',
      'Lit King Size Bois Massif',
      'Table à Manger Extensible',
      'Étagère Murale Industrielle',
      'Lampadaire Arc Moderne',
      'Miroir Rond Doré 80cm',
      'Tapis Berbère Fait Main',
      'Set Ustensiles Cuisine Inox',
      'Meuble Vasque Salle de Bain',
      'Salon de Jardin 4 Places',
      'Fauteuil Scandinave Tissu',
      'Commode 6 Tiroirs Chêne'
    ];
    const homePrices = [385000, 520000, 185000, 75000, 95000, 45000, 125000, 35000, 280000, 320000, 145000, 195000];
    const homeTypesArr = ['Canapé & Fauteuil','Lit & Matelas','Table & Chaise','Rangement','Luminaire','Décoration murale','Tapis & Textile','Cuisine','Salle de bain','Jardin & Extérieur','Canapé & Fauteuil','Rangement'];
    const homeMaterialsArr = ['Tissu','Bois massif','Bois MDF','Métal','Métal','Verre','Tissu','Métal','Bois MDF','Rotin','Tissu','Bois massif'];
    const homeDimensionsArr = ['Grand (100-150cm)','Très grand (> 150cm)','Grand (100-150cm)','Moyen (50-100cm)','Très grand (> 150cm)','Moyen (50-100cm)','Grand (100-150cm)','Petit (< 50cm)','Moyen (50-100cm)','Très grand (> 150cm)','Moyen (50-100cm)','Moyen (50-100cm)'];
    const homeStylesArr = ['Moderne','Traditionnel','Scandinave','Industriel','Moderne','Bohème','Bohème','Minimaliste','Moderne','Moderne','Scandinave','Scandinave'];
    
    const homeDemo = Array.from({length:12}).map((_,i)=>({
      id:'PH'+(i+1), 
      name: homeNames[i], 
      price: homePrices[i], 
      stock: 3 + Math.floor(Math.random()*15), 
      color: ['Gris','Naturel','Blanc','Noir','Or','Beige'][i%6],
      category: 'Maison, Meubles & Décoration',
      homeType: homeTypesArr[i],
      material: homeMaterialsArr[i],
      dimension: homeDimensionsArr[i],
      homeStyle: homeStylesArr[i],
      sizeType: 'none',
      images:[homeImages[i]],
      shopId:'popppp', 
      rating: (4.1 + Math.random()*0.8).toFixed(1), 
      reviews:[
        {user:'Salamata O.', comment:'Très beau meuble, livraison soignée !', stars:5},
        {user:'Boureima S.', comment:'Qualité excellente', stars:4},
        {user:'Mariam K.', comment:'Correspond à la description', stars:5}
      ],
      views: Math.floor(Math.random()*500), 
      wishlist: Math.floor(Math.random()*60), 
      sales: Math.floor(Math.random()*25)
    }));
    
    // Produits Bâtiment, Quincaillerie & Matériaux
    const btpImages = [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=500&fit=crop', // Ciment
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop', // Fer
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=500&fit=crop', // Bois
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=500&fit=crop', // Peinture
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=500&fit=crop', // Plomberie
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=500&fit=crop', // Électricité
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=500&fit=crop', // Outils
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=500&fit=crop', // Carrelage
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=500&fit=crop', // Toiture
      'https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&h=500&fit=crop', // Quincaillerie
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=500&fit=crop', // Perceuse
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=500&fit=crop', // Briques
    ];
    const btpNames = [
      'Ciment CPA 45 (Sac 50kg)',
      'Fer à Béton Ø12mm (Barre 12m)',
      'Chevron Bois Traité 4m',
      'Peinture Acrylique 20L',
      'Kit Plomberie PVC Complet',
      'Câble Électrique 2.5mm² (100m)',
      'Coffret Outils Pro 150 Pièces',
      'Carrelage Grès 60x60 (M²)',
      'Tôle Ondulée Alu 3m',
      'Lot Visserie Inox 500 Pièces',
      'Perceuse Visseuse Bosch Pro',
      'Briques Creuses (Palette 500)'
    ];
    const btpPrices = [5500, 8500, 12000, 45000, 35000, 28000, 125000, 8500, 15000, 18000, 95000, 175000];
    const btpPricesPro = [4800, 7200, 10000, 38000, 30000, 24000, 105000, 7000, 12500, 15000, 82000, 150000];
    const btpTypesArr = ['Ciment & Béton','Fer & Métaux','Bois & Menuiserie','Peinture & Revêtement','Plomberie','Électricité','Outillage','Carrelage & Sols','Toiture','Quincaillerie','Outillage','Ciment & Béton'];
    const btpUnitsArr = ['Sac (50kg)','Pièce','Pièce','Litre','Lot','Mètre','Lot','M²','Pièce','Lot','Pièce','Palette'];
    const btpClientTypesArr = ['Tous','B2B (Professionnels)','Tous','Tous','Tous','B2B (Professionnels)','Tous','Tous','B2B (Professionnels)','Tous','Tous','B2B (Professionnels)'];
    const btpBrandsArr = ['Cimburkina','Local/Artisanal','Local/Artisanal','Sika','Local/Artisanal','Local/Artisanal','Stanley','Local/Artisanal','Local/Artisanal','Fischer','Bosch','Dangote'];
    
    const btpDemo = Array.from({length:12}).map((_,i)=>({
      id:'PB2'+(i+1), 
      name: btpNames[i], 
      price: btpPrices[i],
      pricePro: btpPricesPro[i], // Prix professionnel
      stock: 20 + Math.floor(Math.random()*100), 
      color: ['Gris','Noir','Naturel','Blanc','Gris','Noir'][i%6],
      category: 'Bâtiment, Quincaillerie & Matériaux',
      btpType: btpTypesArr[i],
      unit: btpUnitsArr[i],
      clientType: btpClientTypesArr[i],
      btpBrand: btpBrandsArr[i],
      sizeType: 'none',
      images:[btpImages[i]],
      shopId:'popppp', 
      rating: (4.0 + Math.random()*0.9).toFixed(1), 
      reviews:[
        {user:'Entreprise BTP Oua', comment:'Bon rapport qualité/prix, livraison sur chantier', stars:5},
        {user:'Moussa Maçon', comment:'Produit conforme, je recommande', stars:4},
        {user:'Construction Plus', comment:'Fournisseur fiable', stars:5}
      ],
      views: Math.floor(Math.random()*400), 
      wishlist: Math.floor(Math.random()*40), 
      sales: Math.floor(Math.random()*80)
    }));
    
    // Produits Véhicules & Mobilité
    const vehicleImages = [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=500&fit=crop', // Toyota
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop', // Mercedes
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=500&fit=crop', // Peugeot
      'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=400&h=500&fit=crop', // Moto
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=500&fit=crop', // Scooter
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=500&fit=crop', // Vélo
      'https://images.unsplash.com/photo-1601929862217-f1bf94503333?w=400&h=500&fit=crop', // Camion
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=500&fit=crop', // Utilitaire
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=500&fit=crop', // Pièces
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=500&fit=crop', // BMW
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=500&fit=crop', // Honda
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=500&fit=crop', // Sport car
    ];
    const vehicleNames = [
      'Toyota Corolla 2022 Automatique',
      'Mercedes Classe C 2021 AMG Line',
      'Peugeot 308 2020 HDI',
      'Yamaha MT-07 2023 Neuve',
      'Piaggio Liberty 125cc',
      'VTT Giant Talon Pro',
      'Camion Benne Hyundai HD78',
      'Renault Kangoo Utilitaire',
      'Kit Plaquettes de Frein Avant',
      'BMW Série 3 2019 Sport',
      'Honda Civic 2021 CVT',
      'Hyundai Tucson 2023 Hybride'
    ];
    const vehiclePrices = [12500000, 28000000, 8500000, 5200000, 1800000, 450000, 35000000, 9500000, 45000, 18500000, 14000000, 22000000];
    const vehicleTypesArr = ['Voiture','Voiture','Voiture','Moto','Scooter','Vélo','Camion','Utilitaire','Pièces détachées','Voiture','Voiture','Voiture'];
    const vehicleConditionsArr = ['Occasion - Très bon état','Occasion - Comme neuf','Occasion - Bon état','Neuf','Occasion - Bon état','Neuf','Neuf','Occasion - Très bon état','Neuf','Occasion - Très bon état','Occasion - Comme neuf','Neuf'];
    const vehicleYearsArr = ['2022','2021','2020','2023','2021','2024','2024','2020','2024','2019','2021','2023'];
    const vehicleMileagesArr = [45000, 28000, 85000, 0, 12000, 0, 0, 65000, 0, 62000, 35000, 0];
    const vehicleFuelsArr = ['Essence','Diesel','Diesel','Essence','Essence','N/A','Diesel','Diesel','N/A','Diesel','Essence','Hybride'];
    const vehicleTransmissionsArr = ['Automatique','Automatique','Manuelle','Manuelle','Automatique','N/A','Manuelle','Manuelle','N/A','Automatique','Automatique','Automatique'];
    const vehicleBrandsArr = ['Toyota','Mercedes-Benz','Peugeot','Yamaha','Piaggio','Autres','Hyundai','Renault','Autres','BMW','Honda','Hyundai'];
    const vehicleSellerVerifiedArr = [true, true, false, true, false, true, true, false, true, true, true, true];
    
    const vehicleDemo = Array.from({length:12}).map((_,i)=>({
      id:'PV'+(i+1), 
      name: vehicleNames[i], 
      price: vehiclePrices[i],
      stock: 1, // Véhicules généralement uniques
      color: ['Blanc','Noir','Gris','Rouge','Bleu','Noir'][i%6],
      category: 'Véhicules & Mobilité',
      vehicleType: vehicleTypesArr[i],
      vehicleCondition: vehicleConditionsArr[i],
      vehicleYear: vehicleYearsArr[i],
      vehicleMileage: vehicleMileagesArr[i],
      vehicleFuel: vehicleFuelsArr[i],
      vehicleTransmission: vehicleTransmissionsArr[i],
      vehicleBrand: vehicleBrandsArr[i],
      sellerVerified: vehicleSellerVerifiedArr[i], // Validation vendeur renforcée
      sizeType: 'none',
      images:[vehicleImages[i]],
      shopId:'popppp', 
      rating: (4.0 + Math.random()*0.9).toFixed(1), 
      reviews:[
        {user:'Amadou T.', comment:'Véhicule en excellent état, vendeur sérieux', stars:5},
        {user:'Karim B.', comment:'Transaction rapide et sécurisée', stars:4},
        {user:'Ibrahim M.', comment:'Conforme à la description', stars:5}
      ],
      views: Math.floor(Math.random()*700), 
      wishlist: Math.floor(Math.random()*50), 
      sales: Math.floor(Math.random()*10)
    }));
    
    Store.products = [...demo, ...beautyDemo, ...techDemo, ...homeDemo, ...btpDemo, ...vehicleDemo];
    localStorage.setItem('ac_products', JSON.stringify(Store.products));
  }
  
  // Restaurants de démonstration
  const forceRestaurantsReset = Store.restaurants.length === 0 || needsReset;
  if(forceRestaurantsReset){
    const restaurantImages = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', // Restaurant moderne
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop', // Restaurant africain
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop', // Burger
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', // Pizza
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', // Grillade
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop', // Poulet
      'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop', // Asiatique
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', // Libanais
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', // Café
      'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=400&h=300&fit=crop', // Jus
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', // Pâtisserie
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', // Restaurant chic
    ];
    const restaurantNames = [
      'Le Petit Ouaga',
      'Mama Africa',
      'Burger Palace',
      'Pizza Napoli Express',
      'Grillades du Sahel',
      'Poulet Braisé Chez Tanti',
      'Wok & Roll',
      'Le Cèdre Libanais',
      'Café des Artistes',
      'Fresh Juice Bar',
      'Délices Sucrés',
      'L\'Étoile d\'Or'
    ];
    const cuisineTypesArr = ['Africain','Africain','Burgers','Pizzeria','Grillades','Poulet','Asiatique','Libanais','Café','Jus & Smoothies','Pâtisserie','Français'];
    const priceRangesArr = ['€ (Économique)','€€ (Modéré)','€ (Économique)','€€ (Modéré)','€ (Économique)','€ (Économique)','€€ (Modéré)','€€€ (Premium)','€€ (Modéré)','€ (Économique)','€€ (Modéré)','€€€ (Premium)'];
    const deliveryTimesArr = [25, 35, 20, 30, 25, 20, 35, 40, 15, 15, 25, 45];
    const deliveryFeesArr = [500, 750, 500, 750, 500, 500, 750, 1000, 500, 500, 500, 1000];
    const minOrdersArr = [2000, 3000, 1500, 2500, 2000, 1500, 3000, 5000, 1000, 1000, 1500, 7500];
    
    const restaurantsDemo = Array.from({length:12}).map((_,i)=>{
      const now = new Date();
      const hours = now.getHours();
      // Horaires simulés
      const openHour = [7,11,10,11,11,10,11,11,7,8,8,12][i];
      const closeHour = [22,23,23,23,23,22,22,23,18,20,20,23][i];
      const isOpen = hours >= openHour && hours < closeHour;
      
      return {
        id:'R'+(i+1), 
        name: restaurantNames[i], 
        image: restaurantImages[i],
        cuisineType: cuisineTypesArr[i],
        priceRange: priceRangesArr[i],
        rating: (3.8 + Math.random()*1.1).toFixed(1),
        reviewCount: 50 + Math.floor(Math.random()*200),
        deliveryTime: deliveryTimesArr[i],
        deliveryFee: deliveryFeesArr[i],
        minOrder: minOrdersArr[i],
        isOpen: isOpen,
        openHour: openHour,
        closeHour: closeHour,
        deliveryEnabled: [true,true,true,true,true,true,true,true,false,true,true,true][i],
        takeawayEnabled: true,
        badges: [
          i < 4 ? 'populaire' : null,
          deliveryTimesArr[i] <= 20 ? 'livraison-rapide' : null,
          i % 3 === 0 ? 'promo' : null
        ].filter(Boolean),
        promoPercent: i % 3 === 0 ? 10 : 0,
        address: ['Zone du Bois', 'Ouaga 2000', 'Pissy', 'Koulouba', 'Dassasgho', 'Tampouy', 'Karpala', 'Zone du Bois', 'Centre-ville', 'Ouaga 2000', 'Pissy', 'Zone du Bois'][i] + ', Ouagadougou',
        phone: '+226 ' + (70 + Math.floor(Math.random()*10)) + ' ' + String(Math.floor(Math.random()*100)).padStart(2,'0') + ' ' + String(Math.floor(Math.random()*100)).padStart(2,'0') + ' ' + String(Math.floor(Math.random()*100)).padStart(2,'0'),
        menu: generateMenu(cuisineTypesArr[i], i)
      };
    });
    
    Store.restaurants = restaurantsDemo;
    localStorage.setItem('ac_restaurants', JSON.stringify(Store.restaurants));
  }
  
  // Commande de démo si vide
  if(Store.orders.length===0){
    const demoItems = Store.products.slice(0,2).map(p=>({
      pid: p.id, name: p.name, price: p.price, qty: 1, image: p.images[0]
    }));
    const subtotal = demoItems.reduce((s,it)=> s + it.price*it.qty, 0);
    const order = {
      id: 'O'+Date.now(),
      userEmail: TestAccounts.client.email,
      date: Date.now() - 86400000,
      status: 'paid', // pending|paid|shipped|delivered|cancelled
      items: demoItems,
      subtotal,
      discount: 0,
      shipping: 0,
      total: subtotal,
      promoCode: null,
      address: null,
      meta: { method:'Standard' }
    };
    Store.orders = [order];
    localStorage.setItem('ac_orders', JSON.stringify(Store.orders));
  }
})();

function saveStore(){
  localStorage.setItem('ac_users', JSON.stringify(Store.users));
  localStorage.setItem('ac_shops', JSON.stringify(Store.shops));
  localStorage.setItem('ac_products', JSON.stringify(Store.products));
  localStorage.setItem('ac_orders', JSON.stringify(Store.orders)); // <-- AJOUT
  localStorage.setItem('ac_invoices', JSON.stringify(Store.invoices || []));
  localStorage.setItem('ac_promos', JSON.stringify(Store.promos || []));
}
