 
  // ══════════════════════════════════════════════
  //  SANHIA — invoice.js  (inline)
  // ══════════════════════════════════════════════

  const SANHIA_PHONE = '22664502626';

  /* ── HELPERS UI ── */
  function showToast(msg, type = 'ok', duration = 3500) {
    const t = document.getElementById('inv-toast');
    t.className = type;
    t.style.display = 'flex';
    t.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'err'
          ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
          : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'}
      </svg>
      <span>${msg}</span>`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.display = 'none'; }, duration);
  }

  function showError(msg) {
    const page = document.getElementById('inv-page');
    const loading = document.getElementById('inv-loading');
    const content = document.getElementById('inv-content');
    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';

    const banner = document.createElement('div');
    banner.className = 'inv-error';
    banner.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div>
        <div class="inv-error-title">Impossible d'afficher la facture</div>
        <div class="inv-error-sub">${msg}</div>
      </div>`;
    if (page) page.appendChild(banner);
  }

  function fmt(n) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
  }

  /* ── COMPTEUR FACTURE ── */
  async function getNextInvoiceNumber(db) {
    const ref = db.collection('meta').doc('invoiceCounter');
    try {
      return await db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const val = (snap.exists ? Number(snap.data().value || 0) : 0) + 1;
        tx.set(ref, { value: val }, { merge: true });
        return val;
      });
    } catch {
      const fallback = Number(localStorage.getItem('ac_inv_counter') || '0') + 1;
      localStorage.setItem('ac_inv_counter', String(fallback));
      return fallback;
    }
  }

  /* ── GÉNÉRATION PDF (html2canvas + jsPDF) ── */
  async function generatePdfBlob(invoiceRef) {
    const el = document.getElementById('invoice-document');
    if (!el) throw new Error('Élément facture introuvable');

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const W = 210, H = 297;
    const imgW = W;
    const imgH = (canvas.height * W) / canvas.width;
    let posY = 0;

    if (imgH <= H) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
    } else {
      // Découpe multi-page si nécessaire
      let remainH = imgH;
      while (remainH > 0) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, posY, imgW, imgH);
        remainH -= H;
        posY -= H;
        if (remainH > 0) pdf.addPage();
      }
    }

    return { blob: pdf.output('blob'), pdf, canvas };
  }

  /* ── TÉLÉCHARGEMENT PDF ── */
  async function downloadPDF(invoiceRef, btn) {
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Génération…';
    try {
      const { pdf } = await generatePdfBlob(invoiceRef);
      pdf.save(`Facture_${invoiceRef}.pdf`);
      showToast('Facture téléchargée avec succès');
    } catch (e) {
      console.error(e);
      showToast('Erreur lors du téléchargement', 'err');
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Télécharger PDF';
    }
  }

  /* ── ENVOI WHATSAPP AVEC IMAGE ── */
  async function sendWhatsApp(invoiceRef, totalStr, btn) {
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Préparation…';

    try {
      // 1. Capturer la facture en image
      const el = document.getElementById('invoice-document');
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // 2. Convertir en blob image
      const imgBlob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      // 3. Message texte
      const msg = `Bonjour Sanhia 👋\n\nJe viens de passer une commande.\n\n📄 *Référence :* ${invoiceRef}\n💰 *Montant total :* ${totalStr}\n\nPouvez-vous me confirmer les modalités de paiement ?\n\nMerci 🙏`;

      // 4. Stratégie d'envoi :
      //    Sur mobile — Web Share API avec fichier (partage natif)
      //    Sur desktop — ouvre WhatsApp Web avec le texte, puis propose le téléchargement de l'image

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile && navigator.canShare && navigator.canShare({ files: [new File([imgBlob], 'test.jpg', { type: 'image/jpeg' })] })) {
        // Partage natif avec image
        const file = new File([imgBlob], `Facture_${invoiceRef}.jpg`, { type: 'image/jpeg' });
        await navigator.share({
          files: [file],
          text: msg,
          title: `Facture ${invoiceRef} — Sanhia`,
        });
        showToast('Partage effectué !');
      } else {
        // Fallback : télécharge l'image ET ouvre WhatsApp avec le texte
        const imgUrl = URL.createObjectURL(imgBlob);
        const dlLink = document.createElement('a');
        dlLink.href = imgUrl;
        dlLink.download = `Facture_${invoiceRef}.jpg`;
        dlLink.click();
        setTimeout(() => URL.revokeObjectURL(imgUrl), 5000);

        // Petit délai pour que le téléchargement commence
        await new Promise(r => setTimeout(r, 800));

        const waUrl = `https://wa.me/${SANHIA_PHONE}?text=${encodeURIComponent(msg + '\n\n📎 _La facture est jointe en image ci-dessous._')}`;
        window.open(waUrl, '_blank');

        showToast('Image téléchargée. Joignez-la dans WhatsApp.', 'ok', 5000);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        showToast('Partage annulé');
      } else {
        console.error(e);
        // Fallback ultime : juste le lien WhatsApp
        const msg = `Bonjour Sanhia 👋\n\nCommande réf. ${invoiceRef} — Montant : ${totalStr}\n\nPouvez-vous confirmer les modalités de paiement ? Merci 🙏`;
        window.open(`https://wa.me/${SANHIA_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
        showToast('WhatsApp ouvert (image non disponible)', 'ok');
      }
    } finally {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Envoyer sur WhatsApp';
    }
  }

  /* ── RENDU FACTURE ── */
  function renderInvoice(order, docId) {
    try {
      document.getElementById('inv-loading').style.display = 'none';
      document.getElementById('inv-content').style.display = 'block';

      const date = order.createdAt
        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

      const invNum = order.invoiceNumber
        ? `AUR-${String(order.invoiceNumber).padStart(4, '0')}`
        : `AUR-${String(docId).substring(0, 6).toUpperCase()}`;

      // Remplir hero
      document.getElementById('hero-ref').textContent = invNum;
      document.getElementById('hero-date').textContent = date;

      // Remplir doc
      document.getElementById('inv-ref').textContent = invNum;
      document.getElementById('inv-date').textContent = date;
      document.getElementById('client-name').textContent = order.userName || 'Client';
      document.getElementById('client-phone').textContent = order.userPhone || 'Non renseigné';
      document.getElementById('client-email').textContent = order.userEmail || 'Non renseigné';

      // Articles
      const tbody = document.getElementById('invoice-items');
      tbody.innerHTML = '';
      let total = 0;

      (order.items || []).forEach(item => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty || item.quantity) || 1;
        const lineTotal = price * qty;
        total += lineTotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${String(item.name || 'Produit').substring(0, 80)}</td>
          <td style="text-align:right;">${qty}</td>
          <td style="text-align:right;">${fmt(price)}</td>
          <td style="text-align:right;">${fmt(lineTotal)}</td>`;
        tbody.appendChild(tr);
      });

      const totalStr = fmt(total);
      document.getElementById('inv-subtotal').textContent = totalStr;
      document.getElementById('inv-total').textContent = totalStr;

      // Boutons
      const btnDl = document.getElementById('btn-download');
      const btnWa = document.getElementById('btn-whatsapp');

      btnDl.addEventListener('click', () => downloadPDF(invNum, btnDl));
      btnWa.addEventListener('click', () => sendWhatsApp(invNum, totalStr, btnWa));

    } catch (err) {
      console.error(err);
      showError(`Erreur de rendu : ${err.message}`);
    }
  }

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');
    const page = document.getElementById('inv-page');

    // Afficher la page dès que le header est prêt
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
      page.style.display = 'block';
    }, 600);

    if (!window.firebase || !firebase.firestore || !firebase.auth) {
      showError('Firebase non initialisé. Vérifiez votre configuration.');
      return;
    }

    const db = firebase.firestore();
    const auth = firebase.auth();
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');

    document.getElementById('inv-loading').style.display = 'flex';

    auth.onAuthStateChanged(async user => {
      if (!user) {
        showError('Vous devez être connecté pour voir cette facture.');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
      }

      // ── Commande depuis le panier local (pas d'orderId) ──
      if (!orderId) {
        try {
          const raw = localStorage.getItem('ac_cart_checkout');
          const checkout = JSON.parse(raw || 'null');
          const items = Array.isArray(checkout)
            ? checkout
            : (checkout && Array.isArray(checkout.items) ? checkout.items : null);

          if (!items || items.length === 0) {
            showError('Aucune commande en cours. Passez d\'abord commande.');
            setTimeout(() => window.location.href = 'cart.html', 2000);
            return;
          }

          let invNum = (!Array.isArray(checkout) && checkout) ? checkout.invoiceNumber : null;
          if (!invNum) {
            invNum = await getNextInvoiceNumber(db);
            localStorage.setItem('ac_cart_checkout', JSON.stringify({ items, invoiceNumber: invNum }));
          }

          renderInvoice({
            userName: user.displayName || user.email || 'Client',
            userEmail: user.email || '',
            userPhone: '',
            createdAt: { seconds: Math.floor(Date.now() / 1000) },
            invoiceNumber: invNum,
            items: items.map(i => ({
              name: i.name || 'Produit',
              price: Number(i.price || 0),
              qty: Number(i.qty || i.quantity || 1),
            })),
          }, `LOCAL-${invNum}`);
        } catch (e) {
          console.error(e);
          showError('Erreur lors du chargement du panier.');
        }
        return;
      }

      // ── Commande depuis Firestore ──
      try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (!doc.exists) {
          showError('Commande introuvable. Vérifiez la référence.');
          return;
        }
        const order = doc.data();
        if (!order || !Array.isArray(order.items) || order.items.length === 0) {
          showError('Données de commande invalides ou vides.');
          return;
        }

        if (!order.invoiceNumber) {
          order.invoiceNumber = await getNextInvoiceNumber(db);
          await db.collection('orders').doc(orderId).set({ invoiceNumber: order.invoiceNumber }, { merge: true });
        }

        renderInvoice(order, doc.id);
      } catch (e) {
        console.error(e);
        const msg = e.code === 'permission-denied'
          ? 'Permissions insuffisantes pour accéder à cette commande.'
          : e.code === 'unavailable'
          ? 'Service temporairement indisponible. Réessayez dans un instant.'
          : 'Erreur lors du chargement de la commande.';
        showError(msg);
      }
    });
  });