/**
 * seller-application.js
 * Formulaire de candidature vendeur avec upload de fichiers
 * Section §17 de prime.js
 */

// Fonction utilitaire pour compresser les images en WebP
window.compressImage = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Redimensionnement (max 1024px de large pour garder une bonne qualité)
                const MAX_WIDTH = 1024;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                
                // Dessiner l'image redimensionnée sur le canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir en WebP avec 80% de qualité
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' }));
                    } else {
                        reject(new Error("Erreur de compression Blob"));
                    }
                }, 'image/webp', 0.8);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
};


document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("sa-form")) return;

  var currentStep = 1;

  window.saGoTo = function (step) {
    if (step > currentStep) {
      var cur = document.querySelector(
        '.sa-section[data-section="' + currentStep + '"]',
      );
      var inputs = cur ? cur.querySelectorAll("[required]") : [];
      var valid = true;
      inputs.forEach(function (inp) {
        if (!inp.value.trim()) {
          valid = false;
          inp.style.borderBottomColor = "var(--danger)";
          setTimeout(function () {
            inp.style.borderBottomColor = "";
          }, 2000);
        }
      });
      if (!valid) {
        if (window.showToast)
          window.showToast(
            "Veuillez remplir tous les champs obligatoires.",
            "danger",
          );
        return;
      }
    }
    var from = document.querySelector(
      '.sa-section[data-section="' + currentStep + '"]',
    );
    var to = document.querySelector('.sa-section[data-section="' + step + '"]');
    if (from) from.classList.remove("active");
    if (to) to.classList.add("active");
    document.querySelectorAll(".sa-step").forEach(function (s) {
      var n = parseInt(s.dataset.step);
      s.classList.remove("active", "done");
      if (n === step) s.classList.add("active");
      else if (n < step) s.classList.add("done");
    });
    currentStep = step;
    var stepsWrap = document.querySelector(".sa-steps-wrap");
    if (stepsWrap)
      window.scrollTo({ top: stepsWrap.offsetTop - 10, behavior: "smooth" });
  };

  window.saFile = function (input, areaId, lblId) {
    if (input.files && input.files[0]) {
      var f = input.files[0];
      var nm = f.name.length > 20 ? f.name.substring(0, 20) + "…" : f.name;
      var sz = (f.size / 1024 / 1024).toFixed(2);
      var lbl = document.getElementById(lblId);
      if (lbl) lbl.textContent = nm + " (" + sz + " MB)";
      var area = document.getElementById(areaId);
      if (area) area.classList.add("done");
    }
  };

  window.toggleCk = function (cb) {
    cb.closest(".sa-ck").classList.toggle("checked", cb.checked);
  };

  document
    .getElementById("sa-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      if (typeof firebase === "undefined") {
        if (window.showToast)
          window.showToast("Firebase non détecté.", "danger");
        return;
      }

      // Vérifier que l'utilisateur est connecté
      var currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        if (window.showToast)
          window.showToast(
            "Vous devez être connecté pour candidater.",
            "danger",
          );
        window.location.href = "/login";
        return;
      }

      var submitBtn = document.getElementById("sa-submit");
      var prog = document.getElementById("sa-prog");
      var fill = document.getElementById("sa-prog-fill");
      var txt = document.getElementById("sa-prog-txt");
      if (submitBtn) submitBtn.style.display = "none";
      if (prog) prog.style.display = "block";

      try {
        var db2 = firebase.firestore();
        var storage = firebase.storage();
        var fd = new FormData(e.target);
        var shopName = (fd.get("shop_name") || "boutique")
          .replace(/\s+/g, "_")
          .toLowerCase();
        var ts = Date.now();
        var folder = "candidatures/" + shopName + "_" + ts;

        var pm = [];
        [
          "payment_mobile_money",
          "payment_cash",
          "payment_card",
          "payment_transfer",
        ].forEach(function (n) {
          if (fd.get(n)) pm.push(fd.get(n));
        });

        var data = {
          shop_name: fd.get("shop_name"),
          legal_status: fd.get("legal_status"),
          rccm: fd.get("rccm") || "",
          ifu_num: fd.get("ifu") || "",
          owner_name: fd.get("owner_name"),
          owner_role: fd.get("owner_role"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          address: fd.get("address"),
          bank_account: fd.get("bank_account") || "",
          payment_methods: pm,
          billing_address: fd.get("billing_address") || "",
          categories: fd.get("categories"),
          brand_story: fd.get("brand_story"),
          delivery_time: fd.get("delivery_time") || "",
          return_policy: fd.get("return_policy") || "",
          social_instagram: fd.get("social_instagram") || "",
          social_website: fd.get("social_website") || "",
          status: "pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (txt) txt.textContent = "Envoi des fichiers…";
        var files = [
          { id: "inp-logo", field: "logo_url", name: "logo" },
          { id: "inp-id", field: "id_card_url", name: "id_card" },
          { id: "inp-rccm", field: "rccm_doc_url", name: "rccm_doc" },
          { id: "inp-ifu", field: "ifu_doc_url", name: "ifu_doc" },
        ];
        var active = files.filter(function (f) {
          return (
            document.getElementById(f.id) &&
            document.getElementById(f.id).files.length > 0
          );
        });
        var done = 0;
        for (var fi of active) {
          var file = document.getElementById(fi.id).files[0];
          var ext = file.name.split(".").pop();
          var ref = storage.ref(folder + "/" + fi.name + "." + ext);

          // Compresser si c'est une image
          var fileToUpload = file;
          if (file.type.startsWith("image/")) {
            try {
              fileToUpload = await window.compressImage(file);
              ext = "webp";
              ref = storage.ref(folder + "/" + fi.name + ".webp");
            } catch (e) {
              console.warn(
                "Compression échouée, upload du fichier original:",
                e,
              );
            }
          }

          var task = ref.put(fileToUpload);
          await new Promise(function (res, rej) {
            task.on(
              "state_changed",
              function (snap) {
                if (fill)
                  fill.style.width =
                    ((done + snap.bytesTransferred / snap.totalBytes) /
                      active.length) *
                      100 +
                    "%";
              },
              rej,
              async function () {
                data[fi.field] = await task.snapshot.ref.getDownloadURL();
                done++;
                res();
              },
            );
          });
        }
        if (txt) txt.textContent = "Finalisation…";
        if (fill) fill.style.width = "100%";
        await db2.collection("seller_applications").add(data);

        e.target.style.display = "none";
        if (prog) prog.style.display = "none";
        var success = document.getElementById("sa-success");
        if (success) {
          success.style.display = "block";
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch (err) {
        console.error(err);
        if (window.showToast)
          window.showToast("Erreur : " + err.message, "danger");
        if (submitBtn) submitBtn.style.display = "inline-flex";
        if (prog) prog.style.display = "none";
      }
    });
});
