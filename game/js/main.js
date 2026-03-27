// 游戏入口
let game;
let staticNoise;
let loadedAssets = 0;
let totalAssets   = 0;

function disableBrowserDefaults() {
    document.addEventListener('contextmenu', e => { e.preventDefault(); return false; }, { capture: true });
    document.addEventListener('dragstart',   e => { e.preventDefault(); return false; }, { capture: true });
    document.addEventListener('selectstart', e => { e.preventDefault(); return false; }, { capture: true });
    document.addEventListener('copy',        e => { e.preventDefault(); return false; }, { capture: true });
    document.addEventListener('cut',         e => { e.preventDefault(); return false; }, { capture: true });
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && ['a','c','x','s','p','u'].includes(e.key)) e.preventDefault();
    }, { capture: true });
    document.addEventListener('touchstart', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false, capture: true });
    document.addEventListener('touchmove',  e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false, capture: true });
    document.addEventListener('mousedown', e => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return true;
        if (e.detail > 1) { e.preventDefault(); return false; }
    }, { capture: true });
}

function updatePreloadProgress(progress) {
    const bar  = document.getElementById('progress-bar');
    const pct  = document.getElementById('preloader-percentage');
    if (bar) bar.style.width = progress + '%';
    if (pct) pct.textContent = Math.round(progress) + '%';
}

async function preloadGameAssets() {
    // Use the same base-path logic as AssetManager
    const basePath = window.location.pathname.includes('/game/') ? '/game/' : './';

    const imagePaths = [
        'assets/images/original.png','assets/images/Cam1.png','assets/images/Cam2.png',
        'assets/images/Cam3.png','assets/images/Cam4.png','assets/images/Cam5.png',
        'assets/images/Cam6.png','assets/images/Cam7.png','assets/images/Cam8.png',
        'assets/images/Cam9.png','assets/images/Cam10.png','assets/images/Cam11.png',
        'assets/images/jump.png','assets/images/menubackground.png','assets/images/cutscene.png',
        'assets/images/fa3.png','assets/images/FNAE-Map-layout.png',
        'assets/images/enemyep1.png','assets/images/ep1.png','assets/images/ep4.png',
        'assets/images/enemyep4.png','assets/images/scaryhawk.png','assets/images/scaryep.png',
        'assets/images/scarytrump.png','assets/images/winscreen.png','assets/images/goldenstephen.png',
    ];

    const soundPaths = [
        'assets/sounds/music.ogg','assets/sounds/music3.ogg','assets/sounds/Static_sound.ogg',
        'assets/sounds/vents.ogg','assets/sounds/jumpcare.ogg','assets/sounds/Blip.ogg',
        'assets/sounds/winmusic.ogg','assets/sounds/chimes.ogg','assets/sounds/Crank1.ogg',
        'assets/sounds/Crank2.ogg','assets/sounds/goldenstephenscare.ogg',
    ];

    totalAssets = imagePaths.length + soundPaths.length;
    loadedAssets = 0;

    const inc = () => { loadedAssets++; updatePreloadProgress((loadedAssets / totalAssets) * 100); };

    const imgPromises = imagePaths.map(p => new Promise(res => {
        const img = new Image();
        img.onload = () => { inc(); res(); };
        img.onerror = () => { inc(); res(); };
        img.src = basePath + p;
    }));

    const audPromises = soundPaths.map(p => new Promise(res => {
        const a = new Audio();
        a.addEventListener('canplaythrough', () => { inc(); res(); }, { once: true });
        a.addEventListener('error',          () => { inc(); res(); }, { once: true });
        a.src = basePath + p;
        a.load();
    }));

    await Promise.all([...imgPromises, ...audPromises]);
    updatePreloadProgress(100);
    await new Promise(r => setTimeout(r, 500));
}

function hidePreloader() {
    const pre = document.getElementById('preloader');
    if (pre) { pre.classList.add('fade-out'); setTimeout(() => pre.style.display = 'none', 500); }
}

window.addEventListener('DOMContentLoaded', async () => {
    disableBrowserDefaults();
    await preloadGameAssets();
    preloadBackgrounds();
    hidePreloader();

    game = new Game();
    staticNoise = new StaticNoise();
    game.updateContinueButton();

    const mainMenu  = document.getElementById('main-menu');
    const menuMusic = document.getElementById('menu-music');

    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart');

    if (menuMusic) {
        menuMusic.volume = 0.5;
        if (autostart === '1') {
            menuMusic.play().catch(() => setupManualPlayback());
        } else {
            setupManualPlayback();
        }
    }

    function setupManualPlayback() {
        const play = () => {
            if (mainMenu && !mainMenu.classList.contains('hidden')) {
                menuMusic.play().catch(() => {});
            }
            document.removeEventListener('click',   play);
            document.removeEventListener('keydown', play);
        };
        document.addEventListener('click',   play);
        document.addEventListener('keydown', play);
    }

    const observer = new MutationObserver(() => {
        if (mainMenu && !mainMenu.classList.contains('hidden')) {
            startScaryFaceFlicker();
            staticNoise.start();
        } else {
            stopScaryFaceFlicker();
            staticNoise.stop();
        }
    });

    if (mainMenu) {
        observer.observe(mainMenu, { attributes: true, attributeFilter: ['class'] });
        if (!mainMenu.classList.contains('hidden')) { startScaryFaceFlicker(); staticNoise.start(); }
    }
});

window.addEventListener('message', e => {
    if (e.data.type === 'USER_CLICKED_PLAY') {
        const menuMusic = document.getElementById('menu-music');
        if (menuMusic) { menuMusic.volume = 0.5; menuMusic.play().catch(() => {}); }
    }
});
