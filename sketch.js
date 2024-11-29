let visualSize = 200;     // Initial square size
let visualWidth = visualSize;  // Current visual dimensions
let visualHeight = visualSize;
let visualScale = 1.0;    // Scale factor for the rectangle
let minScale = 0.2;       // Minimum scale
let maxScale = 5.0;       // Maximum scale
let scaleStep = 0.1;      // How much to change scale per scroll

let initialTokenA = 1000;    // Initial token amounts (never change)
let initialTokenB = 0.02;
let currentTokenA = initialTokenA;  // Current token amounts (change with dragging)
let currentTokenB = initialTokenB;
let setpointTokenA = currentTokenA;  // Last applied values
let setpointTokenB = currentTokenB;
let deltaTokenA = 0;     // Delta amounts
let deltaTokenB = 0;
let constant;                // tokenA * tokenB
let isDragging = false;
let draggingHandle = null;
let gridSize = 20;
let centerX, centerY;
let dragStartX, dragStartY;
let dragStartVisualWidth, dragStartVisualHeight;

let targetScale = 1;
let currentScale = 1;
const ANIMATION_SPEED = 0.1; // Adjust this to control animation speed
const MAX_CANVAS_RATIO = 0.7; // Maximum ratio of canvas size to use

let isUpdatingFromOtherDelta = false;  // Flag to prevent recursive updates

function setup() {
    // Create canvas at full window size
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Handle window resize
    window.addEventListener('resize', windowResized);

    centerX = width / 2;
    centerY = height / 2;
    
    // Initialize grid size based on screen size - less dense grid
    gridSize = min(width, height) / 20;  // Changed from 40 to 20 for less density
    
    // Set initial visual scale based on screen size
    visualScale = min(width, height) / 800;
    
    // Set initial values from input fields
    let tokenAInput = document.getElementById('tokenA');
    let tokenBInput = document.getElementById('tokenB');
    initialTokenA = parseFloat(tokenAInput.value) || 1000;
    initialTokenB = parseFloat(tokenBInput.value) || 0.02;
    currentTokenA = initialTokenA;
    currentTokenB = initialTokenB;
    setpointTokenA = currentTokenA;
    setpointTokenB = currentTokenB;
    updateConstant();

    // Add input event listeners for delta inputs
    document.getElementById('deltaA').addEventListener('input', function(e) {
        if (isUpdatingFromOtherDelta) return; // Skip if update is from other delta
        
        let deltaA = parseFloat(e.target.value) || 0;
        currentTokenA = setpointTokenA + deltaA;
        if (currentTokenA < 0) currentTokenA = 0;
        currentTokenB = constant / currentTokenA;
        if (currentTokenB < 0) currentTokenB = 0;
        
        // Update other delta and visuals immediately
        let deltaB = currentTokenB - setpointTokenB;
        isUpdatingFromOtherDelta = true;
        document.getElementById('deltaB').value = deltaB.toFixed(9);
        isUpdatingFromOtherDelta = false;
        updateVisualDimensions();
        updateTargetScale(); // Check scale on each change
    });

    document.getElementById('deltaB').addEventListener('input', function(e) {
        if (isUpdatingFromOtherDelta) return; // Skip if update is from other delta
        
        let deltaB = parseFloat(e.target.value) || 0;
        currentTokenB = setpointTokenB + deltaB;
        if (currentTokenB < 0) currentTokenB = 0;
        currentTokenA = constant / currentTokenB;
        if (currentTokenA < 0) currentTokenA = 0;
        
        // Update other delta and visuals immediately
        let deltaA = currentTokenA - setpointTokenA;
        isUpdatingFromOtherDelta = true;
        document.getElementById('deltaA').value = deltaA.toFixed(9);
        isUpdatingFromOtherDelta = false;
        updateVisualDimensions();
        updateTargetScale(); // Check scale on each change
    });

    // Add input event listener for token inputs
    document.getElementById('tokenA').addEventListener('input', updateTokens);
    document.getElementById('tokenB').addEventListener('input', updateTokens);
}

function updateConstant() {
    constant = initialTokenA * initialTokenB;
}

function updateTokens() {
    // Get input values
    let tokenAInput = document.getElementById('tokenA');
    let tokenBInput = document.getElementById('tokenB');
    
    // Parse input values
    let newTokenA = parseFloat(tokenAInput.value);
    let newTokenB = parseFloat(tokenBInput.value);
    
    // Validate inputs
    if (isNaN(newTokenA) || isNaN(newTokenB) || newTokenA <= 0 || newTokenB <= 0) {
        return;
    }
    
    // Update initial and current tokens
    initialTokenA = newTokenA;
    initialTokenB = newTokenB;
    currentTokenA = newTokenA;
    currentTokenB = newTokenB;
    
    // Reset setpoint tokens
    setpointTokenA = newTokenA;
    setpointTokenB = newTokenB;
    
    // Reset deltas
    deltaTokenA = 0;
    deltaTokenB = 0;
    
    // Update delta inputs
    document.getElementById('deltaA').value = "0";
    document.getElementById('deltaB').value = "0";
    
    // Update visual dimensions
    updateVisualDimensions();
}

function applyDeltas() {
    // Update setpoints to current values
    setpointTokenA = currentTokenA;
    setpointTokenB = currentTokenB;
    
    // Update delta displays to 0
    document.getElementById('deltaA').value = '0';
    document.getElementById('deltaB').value = '0';
    deltaTokenA = 0;
    deltaTokenB = 0;
    
    // Update visual dimensions
    updateVisualDimensions();
}

function updateDeltaDisplays() {
    // Calculate deltas from setpoints
    let deltaA = currentTokenA - setpointTokenA;
    let deltaB = currentTokenB - setpointTokenB;
    
    // Update delta input displays
    document.getElementById('deltaA').value = deltaA.toFixed(9);
    document.getElementById('deltaB').value = deltaB.toFixed(9);
    deltaTokenA = deltaA;
    deltaTokenB = deltaB;
}

function resetInitialValues() {
    // Get current input values
    let tokenAInput = document.getElementById('tokenA');
    let tokenBInput = document.getElementById('tokenB');
    
    // Use current input values as new initial values
    initialTokenA = parseFloat(tokenAInput.value);
    initialTokenB = parseFloat(tokenBInput.value);
    
    // Reset current tokens to these values
    currentTokenA = initialTokenA;
    currentTokenB = initialTokenB;
    
    // Reset setpoint tokens
    setpointTokenA = initialTokenA;
    setpointTokenB = initialTokenB;
    
    // Reset all delta values
    deltaA = 0;
    deltaB = 0;
    deltaTokenA = 0;
    deltaTokenB = 0;
    
    // Update delta inputs
    document.getElementById('deltaA').value = "0";
    document.getElementById('deltaB').value = "0";
    
    // Reset visual dimensions to square
    visualWidth = visualSize;
    visualHeight = visualSize;
    
    // Reset scale to 1x
    targetScale = 1;
    visualScale = 1;
    
    // Update the constant based on new values
    updateConstant();
}

function draw() {
    background(26, 26, 26);
    
    // Animate scale if needed
    if (animateScale()) {
        window.requestAnimationFrame(() => redraw());
    }
    
    // Draw grid
    stroke(40);
    strokeWeight(1);
    for (let x = 0; x < width; x += gridSize) {
        line(x, 0, x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
        line(0, y, width, y);
    }
    
    // Calculate rectangle position to keep it centered
    let scaledWidth = visualWidth * visualScale;
    let scaledHeight = visualHeight * visualScale;
    let rectX = centerX - scaledWidth / 2;
    let rectY = centerY - scaledHeight / 2;
    
    // Draw the main rectangle
    fill(255, 255, 255, 30);
    stroke(255);
    strokeWeight(2);
    rect(rectX, rectY, scaledWidth, scaledHeight);
    
    // Draw the handles with touch-friendly sizes
    let handleSize = 20; // Larger for touch
    let handleSizeHalf = handleSize / 2;
    
    // Draw handle outlines for better visibility
    stroke(255, 255, 255, 80);
    strokeWeight(1);
    
    // Left handle
    fill(255, 255, 255, 80);
    rect(rectX - handleSize, rectY + scaledHeight/2 - handleSizeHalf, handleSize, handleSize);
    // Highlight if near
    if (abs(mouseX - (rectX)) < handleSize && abs(mouseY - (rectY + scaledHeight/2)) < handleSize) {
        fill(255, 255, 255, 120);
        rect(rectX - handleSize, rectY + scaledHeight/2 - handleSizeHalf, handleSize, handleSize);
    }
    
    // Right handle
    fill(255, 255, 255, 80);
    rect(rectX + scaledWidth, rectY + scaledHeight/2 - handleSizeHalf, handleSize, handleSize);
    // Highlight if near
    if (abs(mouseX - (rectX + scaledWidth + handleSizeHalf)) < handleSize && abs(mouseY - (rectY + scaledHeight/2)) < handleSize) {
        fill(255, 255, 255, 120);
        rect(rectX + scaledWidth, rectY + scaledHeight/2 - handleSizeHalf, handleSize, handleSize);
    }
    
    // Top handle
    fill(255, 255, 255, 80);
    rect(rectX + scaledWidth/2 - handleSizeHalf, rectY - handleSize, handleSize, handleSize);
    // Highlight if near
    if (abs(mouseX - (rectX + scaledWidth/2)) < handleSize && abs(mouseY - rectY) < handleSize) {
        fill(255, 255, 255, 120);
        rect(rectX + scaledWidth/2 - handleSizeHalf, rectY - handleSize, handleSize, handleSize);
    }
    
    // Draw status text
    let padding = 10;
    let lineHeight = 14;
    textSize(12);
    textAlign(RIGHT);
    fill(255);
    noStroke();
    
    // Current values
    text('A: ' + formatNumber(currentTokenA), width - padding, padding + lineHeight);
    text('B: ' + formatNumber(currentTokenB), width - padding, padding + lineHeight * 2);
    
    // Calculate and display deltas
    let deltaA = currentTokenA - setpointTokenA;
    let deltaB = currentTokenB - setpointTokenB;
    
    fill(deltaA > 0 ? '#00ff00' : deltaA < 0 ? '#ff0000' : '#888');
    text('ΔA: ' + (deltaA > 0 ? '+' : '') + formatNumber(deltaA), width - padding, padding + lineHeight * 3);
    
    fill(deltaB > 0 ? '#00ff00' : deltaB < 0 ? '#ff0000' : '#888');
    text('ΔB: ' + (deltaB > 0 ? '+' : '') + formatNumber(deltaB), width - padding, padding + lineHeight * 4);
    
    // Draw axis labels
    drawAxisLabels();
    
    // Display scale at bottom
    textSize(16);
    textAlign(CENTER);
    fill(255);
    text('Scale: ' + visualScale.toFixed(1) + 'x', centerX, height - 20);
}

function formatNumber(num) {
    // Convert to fixed decimal string with 9 places
    let fixed = Number(num).toFixed(9);
    
    // Split into whole and decimal parts
    let [whole, decimal] = fixed.split('.');
    
    // Add commas to whole part
    whole = Number(whole).toLocaleString();
    
    // Combine with decimal
    return `${whole}.${decimal}`;
}

function updateVisualDimensions() {
    // Calculate visual dimensions based on token ratios
    visualWidth = visualSize * (currentTokenA / initialTokenA);
    visualHeight = visualSize * (currentTokenB / initialTokenB);
}

function updateTargetScale() {
    // Calculate the scale needed to fit rectangle within canvas bounds
    let rectWidth = visualWidth;
    let rectHeight = visualHeight;
    
    // Calculate scales needed for width and height to fit canvas
    let scaleForWidth = (width * MAX_CANVAS_RATIO) / rectWidth;
    let scaleForHeight = (height * MAX_CANVAS_RATIO) / rectHeight;
    
    // Use the smaller scale to ensure both dimensions fit
    targetScale = Math.min(scaleForWidth, scaleForHeight);
}

function animateScale() {
    // Smoothly interpolate between current and target scale
    if (Math.abs(currentScale - targetScale) > 0.001) {
        currentScale += (targetScale - currentScale) * ANIMATION_SPEED;
        visualScale = currentScale;
        return true; // Animation still in progress
    }
    return false; // Animation complete
}

function mousePressed() {
    let rectX = centerX - (visualWidth * visualScale) / 2;
    let rectY = centerY - (visualHeight * visualScale) / 2;
    let scaledWidth = visualWidth * visualScale;
    let scaledHeight = visualHeight * visualScale;
    let handleSize = 20; // Match the draw size
    
    // Left handle - larger touch area
    if (abs(mouseX - rectX) < handleSize && 
        abs(mouseY - (rectY + scaledHeight/2)) < handleSize) {
        isDragging = true;
        draggingHandle = 'left';
    }
    // Right handle - larger touch area
    else if (abs(mouseX - (rectX + scaledWidth + handleSize/2)) < handleSize && 
             abs(mouseY - (rectY + scaledHeight/2)) < handleSize) {
        isDragging = true;
        draggingHandle = 'right';
    }
    // Top handle - larger touch area
    else if (abs(mouseX - (rectX + scaledWidth/2)) < handleSize && 
             abs(mouseY - rectY) < handleSize) {
        isDragging = true;
        draggingHandle = 'top';
    }

    if (isDragging) {
        dragStartX = mouseX;
        dragStartY = mouseY;
        dragStartVisualWidth = visualWidth;
        dragStartVisualHeight = visualHeight;
    }
}

function mouseDragged() {
    if (isDragging) {
        let dx = mouseX - pmouseX;
        let dy = mouseY - pmouseY;
        
        if (draggingHandle === 'left' || draggingHandle === 'right') {
            // Update width based on drag
            let scaledDx = dx / visualScale;
            let newWidth = visualWidth;
            
            if (draggingHandle === 'left') {
                newWidth -= scaledDx;
            } else {
                newWidth += scaledDx;
            }
            
            if (newWidth > 0) {
                visualWidth = newWidth;
                currentTokenA = initialTokenA * (visualWidth / visualSize);
                currentTokenB = constant / currentTokenA;
                updateVisualDimensions();
            }
        } else if (draggingHandle === 'top') {
            // Update height based on drag
            let scaledDy = dy / visualScale;
            let newHeight = visualHeight - scaledDy;
            
            if (newHeight > 0) {
                visualHeight = newHeight;
                currentTokenB = initialTokenB * (visualHeight / visualSize);
                currentTokenA = constant / currentTokenB;
                updateVisualDimensions();
            }
        }
        
        // Update delta displays
        updateDeltaDisplays();
    }
}

function mouseReleased() {
    if (draggingHandle !== null) {
        // Only update target scale when releasing mouse
        updateTargetScale();
    }
    draggingHandle = null;
}

function mouseWheel(event) {
    // Update both current and target scale for consistent behavior
    targetScale *= 1 - event.delta * 0.001;
    currentScale = targetScale;
    visualScale = currentScale;
    
    // Prevent default scroll behavior
    return false;
}

function drawAxisLabels() {
    let rectX = centerX - (visualWidth * visualScale) / 2;
    let rectY = centerY - (visualHeight * visualScale) / 2;
    let scaledWidth = visualWidth * visualScale;
    let scaledHeight = visualHeight * visualScale;
    
    // Style for arrows and labels
    stroke(255);
    strokeWeight(2);
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
    
    // Token A axis (width)
    // Arrow
    let arrowX = rectX + scaledWidth + 40;
    let arrowY = centerY;
    line(arrowX - 30, arrowY, arrowX, arrowY);
    line(arrowX, arrowY, arrowX - 10, arrowY - 5);
    line(arrowX, arrowY, arrowX - 10, arrowY + 5);
    // Label
    noStroke();
    text("A", arrowX + 10, arrowY);
    
    // Token B axis (height)
    // Arrow starts from top drag handle
    let arrowX2 = rectX + scaledWidth/2;
    let arrowY2 = rectY - 10; // Start from the drag handle
    stroke(255);
    line(arrowX2, arrowY2, arrowX2, arrowY2 - 30);  // Line points up
    line(arrowX2, arrowY2 - 30, arrowX2 - 5, arrowY2 - 20);  // Arrow head points up
    line(arrowX2, arrowY2 - 30, arrowX2 + 5, arrowY2 - 20);
    // Label
    noStroke();
    text("B", arrowX2, arrowY2 - 40);  // Label above arrow
}

let lastTouchDistance = 0;

function touchStarted(event) {
    // Don't handle touch events if we're touching an input or button
    if (event.target.tagName.toLowerCase() === 'input' || 
        event.target.tagName.toLowerCase() === 'button') {
        return;
    }
    
    mousePressed();
    // Prevent default only for canvas touches
    if (event.target.tagName.toLowerCase() === 'canvas') {
        return false;
    }
}

function touchMoved(event) {
    // Don't handle touch events if we're touching an input or button
    if (event.target.tagName.toLowerCase() === 'input' || 
        event.target.tagName.toLowerCase() === 'button') {
        return;
    }
    
    if (touches.length === 2) {
        // Calculate current touch distance
        let dx = touches[0].x - touches[1].x;
        let dy = touches[0].y - touches[1].y;
        let distance = sqrt(dx * dx + dy * dy);
        
        if (lastTouchDistance > 0) {
            // Change scale based on pinch gesture
            let scaleFactor = distance / lastTouchDistance;
            targetScale *= scaleFactor;
            currentScale = targetScale; // Update immediately for smooth pinch
            visualScale = currentScale;
        }
        
        lastTouchDistance = distance;
    } else if (touches.length === 1) {
        // Single touch - handle as drag
        mouseX = touches[0].x;
        mouseY = touches[0].y;
        mouseDragged();
    }
    
    // Prevent default only for canvas touches
    if (event.target.tagName.toLowerCase() === 'canvas') {
        return false;
    }
}

function touchEnded(event) {
    // Don't handle touch events if we're touching an input or button
    if (event.target.tagName.toLowerCase() === 'input' || 
        event.target.tagName.toLowerCase() === 'button') {
        return;
    }
    
    mouseReleased();
    // Prevent default only for canvas touches
    if (event.target.tagName.toLowerCase() === 'canvas') {
        return false;
    }
}

function windowResized() {
    // Resize canvas to full window dimensions
    resizeCanvas(windowWidth, windowHeight);
    
    // Update center coordinates
    centerX = width / 2;
    centerY = height / 2;
    
    // Recalculate grid size based on new dimensions - less dense grid
    gridSize = min(width, height) / 20;  // Changed from 40 to 20 for less density
    
    // Update visual scale based on new dimensions
    visualScale = min(visualScale * min(width, height) / 800, 2);
}
