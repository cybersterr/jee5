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
    let currentChannel = null;
    let currentHeaders = {};
    let currentUserAgent = null;

    let counter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 🔹 Parse EXTINF
      if (line.startsWith("#EXTINF:")) {
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const nameMatch = line.match(/,(.*)$/);

        currentLogo = logoMatch ? logoMatch[1] : null;
        currentChannel = nameMatch ? cleanText(nameMatch[1]) : null;
      }

      // 🔹 Extract USER-AGENT
      else if (line.startsWith("#EXTVLCOPT")) {
        const uaMatch = line.match(/http-user-agent=(.*)/);
        currentUserAgent = uaMatch ? uaMatch[1].trim() : null;
      }

      // 🔹 Extract HEADERS JSON
      else if (line.startsWith("#EXTHTTP")) {
        try {
          const jsonPart = line.replace("#EXTHTTP:", "").trim();
          currentHeaders = JSON.parse(jsonPart);
        } catch {
          currentHeaders = {};
        }
      }

      // 🔹 Skip useless lines
      else if (line === "" || line.startsWith("#EXTM3U")) {
        continue;
      }

      // 🔹 URL line
      else if (line.startsWith("http") && currentChannel) {
        result[counter] = {
          channel_name: currentChannel,
          group_title: "CS OTT | ZEE5", // ✅ FORCED
          tvg_logo: currentLogo,
          url: line,
          user_agent: currentUserAgent,
          headers: currentHeaders
        };

        counter++;

        // Reset
        currentLogo = null;
        currentChannel = null;
        currentHeaders = {};
        currentUserAgent = null;
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf-8");
    console.log("✅ stream.json created with full extraction");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// 🔧 Clean weird encoded text
function cleanText(text) {
  return text
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

fetchAndConvert();
