function renderMonitoring() {
  return `
    <h1>Monitoring Program</h1>
    <p>Visualisasi progres fisik dan realisasi anggaran dalam peta dinamis.</p>

    <!-- Form Input Progres -->
    <form id="progressForm" class="form-container">
      <div class="form-group">
        <label>Pilih Program:</label>
        <select name="program" id="programSelect" required></select>
      </div>

      <div class="form-group">
        <label>Persentase Fisik (%):</label>
        <input type="number" name="fisik" min="0" max="100" required>
      </div>

      <div class="form-group">
        <label>Realisasi Anggaran (Rp):</label>
        <input type="number" name="anggaran" required>
      </div>

      <div class="form-group">
        <label>Foto Lapangan:</label>
        <input type="file" name="foto" accept="image/*">
      </div>

      <button type="submit" class="btn-submit">Simpan Progres</button>
    </form>

    <div id="monitoringContainer"></div>
  `;
}

function initMonitoring() {
  const form = document.getElementById("progressForm");
  const programSelect = document.getElementById("programSelect");
  const container = document.getElementById("monitoringContainer");

  let programs = JSON.parse(localStorage.getItem("programs")) || [];

  // Isi dropdown program
  programSelect.innerHTML = `<option value="">-- Pilih --</option>`;
  programs.forEach((p, i) => {
    programSelect.innerHTML += `<option value="${i}">${p.nama} (${p.tahun})</option>`;
  });

  // Simpan progres
  form.addEventListener("submit", e => {
    e.preventDefault();

    const idx = programSelect.value;
    if (idx === "") {
      alert("Pilih program terlebih dahulu");
      return;
    }

    const fisik = parseInt(form.fisik.value);
    const anggaran = form.anggaran.value;
    const fotoFile = form.foto.files[0];
    const fotoName = fotoFile ? fotoFile.name : null;

    // Update data program
    programs[idx].progres = {
      fisik: fisik,
      anggaran: anggaran,
      foto: fotoName
    };

    localStorage.setItem("programs", JSON.stringify(programs));
    alert("Progres berhasil disimpan ✅");

    // Render ulang monitoring
    renderProgramMonitoring(programs, container);
    form.reset();
  });

  // Render awal
  renderProgramMonitoring(programs, container);
}

function renderProgramMonitoring(programs, container) {
  container.innerHTML = "";

  programs.forEach((prog, idx) => {
    const div = document.createElement("div");
    div.className = "peta-container";

    div.innerHTML = `
      <div class="peta-kiri">
        <div id="map-${idx}" class="mini-map"></div>
      </div>
      <div class="peta-kanan">
        <h3>${prog.nama} (${prog.tahun})</h3>
        <p><b>Sektor:</b> ${prog.sektor}</p>
        <p><b>Anggaran:</b> Rp ${prog.anggaran}</p>
        <p><b>Progres Fisik:</b> ${prog.progres?.fisik || 0}%</p>
        <p><b>Realisasi Anggaran:</b> Rp ${prog.progres?.anggaran || 0}</p>
        ${prog.progres?.foto ? `<p><b>Foto:</b> ${prog.progres.foto}</p>` : ""}
      </div>
    `;

    container.appendChild(div);

    // Tampilkan peta mini
    const [lat, lng] = prog.lokasi.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      const map = L.map(`map-${idx}`).setView([lat, lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(map);

      // Pilih warna marker berdasarkan progres fisik
      const fisik = prog.progres?.fisik || 0;
      let iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
      if (fisik >= 80) {
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
      } else if (fisik >= 50) {
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
      }

      L.marker([lat, lng], {
        icon: L.icon({
          iconUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        })
      }).addTo(map)
        .bindPopup(`<b>${prog.nama}</b><br>Progres: ${fisik}%`);
    }
  });
}
