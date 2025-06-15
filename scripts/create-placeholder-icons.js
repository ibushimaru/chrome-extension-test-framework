#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create simple 1x1 pixel PNG placeholder icons
const createPlaceholderPNG = () => {
    // Minimal 1x1 pixel PNG (red color)
    const pngData = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
        0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
        0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    return pngData;
};

// Create icons for the given extension path
const createIconsForExtension = (extensionPath) => {
    const iconsDir = path.join(extensionPath, 'icons');
    
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    const sizes = [16, 32, 48, 128];
    const pngData = createPlaceholderPNG();
    
    sizes.forEach(size => {
        const iconPath = path.join(iconsDir, `icon-${size}.png`);
        if (!fs.existsSync(iconPath)) {
            fs.writeFileSync(iconPath, pngData);
            console.log(`✅ Created ${iconPath}`);
        }
    });
};

// Main function
const main = () => {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Create icons for all sample extensions
        const samplesDir = path.join(__dirname, '..', 'samples');
        const extensions = ['good-extension', 'bad-extension', 'minimal-extension'];
        
        extensions.forEach(ext => {
            const extPath = path.join(samplesDir, ext);
            if (fs.existsSync(extPath)) {
                console.log(`\n📁 Creating icons for ${ext}...`);
                createIconsForExtension(extPath);
            }
        });
    } else {
        // Create icons for specific path
        const extensionPath = args[0];
        if (fs.existsSync(extensionPath)) {
            console.log(`📁 Creating icons for ${extensionPath}...`);
            createIconsForExtension(extensionPath);
        } else {
            console.error(`❌ Extension path not found: ${extensionPath}`);
            process.exit(1);
        }
    }
};

main();