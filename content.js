console.log("YT Sponsor Skipper Loaded");

let lastSkipAt = 0;
const SKIP_COOLDOWN_MS = 1500;

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
        console.log("Sponsored short detected!");

        if (Date.now() - lastSkipAt > SKIP_COOLDOWN_MS) {
            lastSkipAt = Date.now();
            skipShort();
        } else {
            console.log("In cooldown, skipping suppressed.");
        }
    } else {
        console.log("No sponsorship detected.");
    }
}

const observer = new MutationObserver(() => {
    checkForSponsored();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});