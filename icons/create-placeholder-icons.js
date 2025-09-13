// Simple script to create placeholder icons
// You can run this in a browser console or use proper icon generation tools

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#16213e');
    gradient.addColorStop(1, '#1a1a2e');
    
    // Draw background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw simple lock icon
    const centerX = size / 2;
    const centerY = size / 2;
    const lockSize = size * 0.3;
    
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = size * 0.02;
    ctx.beginPath();
    ctx.arc(centerX, centerY - lockSize * 0.2, lockSize * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(centerX - lockSize * 0.4, centerY - lockSize * 0.1, lockSize * 0.8, lockSize * 0.6);
    
    // Convert to blob and download
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `icon-${size}x${size}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
});

console.log('Icon generation complete!');