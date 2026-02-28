let lastSkipAt = 0;
const SKIP_COOLDOWN_MS = 2500;
let skipInProgress = false;
let lastSkippedPath = null;

function skipShort() {

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

function showSkipCard() {
    const ID = 'yt-skip-card';
    let el = document.getElementById(ID);

    if (!el) {
        el = document.createElement('div');
        el.id = ID;
        el.textContent = 'Ad skipped';
        Object.assign(el.style, {
            position: 'fixed',
            top: '64px',
            right: '64px',
            padding: '12px 18px',
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: '0',
            transform: 'translateY(-6px) scale(0.98)',
            transition: 'opacity 0.35s ease, transform 0.35s ease'
        });
        document.body.appendChild(el);
    }

    // Clear any existing timers so repeated skips reset visibility
    if (el._skipFadeTimeout) {
        clearTimeout(el._skipFadeTimeout);
        el._skipFadeTimeout = null;
    }
    if (el._skipRemoveTimeout) {
        clearTimeout(el._skipRemoveTimeout);
        el._skipRemoveTimeout = null;
    }

    // show
    console.debug('yt-shorts-skipper: showing skip card');
    // force reflow to ensure transition triggers even if element was present
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect();
    el.style.opacity = '1';
    el.style.transform = 'translateY(0) scale(1)';

    // stay visible for 2000ms then fade out
    el._skipFadeTimeout = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px) scale(0.98)';
        el._skipFadeTimeout = null;
        // remove from DOM after transition
        el._skipRemoveTimeout = setTimeout(() => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
            el._skipRemoveTimeout = null;
        }, 450);
    }, 2000);
}

function checkForSponsored() {
    // Only run on Shorts pages
    if (!window.location.pathname.startsWith("/shorts/")) return;

    const badge = document.querySelector(".yt-badge-shape__text");

    if (!badge) return;

    // ensure the badge is attached to the document and visible (avoid stale/hidden nodes)
    const badgeText = badge.textContent ? badge.textContent.trim() : '';
    const rect = badge.getBoundingClientRect ? badge.getBoundingClientRect() : { width: 0, height: 0 };
    if (!badge.isConnected || !badgeText || badgeText.toLowerCase() !== 'sponsored' || rect.width === 0 || rect.height === 0) return;

    if (badgeText === "Sponsored") {
        // if this is the same path we last skipped, don't auto-skip again when the user returns
        if (lastSkippedPath && window.location.pathname === lastSkippedPath) {
            return;
        }

        if (skipInProgress) {
            return;
        }

        const now = Date.now();
        if (now - lastSkipAt <= SKIP_COOLDOWN_MS) {
            return;
        }

        // final sanity re-check right before skipping to avoid acting on stale DOM
        const freshBadge = document.querySelector(".yt-badge-shape__text");
        if (!freshBadge) {
            return;
        }
        const freshText = freshBadge.textContent ? freshBadge.textContent.trim() : '';
        if (freshText.toLowerCase() !== 'sponsored') return;

        // start a skip and watch for navigation to avoid repeated skips
        skipInProgress = true;
        lastSkippedPath = window.location.pathname;
        skipShort();
        // record skip time immediately to prevent immediate subsequent auto-skips
        lastSkipAt = Date.now();
        showSkipCard();

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