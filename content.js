let lastSkipAt = 0;
const SKIP_COOLDOWN_MS = 1500;
let skipInProgress = false;
let lastSkippedPath = null;

function skipShort() {
    console.log("Skipping sponsored short...");

    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowDown",
            code: "ArrowDown",
            keyCode: 40,
            which: 40,
            bubbles: true
        })
    );
}

function checkForSponsored() {
    // Only run on Shorts pages
    if (!window.location.pathname.startsWith("/shorts/")) return;

    const badge = document.querySelector(".yt-badge-shape__text");

    if (!badge) return;

    if (badge.textContent.trim() === "Sponsored") {

        if (skipInProgress) {
            return;
        }

        const now = Date.now();
        if (now - lastSkipAt <= SKIP_COOLDOWN_MS) {
            return;
        }

        // start a skip and watch for navigation to avoid repeated skips
        skipInProgress = true;
        lastSkippedPath = window.location.pathname;
        skipShort();

        const start = Date.now();
        const navWatcher = setInterval(() => {
            // if navigation happened, allow future skips
            if (window.location.pathname !== lastSkippedPath) {
                lastSkipAt = Date.now();
                skipInProgress = false;
                clearInterval(navWatcher);
                return;
            }

            // give up after 5s and reset state (fallback)
            if (Date.now() - start > 5000) {
                lastSkipAt = Date.now();
                skipInProgress = false;
                clearInterval(navWatcher);
            }
        }, 150);
    }
}

const observer = new MutationObserver(() => {
    checkForSponsored();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});