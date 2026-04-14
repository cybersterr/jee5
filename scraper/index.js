const axios = require("axios");
const fs = require("fs");

const STREAM_URL = "https://join-vaathala1-for-more.vodep39240327.workers.dev/zee5.m3u";
const OUTPUT_FILE = "stream.json";

async function fetchAndConvert() {
  try {
    const response = await axios.get(STREAM_URL, { responseType: "text" });
    const lines = response.data.split("\n");

    const result = {};

    let currentLogo = null;
    let currentGroup = null;
    let currentChannel = null;

    let counter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse #EXTINF
      if (line.startsWith("#EXTINF:")) {
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        const nameMatch = line.match(/,(.*)$/);

        currentLogo = logoMatch ? logoMatch[1] : null;
        currentGroup = groupMatch ? cleanText(groupMatch[1]) : null;
        currentChannel = nameMatch ? cleanText(nameMatch[1]) : null;
      }

      // Skip headers/options
      else if (
        line.startsWith("#EXTVLCOPT") ||
        line.startsWith("#EXTHTTP") ||
        line === "" ||
        line.startsWith("#EXTM3U")
      ) {
        continue;
      }

      // Stream URL
      else if (line.startsWith("http") && currentChannel) {
        result[counter] = {
          channel_name: currentChannel,
          group_title: currentGroup,
          tvg_logo: currentLogo,
          url: line
        };

        counter++;

        // Reset
        currentLogo = null;
        currentGroup = null;
        currentChannel = null;
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf-8");
    console.log("✅ stream.json created successfully");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// 🔧 Fix weird encoded text like â›¨ ð...
function cleanText(text) {
  return text
    .replace(/[^\x20-\x7E]+/g, " ") // remove weird unicode junk
    .replace(/\s+/g, " ")
    .trim();
}

fetchAndConvert();
