function renderInput() {
  return `
    <h1>Input Program</h1>
    <p>Form digital untuk memasukkan data program infrastruktur.</p>
    
    <!-- FORM dibungkus card -->
    <div class="form-container">
      <form id="programForm" novalidate>
        <div class="form-group">
          <label>Nama Kegiatan:</label>
          <input type="text" name="nama" required>
        </div>
        <div class="form-group">
          <label>Lokasi (koordinat):</label>
          <input type="text" id="lokasiInput" name="lokasi" placeholder="Klik peta untuk memilih lokasi" required>
        </div>
        <div id="map" style="height:250px; margin-bottom:1rem;"></div>
        <div class="form-group">
          <label>Tahun Pelaksanaan:</label>
          <input type="number" name="tahun" required>
        </div>
        <div class="form-group">
          <label>Anggaran:</label>
          <input type="number" name="anggaran" required>
        </div>
        <div class="form-group">
          <label>Sektor:</label>
          <select name="sektor" required>
            <option value="">-- Pilih --</option>
            <option value="jalan">Jalan</option>
            <option value="irigasi">Irigasi</option>
            <option value="pendidikan">Pendidikan</option>
            <option value="kesehatan">Kesehatan</option>
          </select>
        </div>
        <div class="form-group">
          <label>Upload Dokumen (PDF):</label>
          <input type="file" name="dokumen" accept="application/pdf" required>
        </div>
        <button type="submit" class="btn-submit">Simpan</button>
      </form>
    </div>
  `;
}

function attachFormValidation() {
  const form = document.getElementById("programForm");
  if (!form) return;

  // Inisialisasi Peta Leaflet
  const map = L.map('map').setView([-6.2, 106.8], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let marker;
  const lokasiInput = document.getElementById("lokasiInput");

  map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    lokasiInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }
  });

  // Validasi + simpan data
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    let valid = true;

    // Hapus pesan error lama
    form.querySelectorAll(".error").forEach(el => el.remove());

    // Cek setiap input
    form.querySelectorAll("input, select").forEach(input => {
      if (!input.value.trim() && input.type !== "file") {
        valid = false;
        const errorMsg = document.createElement("div");
        errorMsg.classList.add("error");
        errorMsg.textContent = `Field "${input.name}" wajib diisi.`;
        input.parentNode.appendChild(errorMsg);
      }
    });

    if (valid) {
      const lokasiBaru = form.lokasi.value.trim();
      let programs = JSON.parse(localStorage.getItem("programs")) || [];

      // Ambil file PDF (hanya nama file)
      const fileInput = form.dokumen.files[0];
      const fileName = fileInput ? fileInput.name : null;

      const data = {
        nama: form.nama.value.trim(),
        lokasi: lokasiBaru,
        tahun: form.tahun.value.trim(),
        anggaran: form.anggaran.value.trim(),
        sektor: form.sektor.value.trim(),
        dokumen: fileName,
        status: "Belum dipilih" // default status
      };

      programs.push(data);
      localStorage.setItem("programs", JSON.stringify(programs));

      alert("Data berhasil disimpan ✅");
      form.reset();
      if (marker) {
        map.removeLayer(marker);
        marker = null;
      }
    }
  });
}
