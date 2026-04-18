const axios = require("axios");
const fs = require("fs");

const JSON_URL = "PASTE_YOUR_JSON_URL_HERE";
const OUTPUT_FILE = "stream.m3u";

// 🔹 Group settings
const GROUP_TITLE = "CS OTT | Zee5";
const GROUP_LOGO = "https://image.pngaaa.com/799/2122799-middle.png";

// 🔹 Entry to exclude
const EXCLUDE_NAME = "Install NetX Player - Join Telegram: @streamstartv";

async function convertJSONtoM3U() {
  try {
    const response = await axios.get(JSON_URL);
    const data = response.data;

    let m3u = "#EXTM3U\n\n";

    data.forEach((item) => {
      // ❌ Skip unwanted entry
      if (item.name === EXCLUDE_NAME) return;

      const name = cleanText(item.name || "Unknown");
      const logo = item.logo || GROUP_LOGO;

      let streamUrl = "";
      let extraLines = "";

      // 🔹 DASH (MPD)
      if (item.mpd_url) {
        streamUrl = item.mpd_url;

        if (item.user_agent) {
          extraLines += `#EXTVLCOPT:http-user-agent=${item.user_agent}\n`;
        }

        if (item.headers && Object.keys(item.headers).length > 0) {
          extraLines += `#EXTHTTP:${JSON.stringify(item.headers)}\n`;
        }

        if (item.license_url) {
          extraLines += `#KODIPROP:inputstream.adaptive.license_key=${item.license_url}\n`;
        }

        extraLines += `#KODIPROP:inputstream.adaptive.manifest_type=mpd\n`;
      }

      // 🔹 HLS fallback (if exists)
      else if (item.m3u8_url) {
        streamUrl = item.m3u8_url;
      }

      // ❌ Skip if no valid URL
      if (!streamUrl) return;

      // 🔹 Build M3U entry
      m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${GROUP_TITLE}",${name}\n`;
      m3u += extraLines;
      m3u += `${streamUrl}\n\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, m3u, "utf-8");

    console.log("✅ M3U playlist generated successfully!");

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// 🔧 Clean text
function cleanText(text) {
  return text
    .replace(/[^\x20-\x7E]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

convertJSONtoM3U();
