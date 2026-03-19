
/* ═══════════════════════════════════════════════════════════════
   Aurum Inbox Controller
   ─ Fonctionne avec messaging.js v2
   ═══════════════════════════════════════════════════════════════ */
(function AurumInbox() {

  /* ── Guard: Exit if inbox elements don't exist ── */
  if (!document.getElementById('inbox-sidebar')) return;

  /* ── DOM refs ── */
  var sidebar      = document.getElementById('inbox-sidebar');
  var convListEl   = document.getElementById('inbox-conv-list');
  var countBadge   = document.getElementById('inbox-count');
  var emptyState   = document.getElementById('inbox-empty-state');
  var threadPanel  = document.getElementById('inbox-thread');
  var threadInner  = document.getElementById('inbox-thread-inner');
  var messagesWrap = document.getElementById('inbox-messages-wrap');
  var threadName   = document.getElementById('inbox-thread-name');
  var threadSub    = document.getElementById('inbox-thread-sub');
  var threadAvatar = document.getElementById('inbox-thread-avatar');
  var shopLink     = document.getElementById('inbox-shop-link');
  var backBtn      = document.getElementById('inbox-back-btn');
  var compose      = document.getElementById('inbox-compose');
  var inputEl      = document.getElementById('inbox-input');
  var charCount    = document.getElementById('inbox-char-count');
  var sendBtn      = document.getElementById('inbox-send-btn');

  /* ── State ── */
  var currentUser   = null;
  var activeChat    = null;
  var chatsCache    = [];
  var activeTab     = 'all';
  var searchTerm    = '';
  var unsubChats    = null;
  var unsubMessages = null;

  /* ── URL params ── */
  var params       = new URLSearchParams(location.search);
  var initChatId   = params.get('chatId')    || '';
  var initShopId   = params.get('shopId')    || '';
  var initSellerId = params.get('sellerId')  || '';
  var initProdId   = params.get('productId') || '';

  /* ── Toast ── */
  function toast(msg, type) {
    var tc  = document.getElementById('toast-container');
    var el  = document.createElement('div');
    el.className = 'toast-item ' + (type || '');
    el.textContent = msg;
    tc.appendChild(el);
    setTimeout(function() { el.remove(); }, 3500);
  }
  window.showToast = function(m, t) { toast(m, t === 'error' ? 'danger' : t === 'success' ? 'success' : ''); };

  /* ── Helpers ── */
  function goLogin() {
    location.href = '/login?returnUrl=' + encodeURIComponent(location.pathname + location.search);
  }
  function avatarLetters(name) {
    return String(name || '?').trim().split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  }
  function fmt(ts) { return window.formatChatTime ? window.formatChatTime(ts) : ''; }
  function esc(s) { return window._aurumMsg ? window._aurumMsg.escapeHtml(s) : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function formatDateLabel(ts) { return window._aurumMsg ? window._aurumMsg.formatDateLabel(ts) : ''; }

  /* ── Render conversation list ── */
  function renderList() {
    var chats = chatsCache.slice();

    /* Tab filter */
    if (activeTab === 'buyer') {
      chats = chats.filter(function(c){ return c.buyerId === currentUser.uid; });
    } else if (activeTab === 'seller') {
      chats = chats.filter(function(c){ return c.sellerId === currentUser.uid || c.shopId; });
    }

    /* Search filter */
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      chats = chats.filter(function(c){
        return (c.shopName||'').toLowerCase().includes(q)
          || (c.buyerName||'').toLowerCase().includes(q)
          || (c.lastMessage||'').toLowerCase().includes(q);
      });
    }

    /* Global unread count */
    var totalUnread = chatsCache.reduce(function(acc, c) {
      var isBuyer = c.buyerId === currentUser.uid;
      return acc + (isBuyer ? (c.unreadBuyer||0) : (c.unreadSeller||0));
    }, 0);
    if (totalUnread > 0) {
      countBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
      countBadge.classList.add('show');
    } else {
      countBadge.classList.remove('show');
    }

    if (!chats.length) {
      convListEl.innerHTML =
        '<div class="inbox-conv-empty">' +
        '<p>' + (searchTerm ? 'Aucun résultat pour "' + esc(searchTerm) + '".' : 'Aucune conversation pour l\'instant.') + '</p>' +
        (!searchTerm ? '<a href="catalogue.html">Explorer la marketplace →</a>' : '') +
        '</div>';
      return;
    }

    convListEl.innerHTML = chats.map(function(chat) {
      var isBuyer = chat.buyerId === currentUser.uid;
      var partner = isBuyer ? (chat.shopName || 'Boutique') : (chat.buyerName || 'Client');
      var unread  = isBuyer ? (chat.unreadBuyer||0) : (chat.unreadSeller||0);
      var preview = chat.lastMessage || 'Aucun message encore.';
      if (preview.length > 56) preview = preview.slice(0,56) + '…';
      var time    = fmt(chat.lastMessageAt || chat.updatedAt);
      var isAct   = activeChat && activeChat.id === chat.id;

      return '<button class="inbox-conv-item' + (isAct?' active':'') + (unread>0?' has-unread':'') + '" data-cid="' + chat.id + '" type="button">' +
        '<div class="inbox-conv-avatar">' + avatarLetters(partner) +
          (unread > 0 ? '<span class="unread-pip">' + (unread > 9 ? '9+' : unread) + '</span>' : '') +
        '</div>' +
        '<div class="inbox-conv-body">' +
          '<div class="inbox-conv-top">' +
            '<span class="inbox-conv-name">' + esc(partner) + '</span>' +
            '<span class="inbox-conv-time">' + esc(time) + '</span>' +
          '</div>' +
          '<div style="margin-bottom:2px">' +
            '<span class="inbox-conv-role-tag ' + (isBuyer?'buyer':'seller') + '">' + (isBuyer?'Achat':'Vente') + '</span>' +
            '<span style="font-size:11px;color:#4A4540">' + esc(isBuyer ? (chat.shopName || chat.sellerName || 'Boutique') : (chat.buyerName || 'Client')) + '</span>' +
          '</div>' +
          '<p class="inbox-conv-preview">' + esc(preview) + '</p>' +
        '</div></button>';
    }).join('');

    convListEl.querySelectorAll('[data-cid]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var chat = chatsCache.find(function(c){ return c.id === btn.dataset.cid; });
        if (chat) openThread(chat);
      });
    });
  }

  /* ── Open thread ── */
  function openThread(chat) {
    console.log('🔓 [OPENTHREAD] Opening chat:', chat.id, '| shopId:', chat.shopId, '| buyerId:', chat.buyerId);
    activeChat = chat;
    console.log('✅ [OPENTHREAD] activeChat set to:', activeChat);

    var isBuyer = chat.buyerId === currentUser.uid;
    var partner = isBuyer ? (chat.shopName || 'Boutique') : (chat.buyerName || 'Client');

    threadAvatar.textContent = avatarLetters(partner);
    threadName.textContent   = partner;
    threadSub.textContent    = isBuyer
      ? ('Boutique Aurum' + (chat.productId ? ' · Produit référencé' : ''))
      : ('Client · ' + (chat.buyerEmail || ''));

    if (chat.shopId && isBuyer) {
      shopLink.href         = chat.shopSlug ? '/boutique/' + chat.shopSlug : '/boutique?id=' + chat.shopId;
      shopLink.style.display = '';
    } else {
      shopLink.style.display = 'none';
    }

    /* Update URL sans rechargement */
    var url = new URL(window.location.href);
    url.searchParams.set('chatId', chat.id);
    history.replaceState({}, '', url.toString());

    /* Mobile: cacher sidebar, montrer thread */
    sidebar.classList.add('mobile-hidden');
    threadPanel.classList.add('mobile-show');

    emptyState.style.display    = 'none';
    threadInner.style.display   = 'flex';

    renderList(); /* Rafraîchit le highlight actif */
    console.log('👂 [OPENTHREAD] Calling listenMessages with chatId:', chat.id);
    listenMessages(chat.id);
    inputEl.focus();
    console.log('🎯 [OPENTHREAD] Thread opened and focused');
  }

  /* ── Subscribe messages ── */
  function listenMessages(chatId) {
    console.log('📡 [LISTENMESSAGES] Starting listener for chatId:', chatId);
    if (unsubMessages) { 
      console.log('🔌 [LISTENMESSAGES] Unsubscribing from previous listener');
      unsubMessages(); 
      unsubMessages = null; 
    }
    messagesWrap.innerHTML = '<div class="inbox-loading"><div class="inbox-spinner"></div></div>';

    console.log('🔗 [LISTENMESSAGES] window.subscribeMessages exists?', typeof window.subscribeMessages === 'function');
    unsubMessages = window.subscribeMessages(
      chatId,
      function(msgs) { 
        console.log('📨 [LISTENMESSAGES] Received', msgs.length, 'messages from Firestore');
        renderMessages(msgs); 
      },
      function(err)  {
        console.error('❌ [LISTENMESSAGES] Error subscribing to messages:', err);
        messagesWrap.innerHTML = '<p class="inbox-msg-error">Impossible de charger les messages.</p>';
        console.error('[Inbox] listenMessages:', err);
      }
    );

    /* Marquer comme lu */
    if (window._aurumMsg && window._aurumMsg.markConversationRead) {
      console.log('🔖 [LISTENMESSAGES] Marking conversation as read');
      window._aurumMsg.markConversationRead(chatId);
    }
  }

  /* ── Render messages ── */
  function renderMessages(msgs) {
    if (!msgs.length) {
      messagesWrap.innerHTML = '<div class="inbox-thread-empty">Envoyez le premier message ci-dessous.</div>';
      return;
    }

    var html      = '';
    var lastLabel = '';

    msgs.forEach(function(msg) {
      var isMine = msg.senderId === currentUser.uid;
      var label  = formatDateLabel(msg.createdAt);

      if (label && label !== lastLabel) {
        html += '<div class="inbox-date-sep"><span>' + esc(label) + '</span></div>';
        lastLabel = label;
      }

      var time   = fmt(msg.createdAt);
      var lock   = msg.hasMaskedContent
        ? '<span class="inbox-masked-badge" title="Coordonnées masquées">🔒</span>'
        : '';

      html +=
        '<div class="inbox-bubble-row ' + (isMine?'mine':'theirs') + '">' +
          '<div class="inbox-bubble ' + (isMine?'mine':'theirs') + '">' +
            '<p>' + esc(msg.text) + '</p>' +
            '<div class="inbox-bubble-meta">' + lock + '<span>' + esc(time) + '</span></div>' +
          '</div>' +
        '</div>';
    });

    messagesWrap.innerHTML = html;
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
  }

  /* ── Send ── */
  // On récupère le formulaire ou le bouton d'envoi
  // NOTE: Ces IDs peuvent être différents de inbox-compose/inbox-input/inbox-send-btn
  var composeAlt = document.getElementById('chat-form'); // ou l'ID de ton formulaire
  var inputElAlt = document.getElementById('chat-input');
  var sendBtnAlt = document.getElementById('chat-submit');

  // SÉCURITÉ : On ne lance le code que si le formulaire existe sur la page
  if (composeAlt && inputElAlt && sendBtnAlt) {
    composeAlt.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      if (!activeChat) { 
        if(window.toast) toast('Sélectionnez une conversation.', ''); 
        return; 
      }

      var raw = inputElAlt.value.trim();
      if (!raw) return;

      sendBtnAlt.disabled = true;
      try {
        if (activeChat._stub) {
          /* Nouvelle conv : créer + envoyer */
          var chatId = await window.sendMessage(activeChat.shopId, raw, {
            sellerId:   activeChat.sellerId   || '',
            shopName:   activeChat.shopName   || '',
            sellerName: activeChat.sellerName || '',
            productId:  activeChat.productId  || '',
          });
          activeChat._stub  = false;
          activeChat.id     = chatId;
          if(typeof listenMessages === 'function') listenMessages(chatId);
        } else {
          await window.sendReply(activeChat.id, raw);
        }
        
        inputElAlt.value         = '';
        if(window.charCount) charCount.textContent = '0 / 1200';
        inputElAlt.style.height  = 'auto';
        inputElAlt.focus();
      } catch (err) {
        if(window.toast) toast(err.message || 'Envoi impossible.', 'danger');
      } finally {
        sendBtnAlt.disabled = false;
      }
    });
  }

  /* ── FORMULAIRE PRINCIPAL (Inbox) ── */
  if (compose && inputEl && sendBtn) {
    console.log('🔧 [INBOX] Form listener attached to #inbox-compose');
    compose.addEventListener('submit', async function(e) {
      console.log('🚀 [SUBMIT] Form submit event fired!');
      e.preventDefault();
      console.log('✅ [SUBMIT] preventDefault() called');
      
      console.log('📋 [SUBMIT] activeChat state:', activeChat);
      if (!activeChat) {
        console.warn('⚠️ [SUBMIT] No active chat selected');
        if(window.toast) toast('Sélectionnez une conversation.', '');
        return;
      }

      var raw = inputEl.value.trim();
      console.log('📝 [SUBMIT] Message text length:', raw.length, '| Raw text:', raw.substring(0, 50));
      if (!raw) {
        console.warn('⚠️ [SUBMIT] Message is empty, skipping');
        return;
      }

      console.log('🔒 [SUBMIT] Disabling send button');
      sendBtn.disabled = true;
      
      try {
        console.log('🔍 [SUBMIT] Checking if stub conversation:', activeChat._stub);
        if (activeChat._stub) {
          /* Nouvelle conversation : créer + envoyer */
          console.log('📤 [SUBMIT] Creating new conversation with shopId:', activeChat.shopId);
          console.log('🔗 [SUBMIT] window.sendMessage exists?', typeof window.sendMessage === 'function');
          
          var messageResult = await window.sendMessage(activeChat.shopId, raw, {
            sellerId:   activeChat.sellerId   || '',
            shopName:   activeChat.shopName   || '',
            sellerName: activeChat.sellerName || '',
            productId:  activeChat.productId  || '',
          });
          
          console.log('📨 [SUBMIT] sendMessage returned:', messageResult);
          
          // Handle both return formats (object or string)
          var chatId = typeof messageResult === 'object' ? messageResult.chatId : messageResult;
          console.log('💾 [SUBMIT] Extracted chatId:', chatId);
          
          activeChat._stub  = false;
          activeChat.id     = chatId;
          console.log('✅ [SUBMIT] Updated activeChat.id to:', chatId);
          
          if(typeof listenMessages === 'function') {
            console.log('👂 [SUBMIT] Calling listenMessages with chatId:', chatId);
            listenMessages(chatId);
          } else {
            console.error('❌ [SUBMIT] listenMessages is NOT a function');
          }
        } else {
          console.log('💬 [SUBMIT] Sending reply to existing chat:', activeChat.id);
          console.log('🔗 [SUBMIT] window.sendReply exists?', typeof window.sendReply === 'function');
          await window.sendReply(activeChat.id, raw);
          console.log('✅ [SUBMIT] Reply sent successfully');
        }
        
        console.log('🧹 [SUBMIT] Clearing input field');
        inputEl.value = '';
        if(charCount) charCount.textContent = '0 / 1200';
        inputEl.style.height = 'auto';
        inputEl.focus();
        console.log('✨ [SUBMIT] Form cleared and focused');
      } catch (err) {
        console.error('❌ [SUBMIT] Error caught:', err);
        console.error('   Message:', err.message);
        console.error('   Stack:', err.stack);
        if(window.toast) toast(err.message || 'Envoi impossible.', 'danger');
      } finally {
        console.log('🔓 [SUBMIT] Re-enabling send button');
        sendBtn.disabled = false;
      }
    });
  } else {
    console.error('❌ [INBOX] Form elements NOT FOUND: compose=', !!compose, 'inputEl=', !!inputEl, 'sendBtn=', !!sendBtn);
  }

  /* ── Char counter + auto-grow ── */
  if (inputEl && charCount) {
    inputEl.addEventListener('input', function() {
      var len = inputEl.value.length;
      charCount.textContent = len + ' / 1200';
      if (len > 1100) charCount.style.color = '#D94F4F';
      else            charCount.style.color = '';
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
  }

  /* ── Enter = send ── */
  if (inputEl && compose) {
    console.log('🔧 [KEYBOARD] Keydown listener attached to #inbox-input (Enter to send)');
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        console.log('⌨️  [KEYBOARD] Enter key pressed (no Shift)');
        e.preventDefault();
        console.log('📤 [KEYBOARD] Dispatching submit event on form');
        compose.dispatchEvent(new Event('submit'));
      } else if (e.key === 'Enter' && e.shiftKey) {
        console.log('📝 [KEYBOARD] Shift+Enter detected - allowing newline');
      }
    });
  } else {
    console.error('❌ [KEYBOARD] Cannot attach Enter listener: inputEl=', !!inputEl, 'compose=', !!compose);
  }

  /* ── Tabs ── */
  document.querySelectorAll('.inbox-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.inbox-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderList();
    });
  });

  /* ── Search ── */
  var searchEl = document.getElementById('inbox-search');
  if (searchEl) {
    searchEl.addEventListener('input', function(e) {
      searchTerm = e.target.value.trim();
      renderList();
    });
  }

  /* ── Back (mobile) ── */
  if (backBtn && sidebar && threadPanel && emptyState && threadInner) {
    backBtn.addEventListener('click', function() {
      sidebar.classList.remove('mobile-hidden');
      threadPanel.classList.remove('mobile-show');
      emptyState.style.display    = '';
      threadInner.style.display   = 'none';
      activeChat = null;
      if (unsubMessages) { unsubMessages(); unsubMessages = null; }
      renderList();
    });
  }

  /* ── Bootstrap depuis URL params ── */
  async function bootstrapFromUrl() {
    console.log('🚀 [BOOTSTRAP] Starting URL bootstrap check...');
    console.log('   initChatId:', initChatId, '| initShopId:', initShopId);
    if (!initChatId && !initShopId) {
      console.log('⏭️  [BOOTSTRAP] No URL params, skipping bootstrap');
      return;
    }

    /* 1 — Essayer de trouver dans le cache */
    if (initChatId) {
      console.log('🔍 [BOOTSTRAP] Looking for chatId in cache...');
      var found = chatsCache.find(function(c){ return c.id === initChatId; });
      if (found) { 
        console.log('✅ [BOOTSTRAP] Found in cache! Opening thread...');
        openThread(found); 
        return; 
      }
      console.log('⚠️  [BOOTSTRAP] Not found in cache');
    }

    /* 2 — Essayer de charger depuis Firestore */
    if (initChatId) {
      try {
        console.log('📥 [BOOTSTRAP] Loading from Firestore collection "chats"...');
        var snap = await firebase.firestore().collection('chats').doc(initChatId).get();
        if (snap.exists) { 
          console.log('✅ [BOOTSTRAP] Found in Firestore! Opening thread...');
          openThread(Object.assign({ id: snap.id }, snap.data())); 
          return; 
        }
        console.log('⚠️  [BOOTSTRAP] Document does not exist in Firestore');
      } catch (err) {
        console.error('❌ [BOOTSTRAP] Error loading from Firestore:', err);
      }
    }

    /* 3 — Stub nouvelle conversation */
    if (initShopId) {
      console.log('🔧 [BOOTSTRAP] Creating stub for new conversation with shopId:', initShopId);
      var stub = {
        id:         initChatId || window.buildChatId(currentUser.uid, initShopId),
        shopId:     initShopId,
        sellerId:   initSellerId,
        productId:  initProdId,
        shopName:   '',
        sellerName: 'Vendeur',
        buyerId:    currentUser.uid,
        participants: [currentUser.uid, initSellerId || initShopId],
        unreadBuyer: 0, unreadSeller: 0,
        _stub: true,
      };
      /* Récupérer le nom de la boutique */
      try {
        console.log('🏪 [BOOTSTRAP] Fetching shop details for shopId:', initShopId);
        var shopSnap = await firebase.firestore().collection('shops').doc(initShopId).get();
        if (shopSnap.exists) {
          stub.shopName   = shopSnap.data().name   || '';
          stub.sellerName = shopSnap.data().ownerName || stub.sellerName;
          stub.sellerId   = stub.sellerId || shopSnap.data().ownerId || shopSnap.data().ownerUid || '';
          console.log('✅ [BOOTSTRAP] Shop details loaded:', stub.shopName);
        }
      } catch (err) {
        console.error('⚠️  [BOOTSTRAP] Could not fetch shop details:', err);
      }
      chatsCache = [stub].concat(chatsCache.filter(function(c){ return c.id !== stub.id; }));
      renderList();
      console.log('🎯 [BOOTSTRAP] Opening stub thread');
      openThread(stub);
    }
  }

  /* ── Auth listener ── */
  console.log('🔐 [INIT] Checking Firebase availability...');
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    console.error('❌ [INIT] Firebase not configured!');
    convListEl.innerHTML = '<div class="inbox-conv-empty"><p>Firebase non configuré. Vérifiez config.js.</p></div>';
    return;
  }
  console.log('✅ [INIT] Firebase is available');

  firebase.auth().onAuthStateChanged(async function(user) {
    if (!user) { 
      console.error('❌ [AUTH] No user logged in, redirecting to login');
      goLogin(); 
      return; 
    }
    console.log('✅ [AUTH] User logged in:', user.uid, '|', user.email);
    currentUser = user;

    if (unsubChats) { 
      console.log('🔌 [AUTH] Unsubscribing from previous chats listener');
      unsubChats(); 
      unsubChats = null; 
    }

    console.log('📡 [AUTH] Subscribing to user chats for uid:', currentUser.uid);
    unsubChats = window.subscribeUserChats(
      currentUser.uid,
      function(chats) {
        console.log('📬 [CHATS] Received', chats.length, 'conversations from Firestore');
        chatsCache = chats;
        /* Sync activeChat si mis à jour côté Firestore */
        if (activeChat && !activeChat._stub) {
          var updated = chats.find(function(c){ return c.id === activeChat.id; });
          if (updated) {
            console.log('🔄 [CHATS] Updated activeChat from Firestore');
            activeChat = Object.assign({}, activeChat, updated);
          }
        }
        renderList();
      },
      function(err) {
        console.error('❌ [CHATS] Error loading conversations:', err);
        convListEl.innerHTML = '<div class="inbox-conv-empty"><p>Impossible de charger les conversations.<br>' + err.message + '</p></div>';
      }
    );

    /* Attendre le premier batch onSnapshot avant de bootstrapper */
    console.log('⏳ [INIT] Waiting 450ms before bootstrapping from URL params...');
    setTimeout(bootstrapFromUrl, 450);
  });

  window.addEventListener('beforeunload', function() {
    if (unsubChats)    unsubChats();
    if (unsubMessages) unsubMessages();
  });

  /* ── Cursor ── */
  (function() {
    var ring = document.getElementById('cur-ring');
    var dot  = document.getElementById('cur-dot');
    var mx=0, my=0, rx=0, ry=0;
    document.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });
    (function loop(){ rx+=(mx-rx)*.1; ry+=(my-ry)*.1; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', function(e){ if(e.target.closest('a,button,input,textarea,.inbox-conv-item')) document.body.classList.add('ch'); });
    document.addEventListener('mouseout',  function(e){ if(e.target.closest('a,button,input,textarea,.inbox-conv-item')) document.body.classList.remove('ch'); });
  })();

})();

"use strict";

(function messagingModule() {
  const MASK_TEXT = "[Coordonnées masquées par mesure de sécurité]";

  function ensureFirebaseReady() {
    if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) {
      throw new Error("Firebase n'est pas initialise.");
    }
    return {
      db: firebase.firestore(),
      auth: firebase.auth()
    };
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countDigits(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length;
  }

  function replacePhoneCandidates(input) {
    const phoneCandidateRegex = /\+?\d[\d\s().-]{6,}\d/g;
    return input.replace(phoneCandidateRegex, (match) => {
      return countDigits(match) >= 8 ? MASK_TEXT : match;
    });
  }

  function sanitizeMessage(text) {
    const normalized = normalizeText(text);
    if (!normalized) return "";

    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/g;
    const longDigitRegex = /\+?\d{8,}/g;

    let output = normalized;
    output = output.replace(emailRegex, MASK_TEXT);
    output = replacePhoneCandidates(output);
    output = output.replace(longDigitRegex, MASK_TEXT);

    return output;
  }

  function getLoginUrlWithReturn() {
    const current = window.location.pathname + window.location.search + window.location.hash;
    return `login.html?returnUrl=${encodeURIComponent(current)}`;
  }

  function requireAuthUser() {
    const { auth } = ensureFirebaseReady();
    const user = auth.currentUser;
    if (!user) {
      window.location.href = getLoginUrlWithReturn();
      throw new Error("Connexion requise.");
    }
    return user;
  }

  function buildChatId(buyerId, sellerId, shopId) {
    const first = String(buyerId || "").trim();
    const second = String(sellerId || "").trim();
    const shop = String(shopId || "").trim();

    if (!first || !second || !shop) {
      throw new Error("Impossible de construire l'identifiant de conversation.");
    }

    const pair = [first, second].sort().join("__");
    return `${shop}__${pair}`;
  }

  async function resolveSellerIdFromShop(shopId) {
    const { db } = ensureFirebaseReady();
    const shopSnap = await db.collection("shops").doc(shopId).get();
    if (!shopSnap.exists) {
      throw new Error("Boutique introuvable.");
    }

    const shopData = shopSnap.data() || {};
    let sellerId =
      shopData.ownerId ||
      shopData.sellerId ||
      shopData.ownerUid ||
      shopData.userId ||
      shopData.uid ||
      "";

    // Fallback 1: infer from products linked to this shop.
    if (!sellerId) {
      try {
        const productSnap = await db
          .collection("products")
          .where("shopId", "==", shopId)
          .limit(1)
          .get();

        if (!productSnap.empty) {
          const p = productSnap.docs[0].data() || {};
          sellerId = String(p.sellerId || p.ownerId || p.ownerUid || p.userId || "").trim();
        }
      } catch (err) {
        console.warn("[Messaging] Fallback produit échoué:", err.message || err);
      }
    }

    // Fallback 2: resolve uid by owner/shop email.
    const ownerEmailCandidate =
      String(shopData.ownerEmail || shopData.email || shopData.contactEmail || "").trim();

    if (!sellerId && ownerEmailCandidate) {
      try {
        const userSnap = await db
          .collection("users")
          .where("email", "==", ownerEmailCandidate)
          .limit(1)
          .get();

        if (!userSnap.empty) {
          sellerId = String(userSnap.docs[0].id || "").trim();
        }
      } catch (err) {
        console.warn("[Messaging] Fallback email échoué:", err.message || err);
      }
    }

    // Fallback 3: resolve uid by shop mapping saved on user profile.
    if (!sellerId) {
      try {
        const byShopIdSnap = await db
          .collection("users")
          .where("shopId", "==", shopId)
          .limit(1)
          .get();

        if (!byShopIdSnap.empty) {
          sellerId = String(byShopIdSnap.docs[0].id || "").trim();
        }
      } catch (err) {
        console.warn("[Messaging] Fallback shopId échoué:", err.message || err);
      }
    }

    if (!sellerId) {
      try {
        const byShopSnap = await db
          .collection("users")
          .where("shop", "==", shopId)
          .limit(1)
          .get();

        if (!byShopSnap.empty) {
          sellerId = String(byShopSnap.docs[0].id || "").trim();
        }
      } catch (err) {
        console.warn("[Messaging] Fallback shop field échoué:", err.message || err);
      }
    }

    if (!sellerId) {
      throw new Error("Le vendeur de cette boutique est introuvable.");
    }

    return {
      sellerId,
      shopName: shopData.name || "Boutique",
      sellerName: shopData.ownerName || shopData.sellerName || shopData.name || "Vendeur"
    };
  }

  async function ensureChat(payload) {
    const { db } = ensureFirebaseReady();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SÉCURITÉ STRICTE: Convertir et valider TOUS les paramètres
    // ═══════════════════════════════════════════════════════════════════════════
    const buyerId = String(payload.buyerId || "").trim();
    const sellerId = String(payload.sellerId || "").trim();
    const shopId = String(payload.shopId || "").trim();
    const productId = String(payload.productId || "").trim();

    // Vérifications strictes AVANT d'envoyer à Firestore
    if (!buyerId) {
      throw new Error("[Security] buyerId invalide ou vide.");
    }
    if (!sellerId) {
      throw new Error("[Security] sellerId invalide ou vide.");
    }
    if (!shopId) {
      throw new Error("[Security] shopId invalide ou vide.");
    }
    if (buyerId === sellerId) {
      throw new Error("[Security] buyerId et sellerId ne peuvent pas être identiques.");
    }

    const chatId = buildChatId(buyerId, sellerId, shopId);
    const chatRef = db.collection("chats").doc(chatId);

    let exists = false;
    try {
      const chatSnap = await chatRef.get();
      exists = chatSnap.exists;
    } catch (err) {
      // Ignorer "Permission denied" - l'utilisateur n'est peut-être pas encore dans les participants.
      if (err.code !== 'permission-denied') {
        throw err;
      }
      console.warn('[Messaging] Permission denied on ensureChat.get() - will create', err);
    }

    if (!exists) {
      try {
        // CRÉATION SÉCURISÉE avec validation stricte des types
        await chatRef.set({
          buyerId,                                    // String, non-vide
          sellerId,                                  // String, non-vide
          shopId,                                    // String, non-vide
          productId: productId || null,
          participantIds: [buyerId, sellerId],      // Array de taille 2 (OBLIGATOIRE)
          createdBy: buyerId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastMessage: "",
          lastMessageAt: null
        });
        
        console.log("[Messaging] ensureChat créé avec sécurité:", { buyerId, sellerId, shopId, chatId });
      } catch (createErr) {
        console.error("[Messaging] ensureChat create error:", {
          code: createErr.code,
          message: createErr.message,
          params: { buyerId, sellerId, shopId }
        });
        throw createErr;
      }
    }

    return { chatId, chatRef };
  }

  async function sendMessage(shopId, text, context = {}) {
    const { db } = ensureFirebaseReady();
    const user = requireAuthUser();

    const normalizedText = normalizeText(text);
    if (!normalizedText) {
      throw new Error("Le message est vide.");
    }

    let sellerId = context.sellerId || "";
    let sellerName = context.sellerName || "";
    let shopName = context.shopName || "";

    if (!sellerId) {
      const resolved = await resolveSellerIdFromShop(shopId);
      sellerId = resolved.sellerId;
      sellerName = sellerName || resolved.sellerName;
      shopName = shopName || resolved.shopName;
    }

    if (sellerId === user.uid) {
      throw new Error("Vous ne pouvez pas vous auto-contacter.");
    }

    const safeText = sanitizeMessage(normalizedText);
    const hasMaskedContent = safeText.includes(MASK_TEXT);

    const { chatId, chatRef } = await ensureChat({
      buyerId: user.uid,
      sellerId,
      shopId,
      productId: context.productId || ""
    });

    const messageRef = chatRef.collection("messages").doc();
    await messageRef.set({
      senderId: user.uid,
      senderName: user.displayName || user.email || "Client",
      text: safeText,
      hasMaskedContent,
      type: "text",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await chatRef.set({
      buyerId:       user.uid,
      buyerName:     user.displayName || user.email || "Client",
      sellerId,
      shopId,
      productId:     context.productId || null,
      participantIds: [user.uid, sellerId],
      sellerName:    sellerName || null,
      shopName:      shopName  || null,
      updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      lastMessage:   safeText,
      lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      chatId,
      sanitizedText: safeText,
      hasMaskedContent
    };
  }

  function subscribeMessages(chatId, onData, onError) {
    const { db } = ensureFirebaseReady();
    return db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
          });
          onData(messages);
        },
        (error) => {
          if (typeof onError === "function") onError(error);
        }
      );
  }



  function renderModalMessages(listEl, messages, currentUserId) {
    if (!listEl) return;
    if (!messages.length) {
      listEl.innerHTML = '<p class="aurum-chat-empty">Envoyez le premier message au vendeur.</p>';
      return;
    }

    listEl.innerHTML = messages
      .map((message) => {
        const mine = message.senderId === currentUserId;
        const cssClass = mine ? "mine" : "theirs";
        return `
          <div class="aurum-chat-bubble ${cssClass}">
            <p>${message.text || ""}</p>
          </div>
        `;
      })
      .join("");

    listEl.scrollTop = listEl.scrollHeight;
  }

  function initModalRealtimeThread(modal, currentUserId) {
    const chatId = modal.dataset.chatId;
    const messagesEl = modal.querySelector("[data-chat-messages]");

    if (modal._unsubscribeMessages) {
      modal._unsubscribeMessages();
      modal._unsubscribeMessages = null;
    }

    modal._unsubscribeMessages = subscribeMessages(
      chatId,
      (messages) => renderModalMessages(messagesEl, messages, currentUserId),
      () => {
        if (messagesEl) {
          messagesEl.innerHTML = '<p class="aurum-chat-empty">Impossible de charger les messages.</p>';
        }
      }
    );
  }

  async function handleModalSend(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const modal = form.closest(".aurum-chat-modal");
    const input = form.querySelector("textarea");
    const submitBtn = form.querySelector("button[type='submit']");

    if (!modal || !input) return;

    const text = input.value;
    if (!normalizeText(text)) return;

    submitBtn.disabled = true;
    try {
      await sendMessage(modal.dataset.shopId, text, {
        sellerId: modal.dataset.sellerId,
        productId: modal.dataset.productId
      });
      input.value = "";
    } catch (error) {
      if (typeof window.showToast === "function") {
        window.showToast(error.message || "Envoi impossible.", "danger");
      }
    } finally {
      submitBtn.disabled = false;
    }
  }

  function closeSellerChatModal() {
    const modal = document.getElementById("aurum-chat-modal");
    if (!modal) return;

    modal.classList.remove("active");
    document.body.style.overflow = "";

    if (modal._unsubscribeMessages) {
      modal._unsubscribeMessages();
      modal._unsubscribeMessages = null;
    }
  }

  function initChatModalBindings() {
    const modal = document.getElementById("aurum-chat-modal");
    if (!modal || modal.dataset.bound === "1") return;

    const closeButtons = modal.querySelectorAll("[data-close-chat]");
    closeButtons.forEach((button) => {
      button.addEventListener("click", closeSellerChatModal);
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeSellerChatModal();
    });

    const form = modal.querySelector("[data-chat-form]");
    if (form) {
      form.addEventListener("submit", handleModalSend);
    }

    modal.dataset.bound = "1";
  }

  // Returns relative time label from a Firestore Timestamp object.
  function formatChatTime(ts) {
    if (!ts || !ts.seconds) return "";
    const date = new Date(ts.seconds * 1000);
    const now  = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60)     return "À l'instant";
    if (diff < 3600)   return `${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  // Sends a reply in an EXISTING conversation (used by clients replying
  // and by sellers responding to buyers). Does not create a new chat.
  async function sendReply(chatId, text) {
    const { db } = ensureFirebaseReady();
    const user = requireAuthUser();

    const normalizedText = normalizeText(text);
    if (!normalizedText) throw new Error("Le message est vide.");

    const chatRef  = db.collection("chats").doc(chatId);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) throw new Error("Conversation introuvable.");

    const chatData = chatSnap.data() || {};
    if (!Array.isArray(chatData.participantIds) || !chatData.participantIds.includes(user.uid)) {
      throw new Error("Accès non autorisé à cette conversation.");
    }

    const safeText        = sanitizeMessage(normalizedText);
    const hasMaskedContent = safeText.includes(MASK_TEXT);

    await chatRef.collection("messages").doc().set({
      senderId:         user.uid,
      senderName:       user.displayName || user.email || "Utilisateur",
      text:             safeText,
      hasMaskedContent,
      type:             "text",
      createdAt:        firebase.firestore.FieldValue.serverTimestamp()
    });

    await chatRef.update({
      updatedAt:      firebase.firestore.FieldValue.serverTimestamp(),
      lastMessage:    safeText,
      lastMessageAt:  firebase.firestore.FieldValue.serverTimestamp()
    });

    return { chatId, sanitizedText: safeText, hasMaskedContent };
  }

  window.sanitizeMessage = sanitizeMessage;
  window.formatChatTime  = formatChatTime;
  window.buildChatId = buildChatId;
  window.ensureChat = ensureChat;
  window.sendMessage = sendMessage;
  window.sendReply   = sendReply;
  window.subscribeMessages = subscribeMessages;
  // NOTE: subscribeUserChats est exporté plus bas dans la 2ème IIFE (ligne 1660)
  window.resolveSellerIdFromShop = resolveSellerIdFromShop;
  // NOTE: openSellerChat est assigné DIRECTEMENT en bas du fichier (version débogage extérieur)
  window.closeSellerChatModal = closeSellerChatModal;
  window.initChatModalBindings = initChatModalBindings;
  window.AURUM_CHAT_MASK = MASK_TEXT;
})();

/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — messaging.js  v2
 * Moteur de messagerie temps réel (Firestore)
 * ═══════════════════════════════════════════════════════════════
 *
 * SCHÉMA FIRESTORE
 * ─────────────────
 * conversations/{chatId}
 *   ├── buyerId         string   (uid acheteur)
 *   ├── buyerName       string
 *   ├── buyerEmail      string
 *   ├── sellerId        string   (uid vendeur / ownerUid de shop)
 *   ├── shopId          string
 *   ├── shopName        string
 *   ├── productId       string   (produit déclencheur, optionnel)
 *   ├── lastMessage     string   (extrait du dernier message)
 *   ├── lastMessageAt   Timestamp
 *   ├── lastSenderId    string
 *   ├── unreadBuyer     number   (messages non lus par l'acheteur)
 *   ├── unreadSeller    number   (messages non lus par le vendeur)
 *   ├── participants    string[] [buyerId, sellerId]
 *   ├── archived        boolean  (false par défaut)
 *   ├── createdAt       Timestamp
 *   └── updatedAt       Timestamp
 *
 * conversations/{chatId}/messages/{msgId}
 *   ├── senderId          string
 *   ├── senderName        string
 *   ├── text              string   (sanitisé — sans emails/tél)
 *   ├── hasMaskedContent  boolean  (true si du contenu a été masqué)
 *   ├── type              'text' | 'order_ref' | 'product_ref'
 *   ├── ref               {id, name, url}  (optionnel)
 *   ├── read              boolean
 *   └── createdAt         Timestamp
 *
 * ── SECURITY RULES À DÉPLOYER ──────────────────────────────────
 * match /conversations/{chatId} {
 *   allow read, update: if request.auth != null
 *     && request.auth.uid in resource.data.participants;
 *   allow create: if request.auth != null;
 *   match /messages/{msgId} {
 *     allow read: if request.auth != null
 *       && request.auth.uid in
 *          get(/databases/$(database)/documents/conversations/$(chatId))
 *          .data.participants;
 *     allow create: if request.auth != null
 *       && request.auth.uid in
 *          get(/databases/$(database)/documents/conversations/$(chatId))
 *          .data.participants
 *       && request.resource.data.senderId == request.auth.uid;
 *   }
 * }
 *
 * ── API PUBLIQUE (window.*) ─────────────────────────────────────
 *
 * window.openSellerChat({shopId, sellerId, shopName, sellerName, productId})
 *   → Ouvre le panneau chat flottant (product.html)
 *
 * window.subscribeUserChats(uid, onData, onError?)
 *   → Écoute toutes les conversations d'un utilisateur
 *   → Retourne unsubscribe()
 *
 * window.subscribeShopChats(shopId, onData, onError?)
 *   → Écoute toutes les conversations d'une boutique
 *   → Retourne unsubscribe()
 *
 * window.subscribeMessages(chatId, onData, onError?)
 *   → Écoute les messages d'une conversation en temps réel
 *   → Retourne unsubscribe()
 *
 * window.openConversation(chatId, container, opts?)
 *   → Monte un thread complet dans un élément DOM
 *   → Retourne { unsubscribe, markRead }
 *
 * window.sendReply(chatId, text)
 *   → Envoie un message dans une conversation existante
 *   → Promise<void>
 *
 * window.sendMessage(shopId, text, opts?)
 *   → Crée ou trouve une conversation puis envoie
 *   → Promise<string> chatId
 *
 * window.getTotalUnread(uid, role?)
 *   → Promise<number>
 *
 * window.buildChatId(buyerId, shopId)
 *   → string — chatId déterministe
 *
 * window.formatChatTime(ts)
 *   → string — temps humain (À l'instant, il y a Xmin, hier…)
 *
 * window.getOrCreateConversation({shopId, sellerId, shopName, sellerName, productId})
 *   → Promise<string> chatId
 *
 * ═══════════════════════════════════════════════════════════════
 */

(function (window) {
  'use strict';

  // ── GUARD ──────────────────────────────────────────────────────
  if (window.__aurumMessagingLoaded) return;
  window.__aurumMessagingLoaded = true;

  const COLL = 'chats';  // ← IMPORTANT: Collection 'chats' (avec règles Firestore strictes)
  const MSGS = 'messages';

  // ── PRIVATE HELPERS ───────────────────────────────────────────

  function getDb() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      throw new Error('Firebase non initialisé. Vérifiez config.js.');
    }
    return firebase.firestore();
  }

  function currentUser() {
    const user = typeof firebase !== 'undefined' && firebase.auth().currentUser;
    if (!user) throw new Error('Vous devez être connecté pour utiliser la messagerie.');
    return user;
  }

  function tsNow() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Masque emails et numéros de téléphone pour forcer
   * les échanges à rester sur la plateforme.
   */
  function sanitizeText(raw) {
    const emailRx = /[\w.+\-]+@[\w\-]+\.[a-z]{2,}/gi;
    const phoneRx = /(\+?[\d][\d\s\-().]{6,}[\d])/g;
    let masked = false;
    let text = raw
      .replace(emailRx, () => { masked = true; return '[email masqué]'; })
      .replace(phoneRx, (m) => {
        const digits = m.replace(/\D/g, '');
        if (digits.length >= 8) { masked = true; return '[téléphone masqué]'; }
        return m;
      })
      .trim();
    return { text, hasMaskedContent: masked };
  }

  // ── PUBLIC: formatChatTime ─────────────────────────────────────

  function formatChatTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
    const now = new Date();
    const diff = now - d;
    if (diff < 60000)   return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayDiff = Math.round((today - msgDay) / 86400000);
    if (dayDiff === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (dayDiff === 1) return 'Hier';
    if (dayDiff < 7) {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days[d.getDay()];
    }
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  function formatDateLabel(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayDiff = Math.round((today - msgDay) / 86400000);
    if (dayDiff === 0) return "Aujourd'hui";
    if (dayDiff === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // ── getOrCreateConversation ───────────────────────────────────

  /**
   * Crée ou récupère une conversation existante.
   * IMPORTANT: Utilise la collection 'chats' (conforme aux règles Firestore).
   */
  async function getOrCreateConversation({ shopId, sellerId, shopName, sellerName, productId }) {
    const user = currentUser();
    const db   = getDb();

    // ═══════════════════════════════════════════════════════════════════════════
    // SÉCURITÉ STRICTE: Valider TOUS les paramètres AVANT de les utiliser
    // ═══════════════════════════════════════════════════════════════════════════
    const safeUid = String(user.uid || "").trim();
    const safeSellerId = String(sellerId || "").trim();
    const safeShopId = String(shopId || "").trim();
    const safeProductId = String(productId || "").trim();

    // Vérifications strictes
    if (!safeUid) {
      throw new Error("[Security] UID acheteur invalide ou vide.");
    }
    if (!safeSellerId) {
      throw new Error("[Security] UID vendeur introuvable pour cette boutique.");
    }
    if (!safeShopId) {
      throw new Error("[Security] Identifiant boutique invalide ou vide.");
    }

    const chatId = buildChatId(safeUid, safeSellerId, safeShopId);
    const ref    = db.collection('chats').doc(chatId);  // ← Use 'chats', not 'conversations'

    // Ignorer les erreurs de permission lors du .get()
    let snap = null;
    try {
      snap = await ref.get();
    } catch (err) {
      // Permission denied = conversation n'existe pas ou acheteur n'est pas dans participants
      if (err.code === 'permission-denied') {
        console.warn('[Messaging] Permission denied on getOrCreateConversation.get() - will create', err);
        snap = { exists: false };
      } else {
        throw err;
      }
    }

    if (snap.exists) return chatId;

    // Récupérer le nom de l'acheteur depuis Firestore/users si dispo
    let buyerName  = user.displayName || user.email?.split('@')[0] || 'Client';
    let buyerEmail = user.email || '';
    try {
      const uSnap = await db.collection('users').doc(safeUid).get();
      if (uSnap.exists) {
        const ud = uSnap.data();
        buyerName  = ud.name || ud.displayName || ud.firstName || buyerName;
        buyerEmail = ud.email || buyerEmail;
      }
    } catch (_) { /* silencieux */ }

    // ← IMPORTANT: participantIds DOIT contenir l'acheteur ET le vendeur (ordre importe pas)
    // Les règles Firestore exigent:
    // - participantIds.size() == 2
    // - participantIds.hasAll([buyerId, sellerId])
    const participantIds = [safeUid, safeSellerId];  // Ordre: acheteur, vendeur

    try {
      await ref.set({
        buyerId:       safeUid,           // String, non-vide
        buyerName:     buyerName || 'Acheteur',
        buyerEmail:    buyerEmail || '',
        sellerId:      safeSellerId,      // String, non-vide
        shopId:        safeShopId,        // String, non-vide
        shopName:      String(shopName || 'Boutique'),
        sellerName:    String(sellerName || shopName || 'Vendeur'),
        productId:     safeProductId || null,
        lastMessage:   '',
        lastMessageAt: null,
        lastSenderId:  '',
        unreadBuyer:   0,
        unreadSeller:  0,
        participantIds: participantIds,   // Array de taille 2 (OBLIGATOIRE)
        archived:      false,
        createdAt:     tsNow(),
        updatedAt:     tsNow(),
      });

      console.log("[Messaging] getOrCreateConversation created:", { buyerId: safeUid, sellerId: safeSellerId, shopId: safeShopId, chatId });
    } catch (createErr) {
      console.error("[Messaging] getOrCreateConversation create error:", {
        code: createErr.code,
        message: createErr.message,
        params: { buyerId: safeUid, sellerId: safeSellerId, shopId: safeShopId }
      });
      throw createErr;
    }

    return chatId;
  }

  // ── sendReply (conv existante) ────────────────────────────────

  async function sendReply(chatId, rawText) {
    console.log('💬 [SENDREPLY] Starting sendReply');
    console.log('   chatId:', chatId);
    console.log('   Raw text length:', rawText.length);
    
    const user = currentUser();
    const db   = getDb();
    console.log('   User:', user ? user.uid : 'NO USER');

    const { text, hasMaskedContent } = sanitizeText(rawText);
    console.log('   Sanitized text length:', text.length, '| hasMaskedContent:', hasMaskedContent);
    
    if (!text) {
      console.error('❌ [SENDREPLY] Text is empty after sanitization');
      throw new Error('Message vide.');
    }

    console.log('📥 [SENDREPLY] Getting conversation document...');
    const convSnap = await db.collection(COLL).doc(chatId).get();
    if (!convSnap.exists) {
      console.error('❌ [SENDREPLY] Conversation does not exist:', chatId);
      throw new Error('Conversation introuvable.');
    }
    const conv = convSnap.data();
    console.log('✅ [SENDREPLY] Conv found. buyerId:', conv.buyerId, '| current user:', user.uid);

    const isBuyer    = conv.buyerId === user.uid;
    const senderName = String(isBuyer 
      ? (conv.buyerName || user.displayName || user.email || 'Acheteur')
      : (conv.sellerName || conv.shopName || user.displayName || 'Vendeur')
    );
    const preview    = text.length > 80 ? text.slice(0, 80) + '…' : text;
    console.log('   Is buyer:', isBuyer, '| Sender name:', senderName);

    const batch   = db.batch();
    const msgRef  = db.collection(COLL).doc(chatId).collection(MSGS).doc();
    console.log('   Creating message doc with ID:', msgRef.id);

    batch.set(msgRef, {
      senderId:         user.uid,
      senderName:       senderName || 'Utilisateur',
      text:             text || '',
      hasMaskedContent: Boolean(hasMaskedContent),
      type:             'text',
      ref:              null,
      read:             false,
      createdAt:        tsNow(),
    });

    const convUpdate = {
      lastMessage:   preview,
      lastMessageAt: tsNow(),
      lastSenderId:  user.uid,
      updatedAt:     tsNow(),
    };
    if (isBuyer) {
      convUpdate.unreadSeller = firebase.firestore.FieldValue.increment(1);
    } else {
      convUpdate.unreadBuyer  = firebase.firestore.FieldValue.increment(1);
    }

    batch.update(db.collection(COLL).doc(chatId), convUpdate);
    console.log('📤 [SENDREPLY] Committing batch to Firestore...');
    
    try {
      await batch.commit();
      console.log('✅ [SENDREPLY] Batch committed successfully!');
    } catch (err) {
      console.error('❌ [SENDREPLY] Batch commit failed:', err);
      throw err;
    }
  }

  // ── sendMessage (crée la conv si besoin) ─────────────────────

  async function sendMessage(shopId, rawText, opts = {}) {
    console.log('📤 [SENDMESSAGE] Starting sendMessage');
    console.log('   shopId:', shopId);
    console.log('   Text length:', rawText.length);
    console.log('   opts:', opts);
    
    try {
      const chatId = await getOrCreateConversation({
        shopId,
        sellerId:   opts.sellerId   || '',
        shopName:   opts.shopName   || '',
        sellerName: opts.sellerName || '',
        productId:  opts.productId  || '',
      });
      console.log('✅ [SENDMESSAGE] Created/got chatId:', chatId);
      
      await sendReply(chatId, rawText);
      console.log('✅ [SENDMESSAGE] Reply sent, returning chatId:', chatId);
      return chatId;
    } catch (err) {
      console.error('❌ [SENDMESSAGE] Error:', err);
      throw err;
    }
  }

  // ── markConversationRead ──────────────────────────────────────

  async function markConversationRead(chatId) {
    try {
      const user = currentUser();
      const db   = getDb();
      const snap = await db.collection(COLL).doc(chatId).get();
      if (!snap.exists) return;
      const conv  = snap.data();
      const field = conv.buyerId === user.uid ? 'unreadBuyer' : 'unreadSeller';
      await db.collection(COLL).doc(chatId).update({ [field]: 0 });
    } catch (_) { /* silencieux */ }
  }

  // ── subscribeUserChats ────────────────────────────────────────

  function subscribeUserChats(uid, onData, onError) {
    const db = getDb();
    return db.collection(COLL)
      .where('participantIds', 'array-contains', uid)  // ← CORRIGÉ : 'participantIds' (pas 'participants')
      .orderBy('updatedAt', 'desc')
      .limit(60)
      .onSnapshot(
        snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err  => { console.error('[messaging] subscribeUserChats:', err); onError && onError(err); }
      );
  }

  // ── subscribeShopChats ────────────────────────────────────────

  function subscribeShopChats(shopId, onData, onError) {
    const db = getDb();
    return db.collection(COLL)
      .where('shopId', '==', shopId)
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .onSnapshot(
        snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err  => { console.error('[messaging] subscribeShopChats:', err); onError && onError(err); }
      );
  }

  // ── subscribeMessages ─────────────────────────────────────────

  function subscribeMessages(chatId, onData, onError) {
    const db = getDb();
    return db.collection(COLL).doc(chatId)
      .collection(MSGS)
      .orderBy('createdAt', 'asc')
      .onSnapshot(
        snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err  => { console.error('[messaging] subscribeMessages:', err); onError && onError(err); }
      );
  }

  // ── getTotalUnread ────────────────────────────────────────────

  async function getTotalUnread(uid, role = 'buyer') {
    try {
      const db   = getDb();
      const snap = await db.collection(COLL)
        .where('participantIds', 'array-contains', uid)
        .get();
      const field = role === 'seller' ? 'unreadSeller' : 'unreadBuyer';
      return snap.docs.reduce((acc, d) => acc + (d.data()[field] || 0), 0);
    } catch (_) { return 0; }
  }

  // ── openConversation (embed dans un container DOM) ────────────

  function openConversation(chatId, container, opts = {}) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return { unsubscribe: () => {}, markRead: () => {} };

    let user;
    try { user = currentUser(); } catch (_) {
      return { unsubscribe: () => {}, markRead: () => {} };
    }

    _injectThreadStyles();

    container.innerHTML = `
      <div class="amt-thread">
        <div class="amt-body" id="amt-body-${chatId}">
          <div class="amt-loading">Chargement…</div>
        </div>
        <form class="amt-form" id="amt-form-${chatId}" autocomplete="off">
          <textarea class="amt-input" placeholder="Votre message… (emails et numéros masqués automatiquement)" maxlength="1200" rows="2"></textarea>
          <div class="amt-form-foot">
            <span class="amt-hint">↵ Envoyer · Maj+↵ Saut de ligne</span>
            <button type="submit" class="amt-send-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Envoyer
            </button>
          </div>
        </form>
      </div>`;

    const body     = container.querySelector(`#amt-body-${chatId}`);
    const form     = container.querySelector(`#amt-form-${chatId}`);
    const textarea = form.querySelector('textarea');

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.dispatchEvent(new Event('submit')); }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const raw = textarea.value.trim();
      if (!raw) return;
      const btn = form.querySelector('.amt-send-btn');
      btn.disabled = true;
      try {
        await sendReply(chatId, raw);
        textarea.value = '';
        textarea.style.height = 'auto';
      } catch (err) {
        if (window.showToast) window.showToast(err.message, 'error');
        else console.error(err);
      } finally {
        btn.disabled = false;
      }
    });

    const unsubMsgs = subscribeMessages(chatId, msgs => {
      if (!msgs.length) {
        body.innerHTML = '<p class="amt-empty">Commencez la conversation…</p>';
        return;
      }
      let html = '';
      let lastDateLabel = '';
      msgs.forEach(msg => {
        const isMine  = msg.senderId === user.uid;
        const label   = formatDateLabel(msg.createdAt);
        if (label && label !== lastDateLabel) {
          html += `<div class="amt-date-sep">${label}</div>`;
          lastDateLabel = label;
        }
        const timeStr = formatChatTime(msg.createdAt);
        const lock    = msg.hasMaskedContent ? '<span class="amt-lock" title="Coordonnées masquées">🔒</span>' : '';
        html += `
          <div class="amt-row ${isMine ? 'mine' : 'theirs'}">
            <div class="amt-bubble ${isMine ? 'mine' : 'theirs'}">
              <p>${escapeHtml(msg.text)}</p>
              <div class="amt-meta">${lock}<span>${timeStr}</span></div>
            </div>
          </div>`;
      });
      body.innerHTML = html;
      requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
    });

    markConversationRead(chatId);

    return {
      unsubscribe: () => unsubMsgs(),
      markRead:    () => markConversationRead(chatId),
    };
  }

  // ── openSellerChat (floating modal depuis product.html) ────────

  let _floatUnsub     = null;
  let _floatChatId    = null;

  window.openSellerChat = async function(sellerIdArg, shopIdArg) {
    console.log("🚀 [DEBUG] Lancement openSellerChat avec :", sellerIdArg, shopIdArg);

    // ═══════════════════════════════════════════════════════════════════════════
    // CORRECTIF ANTI-[object Object] : Extraction sûre des paramètres
    // Gère le cas où on reçoit un objet entier au lieu de deux chaînes
    // ═══════════════════════════════════════════════════════════════════════════
    let realSellerId = sellerIdArg;
    let realShopId = shopIdArg;

    if (typeof sellerIdArg === 'object' && sellerIdArg !== null) {
      console.warn("[DEBUG] ⚠️  DÉTECTÉ : Premier paramètre est un OBJET, extraction en cours...");
      console.warn("[DEBUG] Objet reçu:", sellerIdArg);
      
      // On extrait les vraies valeurs depuis l'objet
      realSellerId = sellerIdArg.sellerId || sellerIdArg.ownerId || sellerIdArg.uid || sellerIdArg.userId;
      realShopId = sellerIdArg.shopId || sellerIdArg.id || shopIdArg;
      
      console.log("[DEBUG] ✓ Extraction complétée: realSellerId=" + realSellerId + ", realShopId=" + realShopId);
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      alert("Veuillez vous connecter pour contacter le vendeur.");
      return;
    }

    const db = firebase.firestore();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FORMATAGE STRICT POUR FIRESTORE RULES
    // ═══════════════════════════════════════════════════════════════════════════
    const uid = String(currentUser.uid || "").trim();
    const safeSellerId = String(realSellerId || "").trim();
    const safeShopId = String(realShopId || "shop_inconnu").trim();

    console.log("[DEBUG] Paramètres formatés - uid:", uid, "safeSellerId:", safeSellerId, "safeShopId:", safeShopId);

    // Validation basique
    if (uid === safeSellerId) {
      if (typeof window.showToast === "function") {
        window.showToast("❌ Vous ne pouvez pas démarrer une conversation avec vous-même.", "warning");
      }
      console.warn("[DEBUG] Tentative d'auto-conversation bloquée");
      return;
    }

    if (!uid) {
      alert("Erreur: L'UID acheteur est invalide ou vide.");
      return;
    }
    if (!safeSellerId) {
      alert("Erreur: L'identifiant du vendeur est introuvable.");
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: TEST DE LECTURE (Query) - BLOC SÉPARÉ
    // ═══════════════════════════════════════════════════════════════════════════
    let existingChatId = null;
    try {
      console.log("[DEBUG] ✓ PHASE 1 - Recherche d'une conversation existante...");
      console.log("[DEBUG]   Collection: 'chats'");
      console.log("[DEBUG]   Query: where('participantIds', 'array-contains', '" + uid + "')");

      const chatQuery = await db.collection('chats')
        .where('participantIds', 'array-contains', uid)
        .get();

      console.log("[DEBUG] ✓ Query réussie, documents trouvés:", chatQuery.size);

      chatQuery.forEach(doc => {
        const data = doc.data();
        console.log("[DEBUG]   - Doc ID:", doc.id, "| sellerId:", data.sellerId, "| shopId:", data.shopId);
        if (data.sellerId === safeSellerId && data.shopId === safeShopId) {
          existingChatId = doc.id;
          console.log("[DEBUG] ✓ MATCH trouvé:", existingChatId);
        }
      });

      console.log("[DEBUG] ✓ READ successful!");
    } catch (error) {
      console.error("❌ ERREUR DE LECTURE (PHASE 1):", {
        code: error.code,
        message: error.message,
        fullError: error
      });
      if (typeof window.showToast === "function") {
        window.showToast(
          "❌ Erreur de permission lors de la vérification de la messagerie.\n" +
          "Code: " + (error.code || "unknown"),
          "danger"
        );
      }
      return;
    }

    if (existingChatId) {
      console.log("[DEBUG] ✓ Conversation existante trouvée, redirection vers:", existingChatId);
      window.location.href = `/messages.html?chat=${existingChatId}`;
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: TEST D'ÉCRITURE (Création) - BLOC SÉPARÉ
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      console.log("[DEBUG] ✓ PHASE 2 - Création d'une nouvelle conversation...");

      // 1. GÉNÉRER L'ID DÉTERMINISTE (Crucial pour éviter les doublons) 
      const chatId = window.buildChatId(uid, safeSellerId, safeShopId);
      console.log("[DEBUG]   Génération ID déterministe:", chatId);

      // 2. Récupérer les infos boutique depuis Firebase
      let shopName = '';
      let sellerName = '';
      let buyerName = currentUser.displayName || currentUser.email || 'Client';
      try {
        const shopSnap = await db.collection('shops').doc(safeShopId).get();
        if (shopSnap.exists) {
          const shopData = shopSnap.data();
          shopName = shopData.name || '';
          sellerName = shopData.ownerName || '';
        }
        console.log("[DEBUG]   Shop infos loaded: name=" + shopName + ", owner=" + sellerName);
      } catch (e) {
        console.warn("[DEBUG]   Shop lookup optional, continuing without shop data");
      }

      const newChatData = {
        buyerId: uid,                           // ← String, non-vide
        buyerName: buyerName,
        sellerId: safeSellerId,                // ← String, non-vide
        sellerName: sellerName || 'Vendeur',  // ← Fallback obligatoire
        shopId: safeShopId,                    // ← String, non-vide
        shopName: shopName || 'Boutique',      // ← Fallback obligatoire
        participantIds: [uid, safeSellerId], // ← Array de taille 2 (OBLIGATOIRE!)
        createdBy: uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastMessage: "",
        lastMessageAt: null,
        unreadBuyer: 0,
        unreadSeller: 0
      };

      console.log("[DEBUG]   Data à créer:", newChatData);
      console.log("[DEBUG]   Vérification Firestore Rules:");
      console.log("[DEBUG]     ✓ buyerId is string:", typeof newChatData.buyerId === 'string');
      console.log("[DEBUG]     ✓ sellerId is string:", typeof newChatData.sellerId === 'string');
      console.log("[DEBUG]     ✓ shopId is string:", typeof newChatData.shopId === 'string');
      console.log("[DEBUG]     ✓ buyerId != sellerId:", newChatData.buyerId !== newChatData.sellerId);
      console.log("[DEBUG]     ✓ participantIds is list:", Array.isArray(newChatData.participantIds));
      console.log("[DEBUG]     ✓ participantIds.size == 2:", newChatData.participantIds.length === 2);
      console.log("[DEBUG]     ✓ participantIds.hasAll([buyerId, sellerId]):", 
        newChatData.participantIds.includes(newChatData.buyerId) && 
        newChatData.participantIds.includes(newChatData.sellerId));

      // UTILISER .set() AU LIEU DE .add() POUR ID DÉTERMINISTE
      await db.collection('chats').doc(chatId).set(newChatData);

      console.log("[DEBUG] ✓ Conversation créée avec succès!");
      console.log("[DEBUG]   ID Déterministe:", chatId);
      console.log("[DEBUG] ═══════════════════════════════════════════════════════════");
      window.location.href = `/messages.html?chat=${chatId}`;
    } catch (error) {
      console.error("❌ ERREUR D'ÉCRITURE (PHASE 2):", {
        code: error.code,
        message: error.message,
        fullError: error
      });
      if (typeof window.showToast === "function") {
        window.showToast(
          "❌ Erreur de permission lors de la création de la conversation.\n" +
          "Code: " + (error.code || "unknown"),
          "danger"
        );
      }
    }
  };

  // ── inject styles pour openConversation ──────────────────────

  function _injectThreadStyles() {
    if (document.getElementById('_aurum-thread-css')) return;
    const s = document.createElement('style');
    s.id    = '_aurum-thread-css';
    s.textContent = `
      .amt-thread{display:flex;flex-direction:column;height:100%;min-height:0}
      .amt-body{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:2px;scroll-behavior:smooth;min-height:0}
      .amt-body::-webkit-scrollbar{width:3px}
      .amt-body::-webkit-scrollbar-thumb{background:rgba(200,168,75,.2);border-radius:2px}
      .amt-loading,.amt-empty{font-size:13px;color:#7A7570;text-align:center;margin:auto;font-style:italic;padding:32px 0}
      .amt-date-sep{text-align:center;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#4A4540;padding:14px 0 6px;font-weight:600;user-select:none}
      .amt-row{display:flex;margin-bottom:6px}
      .amt-row.mine{justify-content:flex-end}
      .amt-row.theirs{justify-content:flex-start}
      .amt-bubble{max-width:72%;display:flex;flex-direction:column}
      .amt-bubble p{padding:10px 14px;font-size:13px;line-height:1.55;word-break:break-word;margin:0}
      .amt-bubble.mine p{background:#C8A84B;color:#0B0A08;border-radius:14px 14px 2px 14px}
      .amt-bubble.theirs p{background:#2C2A27;color:#FEFCF8;border-radius:14px 14px 14px 2px}
      .amt-meta{display:flex;align-items:center;gap:4px;font-size:9px;color:#4A4540;padding:4px 4px 0;letter-spacing:.04em}
      .amt-row.mine .amt-meta{justify-content:flex-end}
      .amt-lock{font-size:9px;opacity:.7}
      .amt-form{border-top:1px solid rgba(200,168,75,.1);padding:14px 18px;background:#1A1916;flex-shrink:0}
      .amt-input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(200,168,75,.14);color:#FEFCF8;font-family:'Syne',sans-serif;font-size:13px;padding:10px 14px;resize:none;outline:none;box-sizing:border-box;transition:border-color .2s;line-height:1.5}
      .amt-input:focus{border-color:#C8A84B}
      .amt-input::placeholder{color:#4A4540}
      .amt-form-foot{display:flex;align-items:center;justify-content:space-between;margin-top:9px}
      .amt-hint{font-size:9px;color:#4A4540;letter-spacing:.04em}
      .amt-send-btn{background:#C8A84B;color:#0B0A08;border:none;padding:9px 18px;font-family:'Unbounded',sans-serif;font-size:8px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;display:inline-flex;align-items:center;gap:6px;transition:background .2s;cursor:pointer}
      .amt-send-btn:hover{background:#E2C56A}
      .amt-send-btn:disabled{opacity:.45;pointer-events:none}
      .aurum-chat-bubble{display:flex;flex-direction:column;max-width:82%;margin-bottom:10px}
      .aurum-chat-bubble.mine{align-self:flex-end;align-items:flex-end}
      .aurum-chat-bubble.theirs{align-self:flex-start}
      .aurum-chat-bubble span{padding:10px 14px;font-size:13px;line-height:1.5;word-break:break-word;display:block}
      .aurum-chat-bubble.mine span{background:#C8A84B;color:#0B0A08;border-radius:12px 12px 2px 12px}
      .aurum-chat-bubble.theirs span{background:#2C2A27;color:#FEFCF8;border-radius:12px 12px 12px 2px}
      .aurum-chat-bubble small{font-size:9px;color:#4A4540;margin-top:3px;padding:0 4px;letter-spacing:.04em}
    `;
    document.head.appendChild(s);
  }

  // ── EXPORTS ───────────────────────────────────────────────────

  // NOTE: openSellerChat is exported DIRECTLY as a simple async function BELOW this IIFE
  window.subscribeUserChats      = subscribeUserChats;
  window.subscribeShopChats      = subscribeShopChats;
  window.subscribeMessages       = subscribeMessages;
  window.openConversation        = openConversation;
  window.sendReply               = sendReply;
  window.sendMessage             = sendMessage;
  window.sendAurumMessage        = sendReply;   // alias compat
  window.getTotalUnread          = getTotalUnread;
  window.buildChatId             = buildChatId;
  window.formatChatTime          = formatChatTime;
  window.getOrCreateConversation = getOrCreateConversation;

  // Objet utilitaire pour messages.html
  window._aurumMsg = {
    formatChatTime,
    formatDateLabel,
    escapeHtml,
    markConversationRead,
    sanitizeText,
  };

})(window);