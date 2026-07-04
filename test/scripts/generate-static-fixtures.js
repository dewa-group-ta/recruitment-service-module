// scripts/generate-static-fixtures.js
// Jalankan sekali: node scripts/generate-static-fixtures.js
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function generateOversizedPdf() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('CV Test - Oversized File Fixture', { x: 50, y: 800, size: 14, font });

  // Lampirkan attachment biner acak untuk menggemukkan ukuran file secara cepat
  // (~0.4 detik), tetap menghasilkan PDF valid — sudah diverifikasi via PyMuPDF.
  const filler = crypto.randomBytes(5.5 * 1024 * 1024);
  await pdfDoc.attach(filler, 'filler.bin', { mimeType: 'application/octet-stream' });

  const buf = Buffer.from(await pdfDoc.save());
  const outPath = path.join(__dirname, '../fixtures/cv_besar_6mb.pdf');
  fs.writeFileSync(outPath, buf);
  console.log('cv_besar_6mb.pdf:', (buf.length / 1024 / 1024).toFixed(2), 'MB ->', outPath);
}

async function generateBaseTemplateForEncryption() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('CV Test - Encrypted File Fixture (sebelum dienkripsi)', { x: 50, y: 800, size: 14, font });
  const buf = Buffer.from(await pdfDoc.save());
  const outPath = path.join(__dirname, '../fixtures/_cv_template_before_encrypt.pdf');
  fs.writeFileSync(outPath, buf);
  console.log('Template siap dienkripsi ->', outPath);
  console.log('\nLangkah selanjutnya (butuh qpdf terinstal: apt install qpdf / brew install qpdf):');
  console.log(
    `qpdf --encrypt userpass ownerpass 256 -- ${outPath} test/fixtures/cv_terenkripsi.pdf\n` +
    `rm ${outPath}   # hapus file template sementara setelah dienkripsi`
  );
}

(async () => {
  await generateOversizedPdf();
  await generateBaseTemplateForEncryption();
})();