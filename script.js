let originalImageData = null;

const palettes = [
  ['#FFFFFF', '#FFCCCC', '#CC9999', '#000000'], // Light red to dark red
  ['#FFFFFF', '#CCFFCC', '#99CC99', '#000000'], // Light green to dark green
  ['#FFFFFF', '#CCCCFF', '#9999CC', '#000000'], // Light blue to dark blue
  ['#FFFFFF', '#FFFFCC', '#CCCC99', '#000000']  // Light yellow to dark yellow
];

// Handle file input change to load the image
document.getElementById('imageInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = function (loadEvent) {
      const img = new Image();

      img.onload = function () {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Store the original image data for later manipulation
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Apply current color and scale settings immediately after loading the image
        applyCurrentSettings();
      };

      img.src = loadEvent.target.result;
    };

    reader.readAsDataURL(file);
  }
});

// Function to apply current settings based on UI controls (color pickers and scale slider)
function applyCurrentSettings() {
  const scaleFactor = parseInt(document.getElementById('canvasSizeSlider').value, 10);
  manipulateAndScaleImage(scaleFactor);
}

// Function to manipulate colors and scale the image
function manipulateAndScaleImage(scaleFactor) {
  if (!originalImageData) return; // Ensure there's an image to work with

  const canvas = document.getElementById('imageCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Clear the canvas and adjust its size according to the scale factor
  canvas.width = originalImageData.width * scaleFactor;
  canvas.height = originalImageData.height * scaleFactor;

  // Call the function to manipulate colors which now also includes scaling
  manipulateColors(ctx, scaleFactor);
}

function manipulateColors(ctx, scaleFactor) {
  const width = originalImageData.width;
  const height = originalImageData.height;
  const scaledWidth = width * scaleFactor;
  const scaledHeight = height * scaleFactor;
  const manipulatedData = ctx.createImageData(scaledWidth, scaledHeight);

  // Initialize the colors array in the reverse order, so the first color is used for the brightest pixels,
  // and the last color is used for the darkest pixels.
  const colors = [
    hexToRgb(document.getElementById('color4').value), // Intended for the brightest pixels
    hexToRgb(document.getElementById('color3').value),
    hexToRgb(document.getElementById('color2').value),
    hexToRgb(document.getElementById('color1').value)  // Intended for the darkest pixels
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = originalImageData.data[index];
      const g = originalImageData.data[index + 1];
      const b = originalImageData.data[index + 2];
      // Convert pixel to grayscale using the luminosity method
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Determine which of the four colors to use based on the grayscale value
      let colorIndex = Math.floor(gray / 64); // No need to invert the index
      colorIndex = colorIndex > 3 ? 3 : colorIndex; // Ensure index is between 0 and 3
      const newColor = colors[colorIndex];

      // Fill a square of pixels with the new color in the scaled image
      for (let dy = 0; dy < scaleFactor; dy++) {
        for (let dx = 0; dx < scaleFactor; dx++) {
          const scaledIndex = ((y * scaleFactor + dy) * scaledWidth + (x * scaleFactor + dx)) * 4;
          manipulatedData.data[scaledIndex] = newColor.r;
          manipulatedData.data[scaledIndex + 1] = newColor.g;
          manipulatedData.data[scaledIndex + 2] = newColor.b;
          manipulatedData.data[scaledIndex + 3] = 255; // Full alpha
        }
      }
    }
  }
  // Draw the manipulated image data onto the canvas
  ctx.putImageData(manipulatedData, 0, 0);
}

function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return { r, g, b };
}


// Event listeners for the color pickers to apply new settings in real-time as the color is picked
document.querySelectorAll('input[type="color"]').forEach(picker => {
  picker.addEventListener('input', applyCurrentSettings);
});

// Event listener for the slider to apply new settings whenever the scale factor is changed
document.getElementById('canvasSizeSlider').addEventListener('input', applyCurrentSettings);

// Function to create and append palette buttons
function createPaletteButtons(palettes) {
  const selector = document.getElementById('paletteSelector');

  palettes.forEach((palette, index) => {
    const button = document.createElement('button');
    button.style.display = 'inline-block';
    button.style.border = '1px solid #ccc';
    button.style.width = '100px';
    button.style.height = '25px';
    button.style.background = `linear-gradient(to right, ${palette[0]}, ${palette[1]}, ${palette[2]}, ${palette[3]})`;
    button.addEventListener('click', () => applyPalette(palette));
    selector.appendChild(button);
  });
}

// Function to apply a palette to the color inputs
function applyPalette(palette) {
  document.getElementById('color1').value = palette[0];
  document.getElementById('color2').value = palette[1];
  document.getElementById('color3').value = palette[2];
  document.getElementById('color4').value = palette[3];

  // Trigger the color manipulation and scaling to reflect the new palette
  applyCurrentSettings();
}

// Create and append palette buttons on document load
document.addEventListener('DOMContentLoaded', () => createPaletteButtons(palettes));
