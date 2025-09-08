// Definisi route dan fungsi render dari tiap modul
const routes = {
  "#beranda": renderBeranda,
  "#input": renderInput,
  "#peta": renderPeta,
  "#rpjmd": renderRpjmd,
  "#analisis": renderAnalisis,
  "#monitoring": renderMonitoring,
  "#tentang": renderTentang,
};

// Router function
function router() {
  const app = document.getElementById("app");
  const hash = window.location.hash || "#beranda";
  const renderFunc = routes[hash];
  app.innerHTML = renderFunc ? renderFunc() : "<h1>404 - Halaman tidak ditemukan</h1>";

  // highlight link aktif
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  const activeLink = document.querySelector(`nav a[href="${hash}"]`);
  if (activeLink) activeLink.classList.add("active");

  // Jalankan fungsi tambahan sesuai halaman (cek typeof agar tidak error)
  if (hash === "#beranda" && typeof initBeranda === "function") {
    initBeranda();
  }
  if (hash === "#input" && typeof attachFormValidation === "function") {
    attachFormValidation();
  }
  if (hash === "#peta" && typeof initProgramMap === "function") {
    initProgramMap();
  }
  if (hash === "#rpjmd" && typeof initRpjmdMap === "function") {
    initRpjmdMap();
  }
  if (hash === "#analisis" && typeof initAnalisis === "function") {
    initAnalisis();
  }
  if (hash === "#monitoring" && typeof initMonitoring === "function") {
    initMonitoring();
  }
  if (hash === "#tentang" && typeof initTentang === "function") {
    initTentang();
  }
}

// Jalankan saat load & saat hash berubah
window.addEventListener("hashchange", router);
window.addEventListener("load", router);
