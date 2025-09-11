function renderAnalisis() {
  const programs = JSON.parse(localStorage.getItem("programs")) || [];

  if (programs.length === 0) {
    return `<h1>Analisis Tumpang Tindih & Kesenjangan</h1>
            <div class="analisis-box empty">
              <p>Belum ada data program yang diinput.</p>
            </div>`;
  }

  return `
    <h1>Analisis Tumpang Tindih & Kesenjangan</h1>
    <p>Analisis ini menggunakan koordinat program yang diinput user.</p>

    <div class="analisis-box">
      <div id="overlapResults" class="analisis-results"></div>
      <div id="gapMap" style="height: 500px;"></div>
    </div>
  `;
}

// Fungsi bantu untuk menghitung jarak antara dua koordinat (meter)
function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 +
            Math.cos(φ1)*Math.cos(φ2)*
            Math.sin(Δλ/2)**2;
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Deteksi tumpang tindih
function detectOverlaps(programs, toleranceMeters = 50) {
  const overlaps = [];
  const visited = new Array(programs.length).fill(false);

  for (let i=0; i<programs.length; i++) {
    if (visited[i]) continue;
    if (!programs[i]?.lokasi) continue;

    const [lat1, lng1] = programs[i].lokasi.split(",").map(Number);
    const group = [programs[i]];

    for (let j=i+1; j<programs.length; j++) {
      if (visited[j]) continue;
      if (!programs[j]?.lokasi) continue;
      const [lat2, lng2] = programs[j].lokasi.split(",").map(Number);
      if (distanceInMeters(lat1, lng1, lat2, lng2) <= toleranceMeters) {
        group.push(programs[j]);
        visited[j] = true;
      }
    }

    if (group.length > 1) overlaps.push({ lokasi: [lat1, lng1], programs: group });
  }

  return overlaps;
}

function initAnalisis() {
  const programs = JSON.parse(localStorage.getItem("programs")) || [];
  const overlaps = detectOverlaps(programs);

  const gapMapEl = document.getElementById("gapMap");
  if (!gapMapEl) return;

  // Inisialisasi peta
  const map = L.map("gapMap").setView([-2.5, 117], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Marker program
  programs.forEach(prog => {
    if (!prog.lokasi) return;
    const [lat, lng] = prog.lokasi.split(",").map(Number);

    const isOverlap = overlaps.some(o => {
      const [olat, olng] = o.lokasi;
      return distanceInMeters(lat, lng, olat, olng) <= 50;
    });

    const iconUrl = isOverlap
      ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      : "https://maps.google.com/mapfiles/ms/icons/green-dot.png";

    L.marker([lat, lng], {
      icon: L.icon({ iconUrl, iconSize: [25,41], iconAnchor: [12,41] })
    }).addTo(map)
      .bindPopup(`<b>${prog.nama}</b><br>Tahun: ${prog.tahun}<br>Sektor: ${prog.sektor}`);
  });

  // Polygon merah untuk tumpang tindih
  overlaps.forEach(o => {
    const [lat, lng] = o.lokasi;
    const delta = 0.0005;
    const bounds = [
      [lat - delta, lng - delta],
      [lat - delta, lng + delta],
      [lat + delta, lng + delta],
      [lat + delta, lng - delta]
    ];
    L.polygon(bounds, { color: "red", fillColor: "red", fillOpacity: 0.2 }).addTo(map);
  });

  // Notifikasi overlap
  const overlapDiv = document.getElementById("overlapResults");
  if (overlaps.length === 0) {
    overlapDiv.innerHTML = "<p>✅ Tidak ada tumpang tindih lokasi program.</p>";
  } else {
    let html = "<p>⚠️ Lokasi program yang tumpang tindih:</p><ul>";
    overlaps.forEach(o => {
      const names = o.programs.map(p => p.nama).join(", ");
      const locStr = o.lokasi.map(x => x.toFixed(6)).join(", ");
      html += `<li>Lokasi ${locStr} → ${names}</li>`;
    });
    html += "</ul>";
    overlapDiv.innerHTML = html;
  }

  // Fit bounds
  const allLatLng = programs
    .filter(p => p.lokasi)
    .map(p => p.lokasi.split(",").map(Number));
  if (allLatLng.length > 0) map.fitBounds(allLatLng, { padding: [50, 50] });
}
