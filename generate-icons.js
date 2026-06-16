const fs = require('fs');
const zlib = require('zlib');

function createPNG(size) {
    const width = size, height = size;
    const data = Buffer.alloc(width * height * 4);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const cx = width / 2, cy = height / 2, r = width * 0.45;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist <= r) {
                // Green circle (#53FC18)
                data[i] = 83;
                data[i + 1] = 252;
                data[i + 2] = 24;
                data[i + 3] = 255;
            } else {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 0;
            }
        }
    }

    // Build PNG manually
    const rawData = [];
    for (let y = 0; y < height; y++) {
        rawData.push(Buffer.from([0])); // filter byte
        rawData.push(data.slice(y * width * 4, (y + 1) * width * 4));
    }
    const raw = Buffer.concat(rawData);
    const compressed = zlib.deflateSync(raw);

    // CRC32
    const crc32Table = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crc32Table[n] = c;
    }

    function crc32(buf) {
        let c = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            c = crc32Table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
        }
        return (c ^ 0xffffffff) >>> 0;
    }

    function chunk(type, chunkData) {
        const t = Buffer.from(type);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(chunkData.length);
        const crcData = Buffer.concat([t, chunkData]);
        const crcVal = Buffer.alloc(4);
        crcVal.writeUInt32BE(crc32(crcData));
        return Buffer.concat([len, t, chunkData, crcVal]);
    }

    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type (RGBA)
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    return Buffer.concat([
        sig,
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

[16, 48, 128].forEach(size => {
    const png = createPNG(size);
    fs.writeFileSync(`extension/icons/icon${size}.png`, png);
    console.log(`icon${size}.png created (${png.length} bytes)`);
});
