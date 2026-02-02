// Génération et validation de factures (Aurum Events)
// Dépendances: utils.js (toast), data.js (Store), auth.js (Auth)

(function(){
  const { jsPDF } = window.jspdf || {};
  const WHATSAPP_PHONE = '22664502626';
  const SNAPCHAT_URL = 'https://www.snapchat.com/add/daren_allan?share_id=qyN3S3ExRJI&locale=fr-FR';

  function ensureInvoices(){
    if(!Array.isArray(Store.invoices)) Store.invoices = [];
  }

  function pad(num, size){
    let s = String(num);
    while(s.length < size) s = '0' + s;
    return s;
  }

  function getNextInvoiceNumber(){
    ensureInvoices();
    const next = (Store.invoices?.length || 0) + 1;
    return pad(next, 5);
  }

  function formatFCFA(v){
    try{ return new Intl.NumberFormat('fr-FR').format(Number(v)) + ' FCFA'; }catch(e){ return v + ' FCFA'; }
  }

  function buildInvoiceHTML(invoice){
    const logoPath = 'assets/img/logo.jpg';
    const companyInfo = `
      <div class="company-info">
        <img src="${logoPath}" alt="Aurum" class="invoice-logo" onerror="this.style.display='none'"/>
        <div>
          <h2>Aurum</h2>
          <div class="text-muted">Ouagadougou, Burkina Faso</div>
          <div class="text-muted">Email: aurumcorporate.d@gmail.com</div>
          <div class="text-muted">WhatsApp / MLE: +226 64 50 26 26</div>
        </div>
      </div>`;

    const customerInfo = `
      <div class="customer-info">
        <div><strong>Client:</strong> ${invoice.clientName}</div>
        <div><strong>Email:</strong> ${invoice.clientEmail}</div>
        <div><strong>Téléphone:</strong> ${invoice.clientPhone}</div>
      </div>`;

    const details = `
      <div class="invoice-details">
        <div><strong>Référence:</strong> AUR-${invoice.reference}</div>
        <div><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
        <div><strong>Mode de paiement:</strong> ${invoice.paymentMethod}</div>
      </div>`;

    const line = `
      <div class="invoice-line">
        <div class="desc">
          <div class="label">Description</div>
          <div>${invoice.serviceDescription}</div>
        </div>
        <div class="amount">
          <div class="label">Montant</div>
          <div>${formatFCFA(invoice.amount)}</div>
        </div>
      </div>`;

    const total = `
      <div class="invoice-total">
        <div>Total</div>
        <div>${formatFCFA(invoice.amount)}</div>
      </div>`;

    return `
      <div class="invoice-document">
        ${companyInfo}
        <hr/>
        ${customerInfo}
        ${details}
        <hr/>
        ${line}
        ${total}
      </div>
    `;
  }

  async function htmlToPdf(invoice){
    if(!jsPDF){ throw new Error('jsPDF non chargé'); }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const html = buildInvoiceHTML(invoice);

    // Essaye doc.html seulement si html2canvas est présent (sinon erreur)
    if(doc.html && window.html2canvas){
      try{
        const container = document.createElement('div');
        container.style.width = '595pt';
        container.innerHTML = html;
        document.body.appendChild(container);
        await doc.html(container, { x: 20, y: 20 });
        document.body.removeChild(container);
        return doc;
      }catch(err){
        console.warn('doc.html a échoué, bascule sur rendu texte', err);
      }
    }

    // Fallback: rendu texte simple (aucune dépendance)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    let y = 40;
    const line = (text)=>{ doc.text(text, 40, y); y += 20; };
    line(`Aurum - Facture AUR-${invoice.reference}`);
    line(`Client: ${invoice.clientName}`);
    line(`Email: ${invoice.clientEmail}`);
    line(`Téléphone: ${invoice.clientPhone}`);
    line(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`);
    line(`Paiement: ${invoice.paymentMethod}`);
    line(`Montant: ${formatFCFA(invoice.amount)}`);
    doc.text('Description:', 40, y + 10);
    doc.text(invoice.serviceDescription || '', 40, y + 30, { maxWidth: 500 });
    return doc;
  }

  function saveInvoice(invoice){
    ensureInvoices();
    Store.invoices.push(invoice);
    saveStore();
  }

  function sendAdminNotification(invoice){
    const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
    notifs.push({ type:'invoice_submitted', ref: invoice.reference, email: invoice.clientEmail, seller: invoice.sellerEmail || null, date: Date.now(), amount: invoice.amount });
    localStorage.setItem('ac_notifications', JSON.stringify(notifs));
  }

  function getWhatsAppUrl(message){
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    return url;
  }

  function getSnapchatShareUrl(){
    return SNAPCHAT_URL;
  }

  async function tryNativeShare(pdf, invoice, message){
    if(!pdf || !pdf.output || !navigator.share) return false;
    try{
      const blob = pdf.output('blob');
      const file = new File([blob], `Aurum_Invoice_AUR-${invoice.reference}.pdf`, { type:'application/pdf' });
      const payload = { title: `Facture AUR-${invoice.reference}`, text: message, files: [file] };
      if(navigator.canShare && !navigator.canShare(payload)) return false;
      await navigator.share(payload);
      return true;
    }catch(err){
      console.warn('Partage natif indisponible', err);
      return false;
    }
  }

  async function generateInvoiceFromOrder(orderId){
    const order = Store.orders?.find(o => o.id === orderId);
    if(!order){
      showToast('Commande introuvable', 'danger');
      return null;
    }

    const user = JSON.parse(localStorage.getItem('ac_currentUser')||'null');
    if(!user){
      showToast('Utilisateur non connecté', 'warning');
      return null;
    }

    // Créer une facture basée sur la commande
    const invoice = {
      id: 'inv-'+Date.now(),
      reference: getNextInvoiceNumber(),
      clientName: user.name || user.email.split('@')[0],
      clientEmail: user.email,
      clientPhone: user.phone || 'Non renseigné',
      serviceDescription: order.items.map(it => `${it.name} (x${it.qty})`).join(', '),
      amount: order.total,
      paymentMethod: order.meta?.method || 'Standard',
      date: new Date(order.date).toISOString(),
      createdAt: Date.now(),
      status: 'generated',
      orderId: order.id,
      sellerEmail: null
    };

    // Générer PDF
    let pdf;
    try{
      pdf = await htmlToPdf(invoice);
    }catch(err){
      showToast('Erreur lors de la génération PDF', 'danger');
      console.error(err);
      return null;
    }

    // Sauvegarder
    saveInvoice(invoice);
    return { invoice, pdf };
  }

  window.addEventListener('DOMContentLoaded', async ()=>{
    const form = document.getElementById('invoice-form');
    const preview = document.getElementById('invoice-preview');
    const previewContent = document.getElementById('invoice-preview-content');
    const refDiv = document.getElementById('invoice-reference');
    const btnDownload = document.getElementById('download-invoice-btn');
    const btnEmail = document.getElementById('email-invoice-btn');
    const btnWhatsApp = document.getElementById('whatsapp-invoice-btn');
    const btnSnap = document.getElementById('snapchat-invoice-btn');

    // Vérifier si on doit générer une facture à partir d'une commande
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if(orderId){
      // Afficher le banner de succès
      const successBanner = document.getElementById('order-success-banner');
      if(successBanner){
        successBanner.classList.remove('hidden');
        if(typeof lucide !== 'undefined') lucide.createIcons();
      }

      showToast('Génération de votre facture...', 'info');
      const result = await generateInvoiceFromOrder(orderId);
      if(result){
        const { invoice, pdf } = result;
        // Afficher la facture
        if(refDiv) refDiv.textContent = `Référence: AUR-${invoice.reference}`;
        if(previewContent) previewContent.innerHTML = buildInvoiceHTML(invoice);
        if(preview) preview.classList.remove('hidden');
        showToast('Facture générée avec succès', 'success');

        // Configurer les boutons d'action
        if(btnDownload){
          btnDownload.onclick = ()=>{
            pdf.save(`Aurum_Facture_AUR-${invoice.reference}.pdf`);
            showToast('Facture téléchargée', 'success');
          };
        }

        if(btnEmail){
          btnEmail.onclick = ()=>{
            const subject = `Facture AURUM CORP - AUR-${invoice.reference}`;
            const body = `Bonjour,%0D%0A%0D%0AVeuillez trouver ci-joint ma facture AURUM CORP.%0D%0A%0D%0ARéférence: AUR-${invoice.reference}%0D%0AClient: ${invoice.clientName}%0D%0AMontant: ${formatFCFA(invoice.amount)}%0D%0ADate: ${new Date(invoice.date).toLocaleDateString('fr-FR')}%0D%0A%0D%0AMerci de votre confiance !%0D%0A%0D%0ACordialement,%0D%0A${invoice.clientName}`;
            const emailUrl = `mailto:aurumcorporate.d@gmail.com?subject=${subject}&body=${body}`;
            window.location.href = emailUrl;
            showToast('Application email ouverte. Téléchargez et joignez le PDF.', 'info');
          };
        }

        if(btnWhatsApp){
          btnWhatsApp.onclick = async ()=>{
            const msg = `Bonjour, voici ma facture AURUM CORP:\n\nRéférence: AUR-${invoice.reference}\nMontant: ${formatFCFA(invoice.amount)}\nClient: ${invoice.clientName}\n\nMerci de votre confiance !`;
            const shared = await tryNativeShare(pdf, invoice, msg);
            if(shared){
              showToast('Facture partagée avec succès', 'success');
              return;
            }
            const url = getWhatsAppUrl(msg);
            window.open(url, '_blank');
            showToast('WhatsApp ouvert. Téléchargez la facture et joignez-la au message.', 'info');
          };
        }

        if(btnSnap){
          btnSnap.onclick = async ()=>{
            const msg = `Facture AURUM CORP AUR-${invoice.reference} · ${formatFCFA(invoice.amount)}`;
            const shared = await tryNativeShare(pdf, invoice, msg);
            if(shared){
              showToast('Facture partagée avec succès', 'success');
              return;
            }
            const url = getSnapchatShareUrl();
            window.open(url, '_blank');
            showToast('Snapchat ouvert. Partagez votre facture.', 'info');
          };
        }

        // Masquer le formulaire si présent
        if(form) form.style.display = 'none';
      }
    }

    // Gestionnaire du formulaire manuel (toujours attacher l'événement)
    if(form){
      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(form);
        const invoice = {
          id: 'inv-'+Date.now(),
          reference: getNextInvoiceNumber(),
          clientName: fd.get('clientName')?.toString()?.trim(),
          clientEmail: fd.get('clientEmail')?.toString()?.trim(),
          clientPhone: fd.get('clientPhone')?.toString()?.trim(),
          serviceDescription: fd.get('serviceDescription')?.toString()?.trim(),
          amount: Number(fd.get('amount')),
          paymentMethod: fd.get('paymentMethod')?.toString(),
          date: fd.get('invoiceDate') ? new Date(fd.get('invoiceDate').toString()).toISOString() : new Date().toISOString(),
          createdAt: Date.now(),
          status: 'submitted',
          sellerEmail: (Auth.user?.email) || null
        };

        // Validation simple
        if(!invoice.clientName || !invoice.clientEmail || !invoice.clientPhone || !invoice.serviceDescription || !invoice.amount || !invoice.paymentMethod){
          showToast('Veuillez remplir tous les champs requis', 'warning');
          return;
        }

        // Générer PDF
        let pdf;
        try{
          pdf = await htmlToPdf(invoice);
        }catch(err){
          showToast('Erreur lors de la génération PDF', 'danger');
          console.error(err);
          return;
        }

        // Sauvegarder + notifier admin
        saveInvoice(invoice);
        sendAdminNotification(invoice);

        // Afficher prévisualisation
        refDiv.textContent = `Référence: AUR-${invoice.reference}`;
        previewContent.innerHTML = buildInvoiceHTML(invoice);
        preview.classList.remove('hidden');
        showToast('Facture générée, enregistrée et envoyée pour validation', 'success');

        // Actions
        btnDownload.onclick = ()=>{
          pdf.save(`Aurum_Invoice_AUR-${invoice.reference}.pdf`);
        };

        if(btnEmail){
          btnEmail.onclick = ()=>{
            const subject = `Facture AURUM CORP - AUR-${invoice.reference}`;
            const body = `Bonjour,%0D%0A%0D%0AVeuillez trouver ci-joint la facture AURUM CORP.%0D%0A%0D%0ARéférence: AUR-${invoice.reference}%0D%0AClient: ${invoice.clientName}%0D%0AMontant: ${formatFCFA(invoice.amount)}%0D%0ADate: ${new Date(invoice.date).toLocaleDateString('fr-FR')}%0D%0A%0D%0AMerci de votre confiance !`;
            const emailUrl = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;
            window.location.href = emailUrl;
            showToast('Application email ouverte. Téléchargez et joignez le PDF.', 'info');
          };
        }

        btnWhatsApp.onclick = async ()=>{
          const msg = `Bonjour, veuillez trouver en pièce jointe la facture AUR-${invoice.reference} pour ${invoice.clientName} (montant: ${formatFCFA(invoice.amount)}).`;
          const shared = await tryNativeShare(pdf, invoice, msg);
          if(shared){
            showToast('Partage via le sélecteur natif (WhatsApp si disponible)', 'info');
            return;
          }
          const url = getWhatsAppUrl(msg);
          window.open(url, '_blank');
          showToast('WhatsApp ouvert avec message pré-rempli. Joignez le PDF téléchargé si besoin.', 'info');
        };

        btnSnap.onclick = async ()=>{
          const msg = `Facture AUR-${invoice.reference} · ${invoice.clientName} · ${formatFCFA(invoice.amount)}`;
          const shared = await tryNativeShare(pdf, invoice, msg);
          if(shared){
            showToast('Partage ouvert (Snapchat si disponible)', 'info');
            return;
          }
          const url = getSnapchatShareUrl();
          window.open(url, '_blank');
          showToast('Profil Snapchat ouvert. Partagez avec le PDF téléchargé.', 'info');
        };
      });
    }
  });
})();
