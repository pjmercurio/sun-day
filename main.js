// Global vars
let undoSteps = [];
let redoSteps = [];
let isToolkitVisible = false;
let currentColor = '#000000';

document.addEventListener('DOMContentLoaded', function() {
    startImageSlideshow();
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
    }, 5000);
}

function showWelcomePage() {
    const splashContainer = document.getElementById('splash-container');
    const welcomeContainer = document.getElementById('welcome-container');
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
    console.log('draw your sun');
    const welcomeContainer = document.getElementById('welcome-container');
    const drawingContainer = document.getElementById('drawing-container');
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
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    let drawing = false;

    // Adjust for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    function startDrawing(e) {
        drawing = true;
        const { offsetX, offsetY } = getOffset(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        // Prevent scrolling on touch devices
        e.preventDefault();
    }

    function draw(e) {
        if (!drawing) return;
        const { offsetX, offsetY } = getOffset(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.strokeStyle = currentColor;
        ctx.stroke();
        e.preventDefault();
    }

    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        undoSteps.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
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

function setupColorWheel() {
    const canvas = document.getElementById('color-wheel-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let isDrawing = false;

    // Set the desired size
    const desiredWidth = 100;
    const desiredHeight = 100;

    // Adjust for high-DPI displays
    canvas.width = desiredWidth * dpr;
    canvas.height = desiredHeight * dpr;

    // Adjust displayed size
    canvas.style.width = desiredWidth + 'px';
    canvas.style.height = desiredHeight + 'px';

    ctx.scale(dpr, dpr);

    const colorWheelImage = new Image();
    colorWheelImage.src = 'images/color_wheel2.png';
    colorWheelImage.onload = function() {
        ctx.drawImage(colorWheelImage, 0, 0, canvas.width / dpr, canvas.height / dpr);
    };

    function mouseMoved(event) {
        // Get the bounding rectangle of the canvas
        const rect = canvas.getBoundingClientRect();
    
        // Calculate the click position in the canvas's coordinate system
        const x = (event.clientX - rect.left) * (canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    
        // Get the color of the clicked pixel
        const pixel = ctx.getImageData(x, y, 1, 1);
        const data = pixel.data;
        const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
        currentColor = rgba;

        // Convert canvas coordinates back to relative positioning within the container
        const indicatorX = (event.clientX - rect.left) + 35;
        const indicatorY = (event.clientY - rect.top) + 5;

        // Update the indicator's position and make it visible
        const indicator = document.getElementById('color-indicator');
        indicator.style.left = indicatorX + 'px';
        indicator.style.top = indicatorY + 'px';
        indicator.style.display = 'block';
    }

    canvas.addEventListener('click', mouseMoved);
}

function setupScrolling() {
    // Prevent scrolling on touchstart, touchmove, and touchend events
    document.addEventListener('touchstart', preventTouch, { passive: false });
    document.addEventListener('touchmove', preventTouch, { passive: false });
    document.addEventListener('touchend', preventTouch, { passive: false });

    function preventTouch(event) {
        event.preventDefault();
    }
}

function toggleToolkit() {
    if (isToolkitVisible) hideToolkit();
    else showToolkit();
}

function showToolkit() {
    const topRow = document.getElementById('canvas-button-row-top');
    const canvasToolKit = document.getElementById('canvas-toolkit');
    const toggleToolkitImage = document.getElementById('toggle-toolkit-image');
    topRow.style.height = '170px';
    // topRow.style.paddingTop = 0;
    canvasToolKit.style.display = 'flex';
    // canvasToolKit.style.opacity = 1;
    toggleToolkitImage.src = 'images/minus_icon.png';
    setupColorWheel();
    isToolkitVisible = true;
}

function hideToolkit() {
    const topRow = document.getElementById('canvas-button-row-top');
    const canvasToolKit = document.getElementById('canvas-toolkit');
    const toggleToolkitImage = document.getElementById('toggle-toolkit-image');
    topRow.style.height = '';
    // topRow.style.paddingTop = '5px';
    toggleToolkitImage.src = 'images/plus_icon.png';
    setTimeout(() => {
        canvasToolKit.style.display = 'none';
    }, 300);
    // canvasToolKit.style.opacity = 0;
    isToolkitVisible = false;
}

function undo() {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentStep = undoSteps.pop();
    const lastStep = undoSteps[undoSteps.length - 1];
    if (currentStep) redoSteps.push(currentStep);
    if (lastStep) ctx.putImageData(lastStep, 0, 0);
}

function redo() {
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const nextStep = redoSteps.pop();
    if (nextStep) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(nextStep, 0, 0);
        undoSteps.push(nextStep);
    }
}

function changeSize(event) {
    const selectedButton = event.target;
    const dataSize = selectedButton.getAttribute('data-size');
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = dataSize;

    // Add the selected class to the correct button
    const buttons = document.getElementsByClassName('size-button');
    for (let button of buttons) {
        button.classList.remove('selected');
    }
    selectedButton.classList.add('selected');
}

function changeColor(event) {
    const newColor = event.target.value;
    currentColor = newColor;
}

function saveImage() {
    const canvas = document.getElementById('drawing-canvas');
    const link = document.createElement('a');
    link.download = 'your_sun.png';
    link.href = canvas.toDataURL();
    link.click();
    // const response = getSignedUrl();
    // console.log(response);
}

async function getSignedUrl(folderPath) {
    const response = await fetch(`https://us-central1-fresh-mason-364504.cloudfunctions.net/generateSignedUrl?folderPath=${encodeURIComponent(folderPath)}&mimeType=image/png`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}