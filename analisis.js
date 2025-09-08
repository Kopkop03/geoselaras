function renderAnalisis() {
  const programs = JSON.parse(localStorage.getItem("programs")) || [];

  if (programs.length === 0) {
    return `<h1>Analisis Tumpang Tindih & Kesenjangan</h1>
            <p>Belum ada data program yang diinput.</p>`;
  }

  return `
    <h1>Analisis Tumpang Tindih & Kesenjangan</h1>
    <p>Analisis ini menggunakan koordinat program yang diinput user.</p>

    <div id="overlapResults" style="margin-bottom:1rem;"></div>
    <div id="gapMap" style="height:500px; border:1px solid #ccc; border-radius:8px;"></div>
  `;
}

// Fungsi bantu untuk menghitung jarak antara dua koordinat (meter)
function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // radius bumi dalam meter
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) +
            Math.cos(φ1)*Math.cos(φ2)*
            Math.sin(Δλ/2)*Math.sin(Δλ/2);
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Deteksi tumpang tindih dengan toleransi jarak
function detectOverlaps(programs, toleranceMeters = 50) {
  const overlaps = [];
  const visited = new Array(programs.length).fill(false);

  for (let i=0; i<programs.length; i++) {
    if (visited[i]) continue;
    const [lat1, lng1] = programs[i].lokasi.split(",").map(Number);
    const group = [programs[i]];

    for (let j=i+1; j<programs.length; j++) {
      if (visited[j]) continue;
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

  // Inisialisasi peta
  const map = L.map("gapMap").setView([-2.5, 117], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // ====== Marker tiap program ======
  programs.forEach(prog => {
    const [lat, lng] = prog.lokasi.split(",").map(Number);

    // Cek apakah titik ini tumpang tindih
    const isOverlap = overlaps.some(o => {
      const [olat, olng] = o.lokasi;
      return distanceInMeters(lat, lng, olat, olng) <= 50;
    });

    // Pilih ikon
    const iconUrl = isOverlap 
      ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png" 
      : "https://maps.google.com/mapfiles/ms/icons/green-dot.png";

    L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(map)
      .bindPopup(`<b>${prog.nama}</b><br>Tahun: ${prog.tahun}<br>Sektor: ${prog.sektor}`);
  });

  // ====== Kotak merah untuk lokasi tumpang tindih (opsional) ======
  overlaps.forEach(o => {
    const [lat, lng] = o.lokasi;
    const delta = 0.0005; // sekitar 50 m
    const bounds = [
      [lat - delta, lng - delta],
      [lat - delta, lng + delta],
      [lat + delta, lng + delta],
      [lat + delta, lng - delta]
    ];
    L.polygon(bounds, { color: "red", fillColor: "red", fillOpacity: 0.2 }).addTo(map);
  });

  // ====== Notifikasi di bawah peta ======
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

  // ====== Sesuaikan peta supaya semua marker terlihat ======
  const allLatLng = programs.map(p => p.lokasi.split(",").map(Number));
  if(allLatLng.length > 0) {
    const bounds = L.latLngBounds(allLatLng);
    map.fitBounds(bounds.pad(0.2));
  }
}
