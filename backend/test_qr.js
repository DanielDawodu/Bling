import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testQr() {
    const url = 'otpauth://totp/Bling:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Bling';

    const qrSvg = await qrcode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 4
    });

    const logoPath = path.join(__dirname, '../frontend/public/logo.png');
    let logoBase64 = '';
    try {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
        console.error('Logo not found:', logoPath);
    }

    const viewBoxMatch = qrSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (viewBoxMatch && logoBase64) {
        const size = parseInt(viewBoxMatch[1]);
        const logoSize = Math.floor(size * 0.22);
        const center = size / 2;
        const pos = center - (logoSize / 2);

        const logoSvg = `
            <rect x="${pos - 1}" y="${pos - 1}" width="${logoSize + 2}" height="${logoSize + 2}" fill="white" rx="2" />
            <image x="${pos}" y="${pos}" width="${logoSize}" height="${logoSize}" href="${logoBase64}" />
        </svg>`;

        const finalQrCode = qrSvg.replace('</svg>', logoSvg);
        fs.writeFileSync('test_qr_with_logo.svg', finalQrCode);
        console.log('Saved test_qr_with_logo.svg');
    }
}

testQr();
