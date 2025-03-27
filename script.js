document.addEventListener("DOMContentLoaded", () => {
    // Use the correct ID from the simplified HTML
    const listContainer = document.getElementById("link-list-container");
    // Use the correct class from the simplified HTML
    const initialLoadingIndicator = document.querySelector(".loading-initial");
  
    // --- Configuration ---
    // IMPORTANT: Public CORS proxies are unreliable. 403/Fetch errors are common.
    // You may need to switch between these or find others.
    // Only ONE should be uncommented at a time.
  
    // Option 1: allorigins.win (Requires URL encoding)
    const CORS_PROXY_CONFIG = {
      url: "https://api.allorigins.win/raw?url=", // Uncomment to use
      requiresEncoding: true,
    };
  
    // Option 2: corsproxy.io (Does NOT require URL encoding)
    // const CORS_PROXY_CONFIG = {
    //     url: "https://corsproxy.io/?", // Uncomment to use
    //     requiresEncoding: false,
    // };
  
    // Option 3: cors-anywhere (Requires activation click, heavily rate-limited)
    // const CORS_PROXY_CONFIG = {
    //     url: "https://cors-anywhere.herokuapp.com/", // Uncomment to use
    //     requiresEncoding: false,
    // };
  
    // --- Check if a proxy is selected ---
    if (!CORS_PROXY_CONFIG || !CORS_PROXY_CONFIG.url) {
      if (initialLoadingIndicator) initialLoadingIndicator.remove();
      listContainer.innerHTML = `<p class="error">Error: No CORS_PROXY selected in script.js. Please uncomment one option.</p>`;
      console.error(
        "No CORS_PROXY selected in script.js. Please uncomment one option."
      );
      return; // Stop execution
    }
  
    const CORS_PROXY = CORS_PROXY_CONFIG.url;
    const REQUIRES_ENCODING = CORS_PROXY_CONFIG.requiresEncoding;
  
    // --- Fetch and Process Feeds ---
    async function fetchAndDisplayFeeds() {
      try {
        const response = await fetch("feeds.json");
        if (!response.ok) {
          throw new Error(
            `Failed to load feeds.json: ${response.status} ${response.statusText}`
          );
        }
        const categories = await response.json();
  
        if (initialLoadingIndicator) initialLoadingIndicator.remove();
        listContainer.innerHTML = ""; // Clear container
  
        categories.forEach((category) => {
          // Create category folder structure (matching simplified CSS)
          const folderDiv = document.createElement("div");
          folderDiv.className = "folder"; // Use 'folder' class
  
          const title = document.createElement("h2");
          title.textContent = category.category;
          folderDiv.appendChild(title);
  
          const ul = document.createElement("ul");
          folderDiv.appendChild(ul);
  
          // Note: Collapse functionality removed for simplicity, add back if needed
          // title.addEventListener("click", () => {
          //     folderDiv.classList.toggle("collapsed");
          // });
  
          listContainer.appendChild(folderDiv);
  
          // Process each site in the category
          category.sites.forEach((site) => {
            const li = document.createElement("li");
            const siteId = sanitizeId(site.name); // Use sanitized ID
  
            // Simplified innerHTML matching the CSS and original working script
            li.innerHTML = `
                <div class="site-item">
                  <img src="https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}" alt="${site.name} Logo" class="site-logo" />
                  <a href="${site.url}" target="_blank" rel="noopener noreferrer">${site.name}</a>
                </div>
                <div class="latest-post" id="latest-${siteId}">
                   <i class="fas fa-spinner fa-spin"></i> Loading latest post...
                </div>
              `;
            ul.appendChild(li);
  
            // Fetch the latest post for this site
            fetchLatestPost(site.feedUrl, siteId); // Pass siteId
          });
        });
      } catch (error) {
        console.error("Error fetching or processing feeds.json:", error);
        if (initialLoadingIndicator) initialLoadingIndicator.remove();
        listContainer.innerHTML = `<p class="error">Could not load feed data: ${error.message}. Please check console.</p>`;
      }
    }
  
    // --- Fetch and Parse a Single Feed ---
    async function fetchLatestPost(feedUrl, siteId) {
      const latestPostContainer = document.getElementById(`latest-${siteId}`);
  
      if (!feedUrl) {
        if (latestPostContainer) {
          latestPostContainer.innerHTML = `<span class="error-msg">RSS feed URL not configured.</span>`;
        }
        return;
      }
  
      const targetUrl = REQUIRES_ENCODING ? encodeURIComponent(feedUrl) : feedUrl;
      const proxiedUrl = `${CORS_PROXY}${targetUrl}`;
  
      try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
  
        const items = xmlDoc.querySelectorAll("item, entry");
        if (items.length > 0) {
          const latestItem = items[0];
          const title = latestItem.querySelector("title")?.textContent || "No title";
          const link =
            latestItem.querySelector("link")?.textContent ||
            latestItem.querySelector("link[href]")?.getAttribute("href");
          const image =
            latestItem.querySelector("media\\:thumbnail, thumbnail")?.getAttribute("url") ||
            "https://via.placeholder.com/150";
          const description = latestItem.querySelector("description")?.textContent || "";
          const readTime = Math.ceil(description.split(" ").length / 200); // Approx. 200 WPM
  
          if (latestPostContainer) {
            latestPostContainer.innerHTML = `
              <img src="${image}" alt="${title}" />
              <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
              <div class="read-time">${readTime} min read</div>
            `;
          }
        } else {
          if (latestPostContainer) {
            latestPostContainer.innerHTML = `<span class="error-msg">No posts found in feed.</span>`;
          }
        }
      } catch (error) {
        console.error(`Error processing feed for ${siteId}:`, error);
        if (latestPostContainer) {
          latestPostContainer.innerHTML = `<span class="error-msg">Error: ${error.message}.</span>`;
        }
      }
    }
  
    // --- Utility to create safe IDs ---
    function sanitizeId(name) {
      // Use the more robust sanitizer
      return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single
    }
  
    // --- Initial Load ---
    fetchAndDisplayFeeds();
  });
