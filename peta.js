function renderPeta() {
  return `
    <h1>Peta Program</h1>
    <div id="programList"></div>
  `;
}

function initProgramMap() {
  let programs = JSON.parse(localStorage.getItem("programs")) || [];
  const container = document.getElementById("programList");

  if (programs.length === 0) {
    container.innerHTML = "<p>Belum ada data program.</p>";
    return;
  }

  // Loop setiap program → buat kotak sendiri
  container.innerHTML = programs.map((prog, index) => `
    <div class="peta-container">
      <!-- Kolom kiri: Peta -->
      <div class="peta-kiri">
        <div id="programMap-${index}" class="mini-map"></div>
      </div>

      <!-- Kolom kanan: Data input -->
      <div class="peta-kanan">
        <h3>${prog.nama || "Program Tanpa Nama"}</h3>
        <p><b>Tahun:</b> ${prog.tahun || "-"}</p>
        <p><b>Anggaran:</b> Rp${prog.anggaran || "-"}</p>
        <p><b>Sektor:</b> ${prog.sektor || "-"}</p>
        <p><b>Dokumen:</b> ${prog.dokumen || "-"}</p>
        <p>
          <b>Status:</b>
          <select id="status-${index}">
            <option value="Belum dipilih" ${prog.status==="Belum dipilih"?"selected":""}>Belum dipilih</option>
            <option value="Berjalan" ${prog.status==="Berjalan"?"selected":""}>Berjalan</option>
            <option value="Selesai" ${prog.status==="Selesai"?"selected":""}>Selesai</option>
          </select>
          <button onclick="updateStatus(${index})">Simpan</button>
        </p>
      </div>
    </div>
  `).join("");

  // Buat peta untuk setiap program
  programs.forEach((prog, index) => {
    const [lat, lng] = prog.lokasi.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      const map = L.map(`programMap-${index}`).setView([lat, lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${prog.nama || "-"}</b><br>Tahun: ${prog.tahun || "-"}`);
    }
  });
}

// Fungsi update status
function updateStatus(index) {
  let programs = JSON.parse(localStorage.getItem("programs")) || [];
  const select = document.getElementById(`status-${index}`);
  if (programs[index] && select) {
    programs[index].status = select.value;
    localStorage.setItem("programs", JSON.stringify(programs));
    alert(`Status program "${programs[index].nama}" diperbarui menjadi: ${select.value}`);
  }
}
