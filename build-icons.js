const png2icons = require('png2icons');
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'keya-logo.png');
const OUT_ICO = path.join(__dirname, 'assets', 'icon.ico');
const OUT_ICNS = path.join(__dirname, 'assets', 'icon.icns');

console.log('Generating icons from:', INPUT);

try {
    const input = fs.readFileSync(INPUT);

    // Create ICNS (Mac)
    const icns = png2icons.createICNS(input, png2icons.BICUBIC, 0);
    if (icns) {
        fs.writeFileSync(OUT_ICNS, icns);
        console.log('Created:', OUT_ICNS);
    } else {
        console.error('Failed to create ICNS');
    }

    // Create ICO (Windows)
    const ico = png2icons.createICO(input, png2icons.BICUBIC, 0, true);
    if (ico) {
        fs.writeFileSync(OUT_ICO, ico);
        console.log('Created:', OUT_ICO);
    } else {
        console.error('Failed to create ICO');
    }

} catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
}
