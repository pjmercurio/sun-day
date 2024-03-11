// Global constants
let welcomeContainer;
let drawingContainer;
let canvas;
let canvasToolKit;
const outputImageCanvas = document.createElement('canvas');
const outputImageCanvasCtx = outputImageCanvas.getContext('2d');

// Global vars
let undoSteps = [];
let redoSteps = [];
let isToolkitVisible = false;
let currentBrush = null;
let currentSize = 10;
let currentColor = '#000000';

document.addEventListener('DOMContentLoaded', function() {
    startImageSlideshow();
    welcomeContainer = document.getElementById('welcome-container');
    drawingContainer = document.getElementById('drawing-container');
    canvas = document.getElementById('drawing-canvas');
    canvasToolKit = document.getElementById('canvas-toolkit');
});

function startImageSlideshow() {
    const imageCount = 6;
    let currentIndex = 0;

    setInterval(() => {
        const imgElement1 = document.getElementById('splash-image-2');
        const imgElement2 = document.getElementById('splash-image-3');

        // Determine which image is currently visible and which is hidden
        const visibleImage = currentIndex % 2 === 0 ? imgElement1 : imgElement2;
        const hiddenImage = currentIndex % 2 === 0 ? imgElement2 : imgElement1;

        // Preload next image in the hidden image element
        const nextIndex = (currentIndex + 1) % imageCount;
        const nextImagePath = `images/halfsun_${nextIndex}.png`;
        hiddenImage.src = nextImagePath;

        // Swap the opacity
        visibleImage.style.opacity = "0";
        hiddenImage.style.opacity = "1";

        // Prepare for the next iteration
        currentIndex = nextIndex;
    }, 4000);
}

function showWelcomePage() {
    const splashContainer = document.getElementById('splash-container');
    document.body.style.backgroundColor = 'black';
    document.getElementById('splash-title').style.transform = 'translateY(-200%)';
    document.getElementById('splash-image-1').style.transform = 'translateX(-200%)';
    document.getElementById('splash-image-2').style.transform = 'translateX(200%)';
    document.getElementById('splash-image-3').style.transform = 'translateX(200%)';
    document.getElementById('splash-footer').style.transform = 'translateY(200%)';
    setTimeout(() => {
        splashContainer.style.display = 'none';
        welcomeContainer.style.display = 'flex';
        setTimeout(() => {
            welcomeContainer.style.opacity = 1;
        }, 10);
    }, 700);
}

function readMore(event) {
    event.stopPropagation();
    console.log('read more');
}

function drawYourSun(event) {
    event.stopPropagation();
    welcomeContainer.style.opacity = 0;
    welcomeContainer.style.transform = 'translateX(-200%)';
    document.body.style.backgroundColor = 'white';
    setTimeout(() => {
        welcomeContainer.style.display = 'none';
        drawingContainer.style.display = "flex";
        setTimeout(() => {
            drawingContainer.style.opacity = 1;
            setupCanvas();
        }, 10);
    }, 300);
}

function setupCanvas() {
    const ctx = canvas.getContext('2d');
    const halfSize = currentSize / 2;
    let isDrawing = false;

    // Adjust for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Create an offscreen canvas to draw on
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    function startDrawing(e) {
        isDrawing = true;
        const { offsetX, offsetY } = getOffset(e);

        if (currentBrush) {
            // Draw the brush image onto the off-screen canvas
            offscreenCtx.globalCompositeOperation = 'source-over';
            offscreenCtx.drawImage(currentBrush, offsetX - halfSize, offsetY - halfSize, currentSize, currentSize);

            // Apply color by drawing a colored rectangle over the image on the off-screen canvas
            offscreenCtx.globalCompositeOperation = 'source-in';
            offscreenCtx.fillStyle = currentColor;
            offscreenCtx.fillRect(offsetX - halfSize, offsetY - halfSize, currentSize, currentSize);

            // Now, composite the off-screen canvas onto the main canvas
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(offscreenCanvas, 0, 0);

            // Clear the off-screen canvas to prepare it for the next frame
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        } else {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY);
        }

        e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getOffset(e);

        if (currentBrush) {
            // Draw the brush image onto the off-screen canvas
            offscreenCtx.globalCompositeOperation = 'source-over';
            offscreenCtx.drawImage(currentBrush, offsetX - halfSize, offsetY - halfSize, currentSize, currentSize);

            // Apply color by drawing a colored rectangle over the image on the off-screen canvas
            offscreenCtx.globalCompositeOperation = 'source-in';
            offscreenCtx.fillStyle = currentColor;
            offscreenCtx.fillRect(offsetX - halfSize, offsetY - halfSize, currentSize, currentSize);

            // Now, composite the off-screen canvas onto the main canvas
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(offscreenCanvas, 0, 0);

            // Clear the off-screen canvas to prepare it for the next frame
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        } else {
            ctx.lineTo(offsetX, offsetY);
            ctx.strokeStyle = currentColor;
            ctx.stroke();;
        }

        e.preventDefault();
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        undoSteps.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        redoSteps = [];
    }

    function getOffset(e) {
        const rect = canvas.getBoundingClientRect();
        let x = 0;
        let y = 0;
    
        // For touch events
        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } 
        // For mouse events
        else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
    
        // Adjust for any scaling if the canvas display size is different from its drawing size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
    
        return {
            offsetX: (x * scaleX) / dpr,
            offsetY: (y * scaleY) / dpr
        };
    }

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
}

function selectBrush(brushIndex) {
    const buttons = document.querySelectorAll('.brush-button');
    buttons.forEach(button => button.classList.remove('selected'));
    buttons[brushIndex].classList.add('selected');

    if (brushIndex === 0) return currentBrush = null;

    const brushes = [new Image(), new Image(), new Image()];
    brushes.forEach((brush, index) => brush['src'] = `images/tip${index + 1}.png`);
    currentBrush = brushes[brushIndex];
}

function setupColorWheel() {
    const colorWheelCanvas = document.getElementById('color-wheel-canvas');
    const ctx = colorWheelCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set the desired size
    const desiredWidth = 100;
    const desiredHeight = 100;

    // Adjust for high-DPI displays
    colorWheelCanvas.width = desiredWidth * dpr;
    colorWheelCanvas.height = desiredHeight * dpr;

    // Adjust displayed size
    colorWheelCanvas.style.width = desiredWidth + 'px';
    colorWheelCanvas.style.height = desiredHeight + 'px';

    ctx.scale(dpr, dpr);

    const colorWheelImage = new Image();
    colorWheelImage.src = 'images/color_wheel2.png';
    colorWheelImage.onload = function() {
        ctx.drawImage(colorWheelImage, 0, 0, colorWheelCanvas.width / dpr, colorWheelCanvas.height / dpr);
    };

    function changeColor(event) {
        // Get the bounding rectangle of the colorWheelCanvas
        const rect = colorWheelCanvas.getBoundingClientRect();
    
        // Calculate the click position in the canvas's coordinate system
        const x = (event.clientX - rect.left) * (colorWheelCanvas.width / rect.width);
        const y = (event.clientY - rect.top) * (colorWheelCanvas.height / rect.height);
    
        // Get the color of the clicked pixel
        const pixel = ctx.getImageData(x, y, 1, 1);
        const data = pixel.data;
        const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
        currentColor = rgba;

        // Convert colorWheelCanvas coordinates back to relative positioning within the container
        const indicatorX = (event.clientX - rect.left) + 60;
        const indicatorY = (event.clientY - rect.top) + 5;

        // Update the indicator's position and make it visible
        const indicator = document.getElementById('color-indicator');
        indicator.style.left = indicatorX + 'px';
        indicator.style.top = indicatorY + 'px';
        indicator.style.display = 'block';
    }

    colorWheelCanvas.addEventListener('click', changeColor);
}

function toggleToolkit() {
    if (isToolkitVisible) hideToolkit();
    else showToolkit();
}

function showToolkit() {
    const topRow = document.getElementById('canvas-button-row-top');
    const toggleToolkitImage = document.getElementById('toggle-toolkit-image');
    topRow.style.height = '170px';
    canvasToolKit.style.display = 'flex';
    toggleToolkitImage.src = 'images/minus_icon.png';
    setupColorWheel();
    isToolkitVisible = true;
}

function hideToolkit() {
    const topRow = document.getElementById('canvas-button-row-top');
    const toggleToolkitImage = document.getElementById('toggle-toolkit-image');
    topRow.style.height = '';
    toggleToolkitImage.src = 'images/plus_icon.png';
    setTimeout(() => {
        canvasToolKit.style.display = 'none';
    }, 300);
    isToolkitVisible = false;
}

function undo() {
    const ctx = canvas.getContext('2d');
    const currentStep = undoSteps.pop();
    const lastStep = undoSteps[undoSteps.length - 1];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (lastStep) ctx.putImageData(lastStep, 0, 0);
    if (currentStep) redoSteps.push(currentStep);
}

function redo() {
    const ctx = canvas.getContext('2d');
    const nextStep = redoSteps.pop();
    if (nextStep) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(nextStep, 0, 0);
        undoSteps.push(nextStep);
    }
}

function changeSize(event) {
    const dataSize = event.target.value;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = dataSize;
    currentSize = dataSize;
}

function finishDrawing() {
    const drawingTitle = document.getElementById('drawing-title');
    const canvasButtons = document.getElementById('drawing-canvas-buttons');
    const drawingCanvasContainer = document.getElementById('drawing-canvas-container');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const bigArrow = document.getElementById('big-arrow');
    const shareToGallery = document.getElementById('share-to-gallery');
    drawingTitle.style.opacity = 0;
    canvasButtons.style.opacity = 0;
    drawingCanvasContainer.style.transform = 'translate(0, 38%)';
    drawingCanvasContainer.style.border = '1px solid #CCCCCC';
    drawingCanvas.style.pointerEvents = 'none';
    bigArrow.style.opacity = 1;
    shareToGallery.style.opacity = 1;
    shareToGallery.style.transform = 'translateY(0)';

    // Add swipe up gesture recognizer for drawingCanvasContainer
    let touchStartY = 0;
    let touchEndY = 0;
    drawingCanvasContainer.addEventListener('touchstart', function(event) {
        touchStartY = event.changedTouches[0].screenY;
    }, false);

    drawingCanvasContainer.addEventListener('touchend', function(event) {
        touchEndY = event.changedTouches[0].screenY;
        handleSwipeGestureIfNeccesary();
    }, false);

    function handleSwipeGestureIfNeccesary() {
        if (!(touchEndY < touchStartY - 100)) return;
        drawingCanvasContainer.style.transform = 'translateY(-200%)';
        setTimeout(() => {
            bigArrow.style.opacity = 0;
            shareToGallery.style.opacity = 0;
            this.showEndState();
        }, 750);
        this.shareToGallery();
    }
}

function shareToGallery() {
    console.log("Sharing to gallery...");
}

function saveImage() {
    // Set up the output image canvas
    const canvasHeight = canvas.height;
    const originalCanvasWidth = canvas.width;
    outputImageCanvas.height = canvasHeight;
    outputImageCanvas.width = originalCanvasWidth * 2;
    const staticImage = new Image();
    staticImage.src = 'images/halfsun_static.png';
    staticImage.onload = function() {
        outputImageCanvasCtx.drawImage(staticImage, 0, 0, originalCanvasWidth, canvasHeight);
        outputImageCanvasCtx.drawImage(canvas, originalCanvasWidth, 0);

        // Download the image
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `your_sun_${timestamp}.png`;
        link.href = outputImageCanvas.toDataURL();
        link.click();
    };
}

function showEndState() {
    const endContainer = document.getElementById('end-container');
    endContainer.style.display = 'flex';
    endContainer.style.opacity = 1;
}

async function getSignedUrl(folderPath) {
    const response = await fetch(`https://us-central1-fresh-mason-364504.cloudfunctions.net/generateSignedUrl?folderPath=${encodeURIComponent(folderPath)}&mimeType=image/png`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}