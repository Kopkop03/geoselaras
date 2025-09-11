function renderBeranda() {
  return `
    <h1>Dashboard GeoSelaras</h1>
    <div class="beranda-container">

      <!-- Peta Program -->
      <div class="beranda-box">
        <h3>Visualisasi Peta Program</h3>
        <div id="berandaMap"></div>
      </div>

      <!-- Analisis Tumpang Tindih -->
      <div class="beranda-box">
        <h3>Analisis Tumpang Tindih</h3>
        <div id="tumpangInfo"></div>
        <div id="tumpangList" style="margin-top:0.5rem;"></div>
      </div>

      <!-- Monitoring & Evaluasi -->
      <div class="beranda-box">
        <h3>Monitoring & Evaluasi</h3>
        <div id="monitoringStats" class="monitoring-stats"></div>
      </div>

      <!-- Grafik Monitoring -->
      <div class="graph-box">
        <h3>Monitoring & Evaluasi (Grafik)</h3>
        <canvas id="monitoringChart"></canvas>
      </div>

    </div>
  `;
}

function initBeranda() {
  let programs = JSON.parse(localStorage.getItem("programs")) || [];

  // --- Peta mini semua program ---
  if (typeof L !== "undefined") {
    const map = L.map("berandaMap").setView([-6.2, 106.8], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

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
      }).addTo(map);
      marker.bindPopup(`<b>${prog.nama || "-"}</b><br>Progres: ${fisik}%`);
      bounds.extend([lat, lng]);
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
      setTimeout(() => map.invalidateSize(), 200);
    } else {
      map.setView([-6.2,106.8], 5);
    }
  }

  // --- Analisis tumpang tindih ---
  const lokasiCount = {};
  const lokasiPrograms = {};
  programs.forEach(p => {
    if (!p?.lokasi) return;
    const key = p.lokasi.trim();
    lokasiCount[key] = (lokasiCount[key] || 0) + 1;
    lokasiPrograms[key] = lokasiPrograms[key] || [];
    lokasiPrograms[key].push(`${p.nama || '-'} (${p.tahun || '-'})`);
  });
  const overlappingLocations = Object.keys(lokasiCount).filter(k => lokasiCount[k] > 1);
  let overlappingPrograms = [];
  overlappingLocations.forEach(k => {
    overlappingPrograms = overlappingPrograms.concat(lokasiPrograms[k]);
  });
  const tumpangInfoEl = document.getElementById("tumpangInfo");
  const tumpangListEl = document.getElementById("tumpangList");
  if (tumpangInfoEl) {
    tumpangInfoEl.innerHTML = `<p><b>${overlappingLocations.length}</b> lokasi tumpang tindih</p>
                               <p><b>${overlappingPrograms.length}</b> program terlibat</p>`;
  }
  if (tumpangListEl) {
    tumpangListEl.innerHTML = overlappingPrograms.length ? "<ul>" + overlappingPrograms.map(x => `<li>${x}</li>`).join("") + "</ul>" : "<p>Tidak ada program yang tumpang tindih.</p>";
  }

  // --- Statistik monitoring & evaluasi ---
  const totalProgram = programs.length;
  const avgFisik = totalProgram > 0 ? (programs.reduce((sum, p) => sum + (p.progres?.fisik || 0), 0) / totalProgram) : 0;
  const totalAnggaran = programs.reduce((sum, p) => sum + (parseInt(p.progres?.anggaran) || 0), 0);
  const monitoringStatsEl = document.getElementById("monitoringStats");
  if (monitoringStatsEl) {
    monitoringStatsEl.innerHTML = `<p><b>Total Program Aktif:</b> ${totalProgram}</p>
                                   <p><b>Rata-rata Progres Fisik:</b> ${avgFisik.toFixed(1)}%</p>
                                   <p><b>Total Realisasi Anggaran:</b> Rp ${totalAnggaran.toLocaleString()}</p>`;
  }

  // --- Chart monitoring ---
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
  layout: { padding: { bottom: 20 } },
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } }
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
      // Atur jarak vertical label angka
      ctx.fillText(value, xPos, bottom + 30); // sebelumnya 25, sekarang 30
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
