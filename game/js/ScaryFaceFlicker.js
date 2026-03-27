// 恐怖脸闪烁效果
const getBasePath = () => {
    const p = window.location.pathname;
    if (p.includes('/game/')) return '/game/';
    return './';
};

const basePath = getBasePath();
const normalBackground  = `${basePath}assets/images/menubackground.png`;
const scaryBackgrounds  = [
    `${basePath}assets/images/scaryhawk.png`,
    `${basePath}assets/images/scaryep.png`,
    `${basePath}assets/images/scarytrump.png`,
];

let scaryFaceInterval = null;
const preloadedImages  = {};

function preloadBackgrounds() {
    const n = new Image(); n.src = normalBackground; preloadedImages['normal'] = n;
    scaryBackgrounds.forEach((bg, i) => {
        const img = new Image(); img.src = bg; preloadedImages[`scary-${i}`] = img;
    });
}

function startScaryFaceFlicker() {
    if (scaryFaceInterval) stopScaryFaceFlicker();
    const mainMenu = document.getElementById('main-menu');
    if (!mainMenu) return;
    scaryFaceInterval = setInterval(() => {
        if (Math.random() < 0.1) {
            const bg = scaryBackgrounds[Math.floor(Math.random() * 3)];
            mainMenu.style.backgroundImage = `url('${bg}')`;
            setTimeout(() => {
                mainMenu.style.backgroundImage = `url('${normalBackground}')`;
            }, 50 + Math.random() * 150);
        }
    }, 100);
}

function stopScaryFaceFlicker() {
    if (scaryFaceInterval) {
        clearInterval(scaryFaceInterval);
        scaryFaceInterval = null;
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) mainMenu.style.backgroundImage = `url('${normalBackground}')`;
    }
}
