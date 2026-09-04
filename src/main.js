const { invoke } = window.__TAURI__.core;

let excList = [];
let versions = {};
let installed = {};
let pollInterval = null;
let wireTimeout = null;
let resizeTimeout = null;

function buildDataJson() {
    const tabs = {};

    excList.forEach((exc, i) => {
        const inst = installed[exc.name];
        const latest = versions[exc.name];

        const leftElements = [
            { visible: true, type: "Label", index: 1, layoutOrder: 1, text: `Installed: ${inst || "—"}`, properties: { addons: [], doesWrap: false } },
            { visible: true, type: "Label", index: 2, layoutOrder: 2, text: `Latest: ${latest || "unavailable"}`, properties: { addons: [], doesWrap: false } },
        ];

        const rightElements = [];
        if (!inst) {
            rightElements.push({ visible: true, type: "Button", disabled: false, layoutOrder: 1, text: "Download", index: 1, properties: { risky: false, doubleClick: false } });
        } else if (inst !== latest && latest) {
            rightElements.push({ visible: true, type: "Button", disabled: false, layoutOrder: 1, text: "Update", index: 1, properties: { risky: false, doubleClick: false } });
            rightElements.push({ visible: true, type: "Label", index: 2, layoutOrder: 2, text: `Current: ${inst}`, properties: { addons: [], doesWrap: true } });
        } else {
            rightElements.push({ visible: true, type: "Label", index: 1, layoutOrder: 1, text: "Up to date ✓", properties: { addons: [], doesWrap: false } });
        }

        tabs[exc.name] = {
            type: "MainTab",
            name: exc.name,
            description: "exc downloader",
            order: i + 1,
            icon: "DownloadIcon",
            isKeyTab: false,
            dependencyGroupboxes: [],
            elements: [],
            tabboxes: { Right: [], Left: [], Unknown: [] },
            warningBox: { Visible: false, Title: "", IsNormal: true, Text: "", LockSize: false },
            groupboxes: {
                Left: {
                    Status: {
                        visible: true, type: "Groupbox", side: "Left", order: 1, icon: "InfoIcon",
                        name: "Status", collapsed: false, disableCollapsing: false,
                        dependencies: [], dependencyBoxes: [], elements: leftElements
                    }
                },
                Right: {
                    Actions: {
                        visible: true, type: "Groupbox", side: "Right", order: 1, icon: "DownloadIcon",
                        name: "Actions", collapsed: false, disableCollapsing: false,
                        dependencies: [], dependencyBoxes: [], elements: rightElements
                    }
                },
                Unknown: []
            }
        };
    });

    const tabStructure = {};
    excList.forEach(exc => {
        tabStructure[exc.name] = {
            tabboxes: { Right: [], Left: [], Unknown: [] },
            isKeyTab: false,
            elementCount: 2,
            groupboxes: { Right: ["Actions"], Left: ["Status"], Unknown: [] }
        };
    });

    return {
        structure: { tabStructure },
        elements: {},
        metadata: {
            dpiScale: 1, notifySide: "Right", window: [], globalSearch: true,
            unloaded: false, cornerRadius: 4, toggled: true, searchText: "",
            searching: false, isMobile: false, isLightTheme: false,
            cantDragForced: false, notifyOnError: false, showCustomCursor: false,
            activeTab: excList[0]?.name || "Delta", forceCheckbox: false,
            showToggleFrameInKeybinds: true, minSize: { x: 480, y: 360 },
            scheme: {
                mainColor: "191919", redColor: "ff3232", fontColor: "ffffff",
                darkColor: "000000", accentColor: "7d55ff", outlineColor: "282828",
                whiteColor: "ffffff", backgroundColor: "0f0f0f", destructiveColor: "dc2626"
            }
        },
        tabs
    };
}

function renderObsidian(data) {
    // Remove existing widget
    const old = document.querySelector('Obsidian, obsidian-widget');
    if (old) old.remove();

    const obsidian = document.createElement('Obsidian');
    obsidian.setAttribute('title', 'psychex');
    obsidian.setAttribute('footer', 'psychex');

    const script = document.createElement('script');
    script.type = 'application/json';
    script.textContent = JSON.stringify(data);
    obsidian.appendChild(script);
    document.body.appendChild(obsidian);

    if (wireTimeout) clearTimeout(wireTimeout);
    wireTimeout = setTimeout(wireButtons, 1500);
}

window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    if (wireTimeout) { clearTimeout(wireTimeout); wireTimeout = null; }
    resizeTimeout = setTimeout(() => renderObsidian(buildDataJson()), 200);
});

function wireButtons() {
    const widget = document.querySelector('obsidian-widget');
    if (!widget) return;

    // Download/Update button clicks
    widget.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const text = btn.textContent.trim();
        const activeTab = widget.querySelector('[role="tab"][aria-selected="true"]');
        const tabName = activeTab?.textContent?.trim();
        const exc = excList.find(e => e.name === tabName);
        if (!exc) return;
        if (text === 'Download' || text === 'Update') {
            startDownload(exc.name);
        }
    }, true);

    setupWindowControls(widget);
}

function setupWindowControls(widget) {
    const win = window.__TAURI__.window.getCurrentWindow();

    // Find the 48px header bar
    const header = [...widget.querySelectorAll('div')].find(el =>
        el.className.includes('h-[48px]') && el.className.includes('flex-row')
    );
    if (!header) return;

    const leftArea = header.firstElementChild;
    const rightArea = header.lastElementChild;

    // Make the entire header draggable
    header.style.webkitAppRegion = 'drag';
    header.style.cursor = 'move';

    // Disable drag on all interactive elements so clicks still work
    header.querySelectorAll('button, input, a, [role="button"]').forEach(el => {
        el.style.webkitAppRegion = 'no-drag';
        el.style.cursor = 'pointer';
    });

    // Inject minimize/maximize/close AFTER the move button in the right area
    const makeBtn = (html, title, hoverBg, onClick) => {
        const btn = document.createElement('button');
        btn.innerHTML = html;
        btn.title = title;
        btn.style.cssText = `
            width:28px;height:28px;border:none;background:transparent;cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            color:rgba(255,255,255,0.55);font-size:13px;border-radius:3px;
            flex-shrink:0;-webkit-app-region:no-drag;
        `;
        btn.addEventListener('mouseenter', () => btn.style.background = hoverBg);
        btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
        btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
        return btn;
    };

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;align-items:center;gap:1px;flex-shrink:0;-webkit-app-region:no-drag;padding-right:4px;';
    controls.appendChild(makeBtn('&#8722;', 'Minimize', 'rgba(255,255,255,0.12)', () => win.minimize()));
    controls.appendChild(makeBtn('&#9633;', 'Maximize', 'rgba(255,255,255,0.12)', () => win.toggleMaximize()));
    controls.appendChild(makeBtn('&#10005;', 'Close', 'rgba(200,30,30,0.75)', () => win.close()));

    if (rightArea) {
        rightArea.appendChild(controls);
    }

    // Footer resize arrow: startResizeDragging (not drag)
    const footer = widget.querySelector('div[class*="absolute"][class*="bottom-0"]');
    if (footer) {
        footer.style.cursor = 'se-resize';
        footer.style.pointerEvents = 'all';
        footer.style.webkitAppRegion = 'no-drag';
        footer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            win.startResizeDragging('SouthEast');
        });
    }
}

async function startDownload(excName) {
    const exc = excList.find(e => e.name === excName);
    const filename = versions[excName];
    if (!filename || !exc) return;

    try {
        await invoke('open_download_in_browser', { url: exc.download_base + filename });
    } catch (e) {
        console.error('Failed to open browser:', e);
        return;
    }

    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
        try {
            const done = await invoke('check_and_move_download', { excName, filename });
            if (done) {
                clearInterval(pollInterval);
                pollInterval = null;
                installed[excName] = filename;
                renderObsidian(buildDataJson());
            }
        } catch {}
    }, 2000);
}

async function init() {
    try {
        excList = await invoke('get_exc_list');
    } catch (e) {
        console.error('get_exc_list failed:', e);
        return;
    }

    await Promise.all(excList.map(async (exc) => {
        try {
            versions[exc.name] = await invoke('fetch_latest_version', {
                apiUrl: exc.api,
                field: exc.api_latest_field
            });
        } catch { versions[exc.name] = null; }
        try {
            installed[exc.name] = await invoke('get_installed_apk', { excName: exc.name });
        } catch { installed[exc.name] = null; }
    }));

    renderObsidian(buildDataJson());
}

init();
