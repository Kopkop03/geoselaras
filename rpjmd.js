// ============================
// Render Konten RPJMD
// ============================
function renderRpjmd() {
  const programs = JSON.parse(localStorage.getItem("programs")) || [];

  if (programs.length === 0) {
    return `<h1>Modul RPJMD</h1><p>Belum ada program yang diinput.</p>`;
  }

  let html = `<h1>Modul RPJMD</h1>
              <p>Peta dan statistik mengikuti koordinat program yang diinput user.</p>
              <div class="peta-container rpjmd">`;

  programs.forEach((prog, index) => {
    html += `
      <div class="peta-item">
        <h3>${prog.nama} (${prog.tahun})</h3>
        <div id="rpjmdMap${index}" class="mini-map"></div>
        <div id="rpjmdStats${index}" class="rpjmd-stats"></div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ============================
// Inisialisasi Peta RPJMD
// ============================
function initRpjmdMap() {
  const programs = JSON.parse(localStorage.getItem("programs")) || [];

  // Polygon RPJMD contoh (optional)
  const polygonCoords = [
    [106.75, -6.25],
    [106.75, -6.15],
    [106.85, -6.15],
    [106.85, -6.25],
    [106.75, -6.25]
  ];

  programs.forEach((prog, index) => {
    const [lat, lng] = prog.lokasi.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) return;

    // Inisialisasi peta untuk tiap program
    const map = L.map(`rpjmdMap${index}`).setView([lat, lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Polygon RPJMD (optional)
    L.polygon(
      polygonCoords.map(([lng, lat]) => [lat, lng]),
      { color: "blue", fillColor: "blue", fillOpacity: 0.3 }
    ).addTo(map).bindPopup("Kawasan Strategis RPJMD");

    // Marker program
    L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(map)
      .bindPopup(`<b>${prog.nama}</b><br>Tahun: ${prog.tahun}<br>Sektor: ${prog.sektor}`);

    // Statistik per peta (1 program = total 1)
    const total = 1;
    const selaras = 1;      // bisa dikaitkan polygon jika mau
    const tidakSelaras = 0;

    document.getElementById(`rpjmdStats${index}`).innerHTML = `
      <p><b>Total Program:</b> ${total}</p>
      <p><span style="color:green;">Selaras:</span> ${selaras} (${((selaras/total)*100).toFixed(1)}%)</p>
      <p><span style="color:red;">Tidak Selaras:</span> ${tidakSelaras} (${((tidakSelaras/total)*100).toFixed(1)}%)</p>
    `;
  });
}
