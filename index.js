const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = "./frames"; // Directory to store captured frames
const SVG_FILE_PATH = "file:///Users/dmitry/dev/automationd/atun/demo.cast.svg"; // Replace with your SVG file path
// const SVG_FILE_PATH = "https://raw.githubusercontent.com/AutomationD/atun/refs/heads/feature/wip/demo.cast.svg"; // Replace with your SVG file path
const TOTAL_FRAMES = 30; // Total number of frames to capture
const FRAME_DELAY = 110; // Delay per frame in ms (20 fps)

(async () => {
  // Create the output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true, // Show the browser UI
    defaultViewport: null, // Use the full browser viewport
    args: ["--start-maximized"] // Optional: Start browser maximized
  });

  const page = await browser.newPage();

  // Set viewport size (adjust as needed)
  await page.setViewport({ width: 600, height: 300 });

  // Load the SVG file
  // Load the SVG file
  await page.goto(SVG_FILE_PATH, { waitUntil: "networkidle2" });

// Extract SVG dimensions and set the viewport dynamically
  const { width, height } = await page.evaluate(() => {
    const svg = document.querySelector("svg");
    return {
      width: svg ? svg.width.baseVal.value || 600 : 300,
      height: svg ? svg.height.baseVal.value || 600 : 300
    };
  });

  await page.setViewport({ width: Math.ceil(width), height: Math.ceil(height) });
  console.log(`Viewport set to: ${width}x${height}`);



  console.log("Rendering frames...");

  // Capture frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const framePath = path.join(OUTPUT_DIR, `frame_${String(i).padStart(3, "0")}.png`);
    await page.screenshot({ path: framePath });
    console.log(`Captured frame ${i + 1}/${TOTAL_FRAMES}`);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(FRAME_DELAY);
  }

  console.log("Frames captured successfully!");

  // Close the browser
  await browser.close();

  // Combine frames into a GIF using FFmpeg
  console.log("Combining frames into GIF...");
  const { exec } = require("child_process");
  const ffmpegCommand = `ffmpeg -y -framerate ${1000 / FRAME_DELAY} -i ${OUTPUT_DIR}/frame_%03d.png -loop 1 output.gif`;
  console.log(`${ffmpegCommand}`)

  exec(ffmpegCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error creating GIF: ${err.message}`);
      return;
    }
    console.log("GIF created successfully: output.gif");
  });
})();
