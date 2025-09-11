function renderBeranda() {
  return `
    <h1>Dashboard GeoSelaras</h1>
    <div class="beranda-container">

      <!-- Peta Program -->
      <div class="beranda-box">
        <h3>Visualisasi Peta Program</h3>
        <div id="berandaMap"></div>

        <!-- Search koordinat -->
        <div class="search-box">
          <input type="text" id="searchCoord" placeholder="contoh: -6.2,106.8" />
          <button id="btnSearchCoord">Cari</button>
        </div>
      </div>

      <!-- Analisis Tumpang Tindih -->
      <div class="beranda-box">
        <h3>Analisis Tumpang Tindih</h3>
        <div class="tumpang-container">
          <div class="tumpang-column">
            <div id="tumpangLokasi"></div>
          </div>
          <div class="tumpang-divider"></div>
          <div class="tumpang-column">
            <div id="tumpangProgram"></div>
          </div>
        </div>
      </div>

      <!-- Monitoring & Evaluasi -->
      <div class="beranda-box">
        <h3>Monitoring & Evaluasi</h3>
        <div id="monitoringStats" class="monitoring-stats"></div>
      </div>

      <!-- Grafik Monitoring -->
      <div class="graph-box">
        <h3>Grafik</h3>
        <canvas id="monitoringChart"></canvas>
      </div>

    </div>
  `;
}

function initBeranda() {
  let programs = JSON.parse(localStorage.getItem("programs")) || [];

  // --- Peta mini semua program ---
  if (typeof L !== "undefined") {
    window._berandaMap = L.map("berandaMap").setView([-6.2, 106.8], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(window._berandaMap);

    const bounds = L.latLngBounds();
    programs.forEach(prog => {
      if (!prog?.lokasi) return;
      const parts = prog.lokasi.split(",").map(s => parseFloat(s));
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
      const [lat, lng] = parts;
      const fisik = prog.progres?.fisik || 0;

      let iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
      if (fisik >= 80) iconUrl = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
      else if (fisik >= 50) iconUrl = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

      const marker = L.marker([lat, lng], {
        icon: L.icon({ iconUrl, iconSize: [25,41], iconAnchor: [12,41] })
      }).addTo(window._berandaMap);

      marker.bindPopup(`<b>${prog.nama || "-"}</b><br>Progres: ${fisik}%`);
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) {
      window._berandaMap.fitBounds(bounds.pad(0.2));
      setTimeout(() => window._berandaMap.invalidateSize(), 200);
    } else {
      window._berandaMap.setView([-6.2, 106.8], 5);
    }
  }

  // --- Search koordinat ---
  const btnSearch = document.getElementById("btnSearchCoord");
  if (btnSearch) {
    btnSearch.addEventListener("click", () => {
      const input = document.getElementById("searchCoord").value.trim();
      if (!input) return;

      const parts = input.split(",").map(s => parseFloat(s));
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        alert("Format salah. Gunakan contoh: -6.2,106.8");
        return;
      }

      const [lat, lng] = parts;

      if (window._searchMarker) window._berandaMap.removeLayer(window._searchMarker);

      const foundPrograms = programs.filter(p => {
        if (!p?.lokasi) return false;
        const locParts = p.lokasi.split(",").map(s => parseFloat(s));
        if (locParts.length < 2) return false;
        const [plat, plng] = locParts;
        return Math.abs(plat - lat) < 0.0001 && Math.abs(plng - lng) < 0.0001;
      });

      const popupContent = foundPrograms.length
        ? `<b>Program:</b><br>${foundPrograms.map(p => p.nama || "-").join("<br>")}`
        : "<b>Tidak ada program di lokasi ini</b>";

      window._searchMarker = L.marker([lat, lng])
        .addTo(window._berandaMap)
        .bindPopup(popupContent)
        .openPopup();

      window._berandaMap.setView([lat, lng], 13);
    });
  }

  // --- Analisis tumpang tindih ---
  const lokasiCount = {};
  const lokasiPrograms = {};
  programs.forEach(p => {
    if (!p?.lokasi) return;
    const key = p.lokasi.trim();
    lokasiCount[key] = (lokasiCount[key] || 0) + 1;
    lokasiPrograms[key] = lokasiPrograms[key] || [];
    lokasiPrograms[key].push(p.nama || "-");
  });

  const overlappingLocations = Object.keys(lokasiCount).filter(k => lokasiCount[k] > 1);
  const tumpangLokasiEl = document.getElementById("tumpangLokasi");
  const tumpangProgramEl = document.getElementById("tumpangProgram");

  if (tumpangLokasiEl) {
    tumpangLokasiEl.innerHTML = `
      <p><b>${overlappingLocations.length}</b><br>lokasi tumpang tindih</p>
      <hr>
      ${
        overlappingLocations.length
          ? `<table class="tumpang-table"><tbody>${overlappingLocations.map(loc => `<tr><td>${loc}</td></tr>`).join("")}</tbody></table>`
          : "<p>Tidak ada lokasi tumpang tindih.</p>"
      }
    `;
  }

  if (tumpangProgramEl) {
    const overlappingPrograms = overlappingLocations.flatMap(k => lokasiPrograms[k]);
    tumpangProgramEl.innerHTML = `
      <p><b>${overlappingPrograms.length}</b><br>program terlibat</p>
      <hr>
      ${
        overlappingPrograms.length
          ? `<table class="tumpang-table"><tbody>${overlappingPrograms.map(p => `<tr><td>${p}</td></tr>`).join("")}</tbody></table>`
          : "<p>Tidak ada program yang tumpang tindih.</p>"
      }
    `;
  }

  // --- Statistik monitoring & evaluasi ---
  const totalProgram = programs.length;
  const avgFisik = totalProgram > 0 
    ? (programs.reduce((sum, p) => sum + (p.progres?.fisik || 0), 0) / totalProgram)
    : 0;
  const totalAnggaran = programs.reduce((sum, p) => sum + (parseInt(p.progres?.anggaran) || 0), 0);

  const monitoringStatsEl = document.getElementById("monitoringStats");
  if (monitoringStatsEl) {
    monitoringStatsEl.innerHTML = `
      <p><b>Total Program Aktif:</b> ${totalProgram}</p>
      <p><b>Rata-rata Progres Fisik:</b> ${avgFisik.toFixed(1)}%</p>
      <p><b>Total Realisasi Anggaran:</b> Rp ${totalAnggaran.toLocaleString()}</p>
    `;
  }

  // --- Chart monitoring (grid & angka Y dihapus) ---
  try {
    if (typeof Chart !== "undefined" && document.getElementById("monitoringChart")) {
      const ctx = document.getElementById("monitoringChart").getContext("2d");
      if (window._berandaChart) window._berandaChart.destroy();

      window._berandaChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Total Program", "Avg Fisik (%)", "Total Anggaran (Rp)"],
          datasets: [{
            data: [totalProgram, parseFloat(avgFisik.toFixed(1)), totalAnggaran],
            backgroundColor: ["#273c75", "#fbc531", "#44bd32"]
          }]
        },
        options: {
          responsive: true,
          layout: { padding: { bottom: 40 } },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: true } },
            y: { beginAtZero: true, grid: { display: true }, ticks: { display:false } } // <-- grid + angka Y dihapus
          }
        },
        plugins: [{
          id: 'customLabelsBelow',
          afterDraw(chart) {
            const {ctx, chartArea: {bottom}, scales: {x}} = chart;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            chart.data.datasets[0].data.forEach((value, index) => {
              const xPos = x.getPixelForValue(index);
              ctx.fillText(value, xPos, bottom + 30);
            });
            ctx.restore();
          }
        }]
      });
    }
  } catch (err) {
    console.error("Chart error:", err);
  }
}
