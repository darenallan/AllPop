// Génération et validation de factures (Aurum Events)
// Dépendances: utils.js (toast), data.js (Store), auth.js (Auth)

(function(){
  const { jsPDF } = window.jspdf || {};
  const WHATSAPP_PHONE = '22664502626';
  const SNAPCHAT_USERNAME = 'daren_allan';

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
          <h2>Aurum Events</h2>
          <div class="text-muted">Qualité · Courtoisie · Efficacité</div>
          <div class="text-muted">Ouagadougou, Burkina Faso</div>
          <div class="text-muted">Email: contact@aurum.events</div>
          <div class="text-muted">Téléphone: +226 64 50 26 26</div>
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
        <div><strong>Référence:</strong> INV-${invoice.reference}</div>
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

    // Simple conversion: utilise doc.html si disponible
    if(doc.html){
      const container = document.createElement('div');
      container.style.width = '595pt';
      container.innerHTML = html;
      document.body.appendChild(container);
      await doc.html(container, { x: 20, y: 20 });
      document.body.removeChild(container);
    }else{
      // Fallback: texte basique
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Aurum Events - Facture INV-${invoice.reference}`, 40, 40);
      doc.text(`Client: ${invoice.clientName}`, 40, 60);
      doc.text(`Email: ${invoice.clientEmail}`, 40, 80);
      doc.text(`Téléphone: ${invoice.clientPhone}`, 40, 100);
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 40, 120);
      doc.text(`Paiement: ${invoice.paymentMethod}`, 40, 140);
      doc.text(`Description: ${invoice.serviceDescription}`, 40, 180, { maxWidth: 500 });
      doc.text(`Montant: ${formatFCFA(invoice.amount)}`, 40, 240);
    }

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
    return `https://www.snapchat.com/add/${SNAPCHAT_USERNAME}`;
  }

  async function tryNativeShare(pdf, invoice, message){
    if(!pdf || !pdf.output || !navigator.share) return false;
    try{
      const blob = pdf.output('blob');
      const file = new File([blob], `Aurum_Invoice_INV-${invoice.reference}.pdf`, { type:'application/pdf' });
      const payload = { title: `Facture INV-${invoice.reference}`, text: message, files: [file] };
      if(navigator.canShare && !navigator.canShare(payload)) return false;
      await navigator.share(payload);
      return true;
    }catch(err){
      console.warn('Partage natif indisponible', err);
      return false;
    }
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('invoice-form');
    const preview = document.getElementById('invoice-preview');
    const previewContent = document.getElementById('invoice-preview-content');
    const refDiv = document.getElementById('invoice-reference');
    const btnDownload = document.getElementById('download-invoice-btn');
    const btnWhatsApp = document.getElementById('whatsapp-invoice-btn');
    const btnSnap = document.getElementById('snapchat-invoice-btn');

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
        refDiv.textContent = `Référence: INV-${invoice.reference}`;
        previewContent.innerHTML = buildInvoiceHTML(invoice);
        preview.classList.remove('hidden');
        showToast('Facture générée, enregistrée et envoyée pour validation', 'success');

        // Actions
        btnDownload.onclick = ()=>{
          pdf.save(`Aurum_Invoice_INV-${invoice.reference}.pdf`);
        };

        btnWhatsApp.onclick = async ()=>{
          const msg = `Bonjour, veuillez trouver en pièce jointe la facture INV-${invoice.reference} pour ${invoice.clientName} (montant: ${formatFCFA(invoice.amount)}).`;
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
          const msg = `Facture INV-${invoice.reference} · ${invoice.clientName} · ${formatFCFA(invoice.amount)}`;
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
