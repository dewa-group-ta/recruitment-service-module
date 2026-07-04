import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface CvEducation {
  institution: string;
  degree: string;
  major: string;
}

export interface CvExperience {
  position: string;
  company: string;
  start: string;
  end: string;
  description: string;
}

export interface CvContent {
  name: string;
  education: CvEducation[];
  experiences: CvExperience[];
}

/** Generate PDF CV dengan teks vektor asli, word-wrap, DAN baris posisi
 * dibuat bold agar pymupdf4llm mengekstraknya sebagai penanda markdown
 * (tanda bold atau heading) — sesuai instruksi system prompt LLM yang
 * mengandalkan heading/bold untuk menentukan batas antar entri pengalaman kerja.
 */
export async function buildTextCvPdf(content: CvContent): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.addPage([595, 842]); // A4
  let y = 800;
  const LEFT_X = 50;
  const MAX_WIDTH = 495;

  const wrapText = (text: string, size: number, useFont: typeof font): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (useFont.widthOfTextAtSize(test, size) > MAX_WIDTH && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const draw = (text: string, size = 11, bold = false) => {
    if (!text) {
      y -= size + 8;
      return;
    }
    const useFont = bold ? boldFont : font;
    const lines = wrapText(text, size, useFont);
    for (const line of lines) {
      if (y < 60) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }
      page.drawText(line, { x: LEFT_X, y, size, font: useFont, color: rgb(0, 0, 0) });
      y -= size + 8;
    }
  };

  draw(content.name, 16, true);
  draw('');
  draw('PENDIDIKAN', 13, true);
  for (const edu of content.education) {
    draw(`${edu.institution} - ${edu.degree} ${edu.major}`);
  }
  draw('');
  draw('PENGALAMAN KERJA', 13, true);
  for (const exp of content.experiences) {
    // Baris posisi+perusahaan+tanggal dibuat BOLD — inilah perbaikan ITC-14
    draw(`${exp.position} - ${exp.company} (${exp.start} - ${exp.end})`, 11, true);
    draw(exp.description, 11, false);
    draw('');
  }

  return Buffer.from(await pdfDoc.save());
}

/** PDF "hasil scan" — hanya gambar polos, tanpa teks vektor sama sekali (ITC-09). */
export async function buildScannedNoTextPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.9, 0.9, 0.9) });
  return Buffer.from(await pdfDoc.save());
}

/** Bukan struktur PDF valid sama sekali — untuk kasus file corrupt. */
export function buildCorruptPdf(): Buffer {
  return Buffer.from('%PDF-1.4\nini bukan struktur PDF yang valid sama sekali');
}

export const CV_PRESET = {
  relevan: (): CvContent => ({
    name: 'Budi Santoso',
    education: [{ institution: 'Universitas Indonesia', degree: 'S1', major: 'Teknik Informatika' }],
    experiences: [{
      position: 'Backend Developer',
      company: 'PT Teknologi Maju',
      start: 'Januari 2022',
      end: 'present',
      description: 'Membangun dan memelihara REST API menggunakan NestJS dan PostgreSQL, berkolaborasi dengan tim frontend.',
    }],
  }),

  tidakRelevan: (): CvContent => ({
    name: 'Andi Gudang',
    education: [{ institution: 'SMKN 4 Bandung', degree: 'SMK', major: 'Logistik' }],
    experiences: [{
      position: 'Staff Gudang',
      company: 'PT Logistik Sentosa',
      start: 'Januari 2021',
      end: 'Januari 2023',
      description: 'Mengelola inventaris gudang, mencatat keluar masuk barang, dan mengoperasikan forklift.',
    }],
  }),

  multiPengalaman: (): CvContent => ({
    name: 'Citra Dewi',
    education: [{ institution: 'Universitas Gadjah Mada', degree: 'S1', major: 'Sistem Informasi' }],
    experiences: [
      {
        position: 'Staff Gudang',
        company: 'PT Logistik Sentosa',
        start: 'Januari 2019',
        end: 'Januari 2020',
        description: 'Mengelola inventaris gudang dan logistik harian.',
      },
      {
        position: 'Backend Developer',
        company: 'PT Teknologi Maju',
        start: 'Februari 2020',
        end: 'Januari 2022',
        description: 'Membangun REST API menggunakan NestJS, mengelola database PostgreSQL, deploy ke server produksi.',
      },
      {
        position: 'Customer Service',
        company: 'PT Retail Nusantara',
        start: 'Februari 2022',
        end: 'present',
        description: 'Melayani pertanyaan pelanggan melalui telepon dan email.',
      },
    ],
  }),

  freshGraduate: (): CvContent => ({
    name: 'Dewi Lestari',
    education: [{ institution: 'Universitas Padjadjaran', degree: 'S1', major: 'Teknik Informatika' }],
    experiences: [],
  }),

  tanpaPendidikan: (): CvContent => ({
    name: 'Eko Prasetyo',
    education: [],
    experiences: [{
      position: 'Backend Developer',
      company: 'PT Teknologi Maju',
      start: 'Januari 2022',
      end: 'present',
      description: 'Membangun REST API menggunakan NestJS.',
    }],
  }),

  s1RelevanUntukC03: (): CvContent => ({
    name: 'Fajar Nugraha',
    education: [{ institution: 'Universitas Indonesia', degree: 'S1', major: 'Teknik Informatika' }],
    experiences: [{
      position: 'Backend Developer',
      company: 'PT Teknologi Maju',
      start: 'Januari 2022',
      end: 'present',
      description: 'Membangun dan memelihara REST API menggunakan NestJS dan PostgreSQL, berkolaborasi dengan tim frontend.',
    }],
  }),

  smaRelevanUntukC03: (): CvContent => ({
    name: 'Gita Purnama',
    education: [{ institution: 'SMAN 1 Bandung', degree: 'SMA', major: 'IPA' }],
    experiences: [{
      position: 'Backend Developer',
      company: 'PT Teknologi Maju',
      start: 'Januari 2022',
      end: 'present',
      description: 'Membangun dan memelihara REST API menggunakan NestJS dan PostgreSQL, berkolaborasi dengan tim frontend.',
    }],
  }),
};