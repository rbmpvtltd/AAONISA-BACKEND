// const fs = require('fs');
// const path = require('path');
// const { createCanvas } = require('canvas');
// const ffmpeg = require('fluent-ffmpeg');

// // Input & output video
// const inputVideo = 'C:/Users/Salam/Desktop/office/AAONISA-BACKEND/src/uploads/videos/1759917444578-241262223.mp4';
// const outputVideo = 'C:/Users/Salam/Desktop/office/AAONISA-BACKEND/src/uploads/videos/output_with_overlay.mp4';

// // Overlay settings
// const overlayText = '#salam';
// const fontSize = 48;
// const fontColor = '#00FF00';
// const rotation = -30; // degrees

// // Generate PNG overlay
// const canvas = createCanvas(400, 100); // width & height of overlay
// const ctx = canvas.getContext('2d');

// ctx.clearRect(0, 0, canvas.width, canvas.height);

// // Rotate canvas around center
// ctx.translate(canvas.width / 2, canvas.height / 2);
// ctx.rotate((rotation * Math.PI) / 180);

// // Draw text
// ctx.fillStyle = fontColor;
// ctx.font = `${fontSize}px Arial`;
// ctx.textBaseline = 'middle';
// ctx.textAlign = 'center';
// ctx.fillText(overlayText, 0, 0);

// // Save PNG
// const overlayPath = path.join(__dirname, 'overlay.png');
// fs.writeFileSync(overlayPath, canvas.toBuffer('image/png'));
// console.log('✅ Overlay PNG generated:', overlayPath);

// // Overlay position (centered on video)
// const overlayX = '(main_w-overlay_w)/2';
// const overlayY = '(main_h-overlay_h)/2';

// // Run FFmpeg
// ffmpeg(inputVideo)
//   .input(overlayPath)
//   .complexFilter([
//     // Apply a lighter color filter to the video
//     { filter: 'colorchannelmixer', options: 'rr=1:gg=0.647:bb=0:aa=0.2', outputs: 'v' },
//     // Overlay the PNG in center
//     { filter: 'overlay', options: { x: overlayX, y: overlayY }, inputs: ['v', '1:v'] }
//   ])
//   .outputOptions('-preset veryfast')
//   .on('start', cmd => console.log('🎬 FFmpeg command:', cmd))
//   .on('end', () => console.log('✅ Video processed with rotated overlay and filter!'))
//   .on('error', err => console.error('❌ FFmpeg error:', err.message))
//   .save(outputVideo);
// const fs = require('fs');
// const path = require('path');
// const { createCanvas } = require('canvas');
// const ffmpeg = require('fluent-ffmpeg');

// // Input & output video
// const inputVideo = 'C:/Users/Salam/Desktop/office/AAONISA-BACKEND/src/uploads/videos/1759917444578-241262223.mp4';
// const outputVideo = 'C:/Users/Salam/Desktop/office/AAONISA-BACKEND/src/uploads/videos/output_multi_overlay_final.mp4';

// // Overlay array
// const overlays = [
//   { text: '#salam', fontSize: 48, color: '#00FF00', rotation: -30, x: 0, y: 0 },
//   { text: '#hello', fontSize: 36, color: '#FF0000', rotation: 15, x: 50, y: 50 },
//   { text: '#world', fontSize: 40, color: '#0000FF', rotation: 0, x: -50, y: -50 }
// ];

// // Generate PNGs dynamically
// const overlayPaths = overlays.map((overlay, i) => {
//   const canvas = createCanvas(400, 100);
//   const ctx = canvas.getContext('2d');
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   ctx.translate(canvas.width / 2, canvas.height / 2);
//   ctx.rotate((overlay.rotation * Math.PI) / 180);

//   ctx.fillStyle = overlay.color;
//   ctx.font = `${overlay.fontSize}px Arial`;
//   ctx.textAlign = 'center';
//   ctx.textBaseline = 'middle';
//   ctx.fillText(overlay.text, 0, 0);

//   const overlayPath = path.join(__dirname, `overlay_${i}.png`);
//   fs.writeFileSync(overlayPath, canvas.toBuffer('image/png'));
//   console.log(`✅ Overlay PNG generated: ${overlayPath}`);
//   return overlayPath;
// });

// // Start FFmpeg command
// let command = ffmpeg(inputVideo);

// // Add each PNG as input
// overlayPaths.forEach(png => {
//   command = command.input(png);
// });

// // Build filter_complex dynamically
// const filters = [];
// filters.push({ filter: 'colorchannelmixer', options: 'rr=1:gg=0.647:bb=0:aa=0.2', outputs: 'v0' });

// overlayPaths.forEach((png, i) => {
//   const previousOutput = i === 0 ? 'v0' : `tmp${i-1}`;
//   const currentOutput = `tmp${i}`;

//   filters.push({
//     filter: 'overlay',
//     options: {
//       x: `(main_w-overlay_w)/2 + ${overlays[i].x}`,
//       y: `(main_h-overlay_h)/2 + ${overlays[i].y}`
//     },
//     inputs: [previousOutput, `${i+1}:v`],
//     outputs: currentOutput
//   });
// });

// const lastOutput = overlayPaths.length ? `tmp${overlayPaths.length-1}` : 'v0';

// command
//   .complexFilter(filters)
//   .outputOptions('-map', `[${lastOutput}]`, '-map', '0:a?')
//   .outputOptions('-preset veryfast')
//   .on('start', cmd => console.log('🎬 FFmpeg command:', cmd))
//   .on('end', () => console.log('✅ Video processed with multiple overlays!'))
//   .on('error', err => console.error('❌ FFmpeg error:', err.message))
//   .save(outputVideo);
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');

// Input & output video
const inputVideo = 'C:/Users/Salam/Desktop/office/AAONISA-BACKEND/src/uploads/videos/171391-845439656_medium.mp4';
const outputVideo = 'C:/Users/Salam/Desktop/office/AAONISA-BACKEND/src/uploads/videos/output_with_overlay_trimmed.mp4';

// Trim settings (seconds)
const trimStart = 12;
const trimEnd = 15;
const duration = trimEnd - trimStart;

// Overlay settings
const overlayTexts = ['#meekail-bhdwo'];
const fontSize = 72;
const fontColor = '#00FF00';
const rotation = 0;

const generateOverlay = (text, index) => {
    // 1. Create a temporary canvas to measure text
    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${fontSize}px Arial`;
    const textMetrics = tempCtx.measureText(text);
    
    // width and height of the text
    const textWidth = textMetrics.width;
    const textHeight = fontSize; // approximate height

    // 2. Calculate canvas size needed for rotation
    const rad = rotation * Math.PI / 180;
    const rotatedWidth = Math.abs(textWidth * Math.cos(rad)) + Math.abs(textHeight * Math.sin(rad));
    const rotatedHeight = Math.abs(textWidth * Math.sin(rad)) + Math.abs(textHeight * Math.cos(rad));

    // 3. Create final canvas
    const canvas = createCanvas(rotatedWidth, rotatedHeight);
    const ctx = canvas.getContext('2d');

    // 4. Translate to center and rotate
    ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
    ctx.rotate(rad);
    ctx.fillStyle = fontColor;
    ctx.font = `${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // 5. Draw text
    ctx.fillText(text, 0, 0);

    // 6. Save to file
    const overlayPath = path.join(__dirname, `overlay_${index}.png`);
    fs.writeFileSync(overlayPath, canvas.toBuffer('image/png'));
    return overlayPath;
};

// Generate all overlays
overlayTexts.push('#dummy');
const overlayPaths = overlayTexts.map((text, i) => generateOverlay(text, i));
// Overlay positions (center, with slight offset for multiple overlays)
const filterComplex = [];
filterComplex.push({ filter: 'colorchannelmixer', options: 'rr=1:gg=0.647:bb=0.5:aa=0.05', outputs: 'v0' });

// Add overlays one by one
overlayPaths.forEach((overlayPath, i) => {
    const inputIndex = i + 1; // because video is input 0
    const lastOutput = i === 0 ? 'v0' : `tmp${i - 1}`;
    filterComplex.push({
        filter: 'overlay',
        options: { x: 100, y: `(main_h-overlay_h)/2` },
        // options: { x: 160, y: 590 },
        inputs: [lastOutput, `${inputIndex}:v`],
        outputs: `tmp${i}`
    });
    console.log(filterComplex[i]);
});

const finalOutput = overlayPaths.length > 0 ? `tmp${overlayPaths.length - 1}` : 'v0';

// Run FFmpeg
const command = ffmpeg(inputVideo);
overlayPaths.forEach(overlay => command.input(overlay));

command
  .setStartTime(trimStart)
  .setDuration(duration)
  .complexFilter(filterComplex, finalOutput)
  .outputOptions('-preset veryfast')
  .on('start', cmd => console.log('🎬 FFmpeg command:', cmd))
  .on('end', () => {console.log('✅ Video processed with overlays & trimming!')
    const overlayFiles = ['overlay.png', 'overlay_0.png', 'overlay_1.png', 'overlay_2.png'];
    overlayFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑 Deleted ${filePath}`);
        }
    });
  })
  .on('error', err => console.error('❌ FFmpeg error:', err.message))
  .save(outputVideo);
