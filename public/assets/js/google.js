/**
 * Fetches the Google Client ID from the backend, waits for the GSI script,
 * then initializes Google Identity Services with the given credential callback.
 * @param {function} onCredential - called with the JWT credential string on success
 */
export async function initGoogleSignIn(onCredential) {
    const [clientId] = await Promise.all([
        fetchClientId(),
        waitForGSI(),
    ]);

    google.accounts.id.initialize({
        client_id:             clientId,
        callback:              ({ credential }) => onCredential(credential),
        auto_select:           false,
        cancel_on_tap_outside: true,
    });
}

/**
 * Renders the official Google Sign-In button inside the given container element.
 * Must be called after initGoogleSignIn resolves.
 * @param {HTMLElement} container
 */
export function renderGoogleButton(container) {
    google.accounts.id.renderButton(container, {
        theme:  'outline',
        size:   'large',
        shape:  'pill',
        width:  400,
        locale: 'es',
    });
}

/**
 * Renders an icon-only (G logo) Google Sign-In button for narrow viewports.
 * @param {HTMLElement} container
 */
export function renderGoogleIconButton(container) {
    google.accounts.id.renderButton(container, {
        theme: 'outline',
        size:  'large',
        type:  'icon',
        shape: 'circle',
    });
}

async function fetchClientId() {
    const res  = await fetch('/src/api/config.php');
    const json = await res.json();
    if (!json?.data?.google_client_id) throw new Error('Google client ID no disponible.');
    return json.data.google_client_id;
}

function waitForGSI() {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();
        const start = Date.now();
        const iv = setInterval(() => {
            if (window.google?.accounts?.id) {
                clearInterval(iv);
                resolve();
            } else if (Date.now() - start > 10_000) {
                clearInterval(iv);
                reject(new Error('Google GSI timed out'));
            }
        }, 50);
    });
}
