function renderBeranda() {
  return `
    <h1>Dashboard GeoSelaras</h1>
    <div class="beranda-container">
      <div class="beranda-box">
        <h3>Visualisasi Peta Program</h3>
        <div id="berandaMap"></div>
      </div>

      <div class="beranda-box">
        <h3>Analisis Tumpang Tindih</h3>
        <div id="tumpangInfo"></div>
        <div id="tumpangList" style="margin-top:0.5rem;"></div>
      </div>

      <div class="beranda-box">
        <h3>Monitoring & Evaluasi</h3>
        <div id="monitoringStats"></div>
        <canvas id="monitoringChart" style="max-height:160px; margin-top:8px;"></canvas>
      </div>
    </div>
  `;
}

function initBeranda() {
  // ambil data program
  let programs = JSON.parse(localStorage.getItem("programs")) || [];

  // --- Peta mini semua program ---
  if (typeof L === "undefined") {
    console.warn("Leaflet (L) tidak ditemukan. Peta tidak akan ditampilkan.");
  } else {
    const map = L.map("berandaMap").setView([-6.2, 106.8], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    const bounds = L.latLngBounds();
    programs.forEach(prog => {
      if (!prog || !prog.lokasi) return;
      const parts = prog.lokasi.split(",").map(s => parseFloat(s));
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return;
      const lat = parts[0], lng = parts[1];

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

    // fit to markers jika ada
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
      // kadang leaflet perlu invalidatesize
      setTimeout(() => map.invalidateSize(), 200);
    } else {
      map.setView([-6.2,106.8], 5);
    }
  }

  // --- Analisis tumpang tindih ---
  const lokasiCount = {}; // lokasi => count
  const lokasiPrograms = {}; // lokasi => array program strings
  programs.forEach(p => {
    if (!p || !p.lokasi) return;
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

  const tumpangCountLocations = overlappingLocations.length;
  const tumpangCountPrograms = overlappingPrograms.length;

  const tumpangInfoEl = document.getElementById("tumpangInfo");
  const tumpangListEl = document.getElementById("tumpangList");
  if (tumpangInfoEl) {
    tumpangInfoEl.innerHTML = `
      <p><b>${tumpangCountLocations}</b> lokasi tumpang tindih</p>
      <p><b>${tumpangCountPrograms}</b> program terlibat</p>
    `;
  }
  if (tumpangListEl) {
    if (overlappingPrograms.length === 0) {
      tumpangListEl.innerHTML = "<p>Tidak ada program yang tumpang tindih.</p>";
    } else {
      tumpangListEl.innerHTML = "<ul>" + overlappingPrograms.map(x => `<li>${x}</li>`).join("") + "</ul>";
    }
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

  // --- Chart (jika Chart tersedia) ---
  try {
    if (typeof Chart !== "undefined" && document.getElementById("monitoringChart")) {
      const ctx = document.getElementById("monitoringChart").getContext("2d");
      // hapus chart lama jika ada
      if (window._berandaChart) {
        window._berandaChart.destroy();
      }
      window._berandaChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Total Program", "Avg Fisik (%)", "Total Anggaran (Rp)"],
          datasets: [{
            label: "Statistik",
            data: [totalProgram, parseFloat(avgFisik.toFixed(1)), totalAnggaran],
            backgroundColor: ["#273c75", "#fbc531", "#44bd32"]
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  } catch (err) {
    console.error("Chart error:", err);
  }
}
