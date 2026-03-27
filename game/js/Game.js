// Main game class
class Game {
    constructor() {
        this.state      = new GameState();
        this.assets     = new AssetManager();
        this.ui         = new UIManager(this);
        this.camera     = new CameraSystem(this);
        this.enemyAI    = new EnemyAI(this);
        this.input      = new InputHandler(this);
        this.camera.initEPConfig();

        this.timeInterval  = null;
        this.powerInterval = null;
        this.viewPosition  = 0.25;
        this.isRotatingLeft  = false;
        this.isRotatingRight = false;
        this.rotationSpeed   = 0.015;

        // Resolve asset base path once for use in dynamic image/src references
        this._base = window.location.pathname.includes('/game/') ? '/game/' : './';

        this.initElements();
        this.bindEvents();
    }

    /* ─── helpers ─── */
    _img(rel) { return `${this._base}${rel}`; }

    initElements() {
        this.mainMenu       = document.getElementById('main-menu');
        this.gameScreen     = document.getElementById('game-screen');
        this.gameOverElement= document.getElementById('game-over');
        this.gameOverText   = document.getElementById('game-over-text');
        this.tutorialOverlay= document.getElementById('tutorial-overlay');
        this.tutorialGotItBtn = document.getElementById('tutorial-got-it');

        this.startBtn       = document.getElementById('start-game');
        this.continueBtn    = document.getElementById('continue-game');
        this.specialNightBtn= document.getElementById('special-night-btn');
        this.customNightBtn = document.getElementById('custom-night-btn');
        this.starIcon       = document.getElementById('star-icon');
        this.starIcon2      = document.getElementById('star-icon-2');
        this.starIcon3      = document.getElementById('star-icon-3');
        this.restartBtn     = document.getElementById('restart');
        this.mainMenuBtn    = document.getElementById('main-menu-btn');

        this.volumeBtn            = document.getElementById('volume-btn');
        this.volumePanel          = document.getElementById('volume-panel');
        this.closeVolumePanelBtn  = document.getElementById('close-volume-panel');
        this.gameBgVolumeSlider   = document.getElementById('game-bg-volume');
        this.menuMusicVolumeSlider= document.getElementById('menu-music-volume');
        this.jumpscareVolumeSlider= document.getElementById('jumpscare-volume');
        this.ventCrawlingVolumeSlider = document.getElementById('vent-crawling-volume');
        this.masterVolumeSlider   = document.getElementById('master-volume');

        this.customNightMenu  = document.getElementById('custom-night-menu');
        this.epsteinSlider    = document.getElementById('epstein-slider');
        this.trumpSlider      = document.getElementById('trump-slider');
        this.hawkingSlider    = document.getElementById('hawking-slider');
        this.epsteinValue     = document.getElementById('epstein-value');
        this.trumpValue       = document.getElementById('trump-value');
        this.hawkingValue     = document.getElementById('hawking-value');
        this.startCustomNightBtn = document.getElementById('start-custom-night');
        this.backToMenuBtn    = document.getElementById('back-to-menu');

        this.initVolumeSettings();
    }

    initVolumeSettings() {
        const v = this.assets.getAllVolumes();
        this.gameBgVolumeSlider.value    = Math.round(v.gameBg      * 100);
        this.menuMusicVolumeSlider.value = Math.round(v.menuMusic   * 100);
        this.jumpscareVolumeSlider.value = Math.round(v.jumpscare   * 100);
        this.ventCrawlingVolumeSlider.value = Math.round(v.ventCrawling * 100);
        this.masterVolumeSlider.value    = Math.round(v.master      * 100);
        this.updateVolumePercents();
    }

    updateVolumePercents() {
        [this.gameBgVolumeSlider, this.menuMusicVolumeSlider,
         this.jumpscareVolumeSlider, this.ventCrawlingVolumeSlider,
         this.masterVolumeSlider].forEach(s => {
            const pct = s.parentElement.querySelector('.volume-percent');
            if (pct) pct.textContent = s.value + '%';
        });
    }

    bindEvents() {
        this.startBtn.addEventListener('click',       () => this.startGame());
        this.continueBtn.addEventListener('click',    () => this.continueGame());
        this.specialNightBtn.addEventListener('click',() => this.startSpecialNight());
        this.customNightBtn.addEventListener('click', () => this.showCustomNightMenu());
        this.restartBtn.addEventListener('click',     () => this.restartGame());

        this.volumeBtn.addEventListener('click', () => this.volumePanel.classList.toggle('hidden'));
        this.closeVolumePanelBtn.addEventListener('click', () => this.volumePanel.classList.add('hidden'));

        const upd = () => { this.updateVolumePercents(); };
        this.gameBgVolumeSlider.addEventListener('input', e => {
            this.assets.setVolume('gameBg', e.target.value / 100); upd();
            const v = this.assets.sounds['vents'];
            if (v && !v.paused) v.volume = this.assets.getAllVolumes().gameBg * this.assets.getAllVolumes().master;
        });
        this.menuMusicVolumeSlider.addEventListener('input', e => {
            this.assets.setVolume('menuMusic', e.target.value / 100); upd();
            const m = document.getElementById('menu-music');
            if (m && !m.paused) { const vols = this.assets.getAllVolumes(); m.volume = vols.menuMusic * vols.master; }
        });
        this.jumpscareVolumeSlider.addEventListener('input', e => { this.assets.setVolume('jumpscare', e.target.value / 100); upd(); });
        this.ventCrawlingVolumeSlider.addEventListener('input', e => { this.assets.setVolume('ventCrawling', e.target.value / 100); upd(); });
        this.masterVolumeSlider.addEventListener('input', e => {
            this.assets.setVolume('master', e.target.value / 100); upd();
            const m = document.getElementById('menu-music');
            if (m && !m.paused) { const vols = this.assets.getAllVolumes(); m.volume = vols.menuMusic * vols.master; }
            if (this.state.isGameRunning) {
                const v = this.assets.sounds['vents'];
                if (v && !v.paused) { const vols = this.assets.getAllVolumes(); v.volume = vols.gameBg * vols.master; }
            }
        });

        this.mainMenuBtn.addEventListener('click',    () => this.showMainMenu());
        this.tutorialGotItBtn.addEventListener('click',() => this.closeTutorial());
        this.startCustomNightBtn.addEventListener('click', () => this.startCustomNight());
        this.backToMenuBtn.addEventListener('click',  () => this.hideCustomNightMenu());

        this.epsteinSlider.addEventListener('input', e => this.epsteinValue.textContent = e.target.value);
        this.trumpSlider.addEventListener('input',   e => this.trumpValue.textContent   = e.target.value);
        this.hawkingSlider.addEventListener('input', e => this.hawkingValue.textContent = e.target.value);

        document.querySelectorAll('.ai-btn-minus').forEach(btn => btn.addEventListener('click', () => {
            const s = document.getElementById(`${btn.dataset.ai}-slider`);
            const v = Math.max(0, parseInt(s.value) - 1);
            s.value = v; document.getElementById(`${btn.dataset.ai}-value`).textContent = v;
        }));
        document.querySelectorAll('.ai-btn-plus').forEach(btn => btn.addEventListener('click', () => {
            const s = document.getElementById(`${btn.dataset.ai}-slider`);
            const v = Math.min(20, parseInt(s.value) + 1);
            s.value = v; document.getElementById(`${btn.dataset.ai}-value`).textContent = v;
        }));
    }

    loadProgress() {
        const n = parseInt(localStorage.getItem('fnae_current_night'));
        if (n > 1 && n <= this.state.maxNights) { this.state.currentNight = n; return true; }
        return false;
    }
    saveProgress()  { if (this.state.currentNight > 1) localStorage.setItem('fnae_current_night', this.state.currentNight); }
    clearProgress() { localStorage.removeItem('fnae_current_night'); }

    updateContinueButton() {
        if (this.loadProgress()) {
            this.continueBtn.classList.remove('hidden');
            this.continueBtn.textContent = `CONTINUE (NIGHT ${this.state.currentNight})`;
        } else {
            this.continueBtn.classList.add('hidden');
        }
        if (localStorage.getItem('night6Unlocked') === 'true') {
            this.specialNightBtn.classList.remove('hidden');
            this.starIcon.classList.remove('hidden');
        } else {
            this.specialNightBtn.classList.add('hidden');
            this.starIcon.classList.add('hidden');
        }
        if (localStorage.getItem('night6Completed') === 'true') {
            this.starIcon2.classList.remove('hidden');
            this.customNightBtn.classList.remove('hidden');
        } else {
            this.starIcon2.classList.add('hidden');
            this.customNightBtn.classList.add('hidden');
        }
        if (localStorage.getItem('customNight202020') === 'true') {
            this.starIcon3.classList.remove('hidden');
        } else {
            this.starIcon3.classList.add('hidden');
        }
        this.state.currentNight = 1;
    }

    showCustomNightMenu()  { this.mainMenu.classList.add('hidden'); this.customNightMenu.classList.remove('hidden'); }
    hideCustomNightMenu()  { this.customNightMenu.classList.add('hidden'); this.mainMenu.classList.remove('hidden'); }

    async startCustomNight() {
        this.state.customNight    = true;
        this.state.currentNight   = 7;
        this.state.customAILevels = {
            epstein: parseInt(this.epsteinSlider.value),
            trump:   parseInt(this.trumpSlider.value),
            hawking: parseInt(this.hawkingSlider.value),
        };
        this.customNightMenu.classList.add('hidden');
        this.volumeBtn?.classList.add('hidden');
        this.volumePanel?.classList.add('hidden');
        const mm = document.getElementById('menu-music');
        if (mm) { mm.pause(); mm.currentTime = 0; mm.loop = false; }
        this.enemyAI.reset();
        await this.initGame();
    }

    async continueGame() {
        if (!this.loadProgress()) return;
        this.mainMenu.classList.add('hidden');
        this.volumeBtn?.classList.add('hidden');
        this.volumePanel?.classList.add('hidden');
        const mm = document.getElementById('menu-music');
        if (mm) { mm.pause(); mm.currentTime = 0; mm.loop = false; }
        this.enemyAI.reset();
        await this.initGame();
    }

    async startSpecialNight() {
        this.state.currentNight = 6;
        this.clearProgress();
        this.mainMenu.classList.add('hidden');
        this.volumeBtn?.classList.add('hidden');
        this.volumePanel?.classList.add('hidden');
        const mm = document.getElementById('menu-music');
        if (mm) { mm.pause(); mm.currentTime = 0; mm.loop = false; }
        this.enemyAI.reset();
        await this.initGame();
    }

    async startGame() {
        this.state.currentNight = 1;
        this.clearProgress();
        this.mainMenu.classList.add('hidden');
        this.volumeBtn?.classList.add('hidden');
        this.volumePanel?.classList.add('hidden');
        const mm = document.getElementById('menu-music');
        if (mm) { mm.pause(); mm.currentTime = 0; mm.loop = false; }
        this.enemyAI.reset();

        const cutscene = document.getElementById('cutscene');
        cutscene.classList.remove('hidden');
        setTimeout(() => cutscene.classList.add('fade-in'), 50);

        let done = false;
        const end = () => {
            if (done) return; done = true;
            cutscene.classList.remove('fade-in');
            cutscene.classList.add('fade-out');
            setTimeout(() => { cutscene.classList.add('hidden'); cutscene.classList.remove('fade-out'); this.initGame(); }, 3000);
            cutscene.removeEventListener('click', end);
            if (autoEnd) clearTimeout(autoEnd);
        };
        cutscene.addEventListener('click', end);
        const autoEnd = setTimeout(end, 3000);
    }

    async initGame() {
        if (!this.assets.loaded) await this.assets.loadAssets();
        this.state.reset();
        this.camera.resetSoundButtonCount();
        const cp = document.getElementById('camera-panel');
        if (cp) cp.style.display = '';
        await this.showNightIntro();
        this.gameScreen.classList.add('active');
        this.ui.currentSceneImg.src = this.assets.images.office.src;
        this.ui.currentSceneImg.style.display = 'block';
        this.viewPosition = 0.25;
        this.ui.updateViewPosition(this.viewPosition);
        this.ui.update();
        this.ui.createHotspots();
        this.initVentFanAnimation();
        this.startGameLoop();
        this.startViewRotation();
        this.enemyAI.start();
        this.assets.playSound('vents', true);
        if (this.state.currentNight === 1) this.showTutorial('night1');
        else if (this.state.currentNight === 2) this.showTutorial('night2');
        else if (this.state.currentNight === 3) this.showTutorial('night3');
        if (this.state.currentNight === 5) setTimeout(() => this.showGoldenStephen(), 1000);
    }

    initVentFanAnimation() {
        const v = document.querySelector('.vent-icon');
        if (!v) return;
        if (this.state.ventsClosed) { v.classList.add('stopped'); v.style.animation = 'none'; }
        else { v.classList.remove('stopped','slowing','speeding-up'); v.style.animation = 'spin-fast 0.333s linear infinite'; }
    }

    showTutorial(type = 'night1') {
        const tc = document.getElementById('tutorial-content');
        if (!tc) return;
        const texts = {
            night1: `<h2>DEFEND YOURSELF AGAINST EPSTEIN</h2><p>EPSTEIN ALWAYS STARTS AT CAM 11. USE THE CAMERA'S AUDIO LURE TO KEEP EPSTEIN FAR AWAY FROM YOU. MAKE SURE THE CAMERA YOU'RE PLAYING THE SOUND IN IS NEXT TO THE CAMERA WHERE EPSTEIN IS. PLAYING SOUND IN ONLY ONE SPOT WILL NOT WORK IF YOU DO IT TWICE OR MORE IN A ROW. USING THE AUDIO LURE TOO MUCH WILL LEAD TO THE CAMERAS BREAKING. TO FIX THEM HEAD TO THE CONTROL PANEL AND RESTART THE CAMERAS LIKE YOU JUST DID. EPSTEIN DOES NOT ATTACK THROUGH THE VENTS SO DON'T BOTHER CLOSING THEM FOR THIS NIGHT.</p>`,
            night2: `<h2>DEFEND YOURSELF AGAINST TRUMP</h2><p>TRUMP WILL TRY TO ATTACK YOU THROUGH THE VENTS IN CAM 1 AND CAM 2, SO IF YOU HEAR BANGING IN THE VENTS HEAD OVER TO THE CONTROL PANEL AND CLOSE THEM. AFTER CLOSING THEM YOU WILL HEAR BANGING AGAIN AFTER A FEW SECONDS WHICH MEANS HE LEFT THE VENTS. YOU MUST OPEN THE VENTS OTHERWISE YOU WILL DIE FROM LACK OF OXYGEN. TRUMP CAN BE LURED WITH THE AUDIOS BUT YOUR MAIN PRIORITY WITH THE AUDIO LURES SHOULD BE EPSTEIN.</p>`,
            night3: `<h2>DEFEND YOURSELF AGAINST STEPHEN HAWKING</h2><p>STEPHEN HAWKING ALWAYS STAYS AT CAM 6 AND HE IS NOT AFFECTED BY THE AUDIO LURES. ELECTROCUTE STEPHEN HAWKING EVERY ONCE IN A WHILE TO PREVENT HIM FROM LEAVING CAM 6.</p>`,
        };
        tc.innerHTML = (texts[type] || texts.night1) + `<button id="tutorial-got-it">GOT IT</button>`;
        document.getElementById('tutorial-got-it').addEventListener('click', () => this.closeTutorial());
        this.tutorialOverlay.classList.remove('hidden');
        this.state.tutorialActive = true;
    }

    closeTutorial() {
        this.tutorialOverlay.classList.add('hidden');
        this.state.tutorialActive = false;
    }

    showGoldenStephen() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, { position:'fixed', top:'0', left:'0', width:'100%', height:'100%', zIndex:'9999', pointerEvents:'none', background:'rgba(0,0,0,0.3)' });
        const img = document.createElement('img');
        img.src = this._img('assets/images/goldenstephen.png');
        Object.assign(img.style, { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'80%', height:'80%', objectFit:'contain', opacity:'0', animation:'golden-flicker 2s ease-in-out' });
        overlay.appendChild(img);
        document.body.appendChild(overlay);
        this.assets.playSound('goldenstephenscare', false, 1.0);
        setTimeout(() => overlay.remove(), 2000);
    }

    showNightIntro() {
        return new Promise(resolve => {
            const ni   = document.getElementById('night-intro');
            const text = document.getElementById('night-intro-text');
            text.textContent = (this.state.customNight && this.state.currentNight === 7) ? 'CUSTOM NIGHT' : `NIGHT ${this.state.currentNight}`;
            ni.classList.remove('hidden');
            setTimeout(() => ni.classList.add('fade-in'), 50);
            setTimeout(() => {
                ni.classList.remove('fade-in'); ni.classList.add('fade-out');
                setTimeout(() => { ni.classList.add('hidden'); ni.classList.remove('fade-out'); resolve(); }, 1500);
            }, 3500);
        });
    }

    startViewRotation() {
        const loop = () => {
            if (!this.state.isGameRunning) return;
            if (!this.state.controlPanelOpen && !this.state.cameraOpen) {
                if (this.isRotatingLeft  && this.viewPosition > 0) { this.viewPosition = Math.max(0, this.viewPosition - this.rotationSpeed); this.ui.updateViewPosition(this.viewPosition); }
                if (this.isRotatingRight && this.viewPosition < 1) { this.viewPosition = Math.min(1, this.viewPosition + this.rotationSpeed); this.ui.updateViewPosition(this.viewPosition); }
            }
            requestAnimationFrame(loop);
        };
        loop();
    }

    startGameLoop() {
        this.timeInterval  = setInterval(() => { this.state.currentTime++; this.ui.update(); if (this.state.currentTime >= 6) this.winNight(); }, 60000);
        this.powerInterval = setInterval(() => this.updatePower(), 1000);
    }

    updatePower() {
        this.state.oxygen = Math.max(0, Math.min(100, this.state.oxygen + (this.state.ventsClosed ? -1.5 : (this.state.oxygen < 100 ? 2 : 0))));
        if (this.state.oxygen <= 0) this.oxygenOut();
        this.ui.update();
    }

    toggleVents() {
        if (this.state.controlPanelBusy) return;
        this.state.controlPanelBusy = true;
        this.state.ventsToggling    = true;
        this.assets.playSound('ekg', false, 0.8);
        const v = document.querySelector('.vent-icon');
        if (v) {
            if (this.state.ventsClosed) {
                v.classList.remove('stopped','slowing'); v.classList.add('speeding-up');
                setTimeout(() => v.style.animation = 'spin-slow 2s linear infinite', 0);
                setTimeout(() => v.style.animation = 'spin-slow 1.5s linear infinite', 1000);
                setTimeout(() => { v.style.animation = 'spin-fast 0.333s linear infinite'; v.classList.remove('speeding-up'); }, 2000);
            } else {
                v.classList.remove('speeding-up'); v.classList.add('slowing');
                setTimeout(() => v.style.animation = 'spin-slow 1.5s linear infinite', 0);
                setTimeout(() => v.style.animation = 'spin-slow 2s linear infinite', 1000);
                setTimeout(() => v.style.animation = 'spin-slow 3s linear infinite', 2000);
                setTimeout(() => { v.style.animation = 'none'; v.classList.remove('slowing'); v.classList.add('stopped'); }, 3000);
            }
        }
        this.ui.updateVentsStatus();
        const iv = setInterval(() => { this.ui.updateVentsStatus(); if (!this.state.ventsToggling) clearInterval(iv); }, 100);
        setTimeout(() => {
            this.state.ventsClosed = !this.state.ventsClosed;
            this.enemyAI.onVentsChanged(this.state.ventsClosed);
            this.state.ventsToggling    = false;
            this.state.controlPanelBusy = false;
            this.ui.update(); this.ui.updateVentsStatus(); this.ui.updateControlPanelOptions();
        }, 4000);
    }

    toggleCamera() { this.camera.toggle(); }

    oxygenOut()   { this.stopGame(); this.assets.stopSound('ambient'); this.enemyAI.triggerJumpscare(); }

    gameOver(message) {
        this.stopGame(); this.assets.stopSound('ambient');
        this.gameScreen.classList.remove('active');
        if (this.state.cameraOpen) this.camera.close();
        const cp = document.getElementById('camera-panel');
        if (cp) { cp.classList.add('hidden'); cp.classList.remove('show'); }
        const co = document.getElementById('character-overlay');
        if (co) co.innerHTML = '';
        const ctrl = document.getElementById('control-panel');
        if (ctrl) ctrl.classList.add('hidden');
        this.gameOverScreen(message);
    }

    winNight() {
        this.stopGame(); this.assets.stopSound('ambient');
        if (this.state.cameraOpen) this.camera.close();
        const cp = document.getElementById('camera-panel');
        if (cp) { cp.classList.add('hidden'); cp.classList.remove('show','closing'); cp.style.display = 'none'; }
        this.gameScreen.classList.remove('active');
        if (this.state.customNight && this.state.currentNight === 7) {
            const l = this.state.customAILevels;
            if (l.epstein === 20 && l.trump === 20 && l.hawking === 20) localStorage.setItem('customNight202020','true');
        }
        if (this.state.currentNight === 6) { localStorage.setItem('night6Completed','true'); this.playNight6VictoryAnimation(); }
        else if (this.state.currentNight === 5) this.playNight5VictoryAnimation();
        else this.playNightEndAnimation();
    }

    _makeAnimContainer() {
        const d = document.createElement('div');
        Object.assign(d.style, { position:'fixed', top:'0', left:'0', width:'100%', height:'100%', backgroundColor:'#000', display:'flex', alignItems:'center', justifyContent:'center', zIndex:'10000', opacity:'0', transition:'opacity 0.5s' });
        document.body.appendChild(d);
        setTimeout(() => d.style.opacity = '1', 50);
        return d;
    }

    playNight5VictoryAnimation() {
        const c = this._makeAnimContainer();
        const t = document.createElement('div');
        Object.assign(t.style, { fontSize:'10vw', fontWeight:'bold', color:'#fff', fontFamily:'Arial,sans-serif' });
        t.textContent = '5:59 AM'; c.appendChild(t);
        setTimeout(() => { t.textContent = '6:00 AM'; this.assets.playSound('chimes', false, 1.0); }, 1000);
        setTimeout(() => {
            t.style.transition = 'opacity 0.5s'; t.style.opacity = '0';
            setTimeout(() => {
                c.removeChild(t);
                const r = document.createElement('div');
                Object.assign(r.style, { fontSize:'8vw', fontWeight:'bold', color:'#0f0', fontFamily:'Arial,sans-serif', textAlign:'center', opacity:'0', transition:'opacity 1s' });
                r.textContent = 'RESCUE ARRIVE'; c.appendChild(r);
                setTimeout(() => r.style.opacity = '1', 50);
                setTimeout(() => {
                    r.style.opacity = '0';
                    setTimeout(() => {
                        c.removeChild(r);
                        const ws = document.createElement('img');
                        ws.src = this._img('assets/images/winscreen.png');
                        Object.assign(ws.style, { width:'100%', height:'100%', objectFit:'contain', opacity:'0', transition:'opacity 1s' });
                        c.appendChild(ws); this.assets.playSound('win', false, 1.0);
                        setTimeout(() => ws.style.opacity = '1', 50);
                        setTimeout(() => {
                            c.style.opacity = '0';
                            setTimeout(() => { document.body.removeChild(c); localStorage.setItem('night6Unlocked','true'); this.clearProgress(); this.showMainMenu(); }, 500);
                        }, 5000);
                    }, 1000);
                }, 2000);
            }, 500);
        }, 3000);
    }

    playNight6VictoryAnimation() {
        const c = this._makeAnimContainer();
        const t = document.createElement('div');
        Object.assign(t.style, { fontSize:'10vw', fontWeight:'bold', color:'#fff', fontFamily:'Arial,sans-serif' });
        t.textContent = '5:59 AM'; c.appendChild(t);
        setTimeout(() => { t.textContent = '6:00 AM'; this.assets.playSound('chimes', false, 1.0); }, 1000);
        setTimeout(() => {
            t.style.transition = 'opacity 0.5s'; t.style.opacity = '0';
            setTimeout(() => {
                c.removeChild(t);
                const img = document.createElement('img');
                img.src = this._img('assets/images/night6.png');
                Object.assign(img.style, { width:'100%', height:'100%', objectFit:'contain', opacity:'0', transition:'opacity 1s' });
                c.appendChild(img); this.assets.playSound('goldenstephenscare', false, 1.0);
                setTimeout(() => img.style.opacity = '1', 50);
                setTimeout(() => {
                    c.style.opacity = '0';
                    setTimeout(() => { document.body.removeChild(c); this.showMainMenu(); }, 500);
                }, 5000);
            }, 500);
        }, 3000);
    }

    playNightEndAnimation() {
        const c = this._makeAnimContainer();
        const t = document.createElement('div');
        Object.assign(t.style, { fontSize:'10vw', fontWeight:'bold', color:'#fff', fontFamily:'Arial,sans-serif' });
        t.textContent = '5:59 AM'; c.appendChild(t);
        setTimeout(() => { t.textContent = '6:00 AM'; this.assets.playSound('chimes', false, 1.0); }, 1000);
        setTimeout(() => {
            t.style.transition = 'opacity 0.5s'; t.style.opacity = '0';
            setTimeout(() => {
                if (this.state.customNight && this.state.currentNight === 7) {
                    t.textContent = 'CUSTOM NIGHT COMPLETE'; t.style.fontSize = '5vw'; t.style.color = '#0f0';
                } else if (this.state.currentNight < this.state.maxNights) {
                    const days = 5 - this.state.currentNight;
                    t.textContent = `${days} ${days === 1 ? 'day' : 'days'} until rescue`; t.style.fontSize = '5vw';
                } else {
                    t.innerHTML = 'TO BE CONTINUED...<br><span style="font-size:3vw;color:#f00;">Web version port in progress</span>'; t.style.fontSize = '5vw';
                }
                t.style.opacity = '1';
            }, 500);
            setTimeout(() => {
                c.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(c);
                    if (this.state.customNight && this.state.currentNight === 7) { this.showMainMenu(); }
                    else if (this.state.currentNight < this.state.maxNights) { this.state.currentNight++; this.continueToNextNight(); }
                    else { this.clearProgress(); this.showMainMenu(); }
                }, 500);
            }, 3000);
        }, 3000);
    }

    gameOverScreen(message) {
        this.gameOverText.textContent = message;
        const sub     = document.getElementById('game-over-subtitle');
        const stat    = document.getElementById('game-over-static');
        const restart = document.getElementById('restart');
        const menu    = document.getElementById('main-menu-btn');
        if (restart) restart.style.display = 'none';
        if (menu)    menu.style.display    = 'none';
        if (stat) { stat.currentTime = 0; stat.play().catch(() => {}); }
        sub.classList.add('hidden');
        this.gameOverElement.classList.remove('hidden');
        this.saveProgress();
        setTimeout(() => { this.gameOverElement.classList.add('hidden'); this.showMainMenu(); }, 3000);
    }

    async continueToNextNight() {
        if (!this.assets.loaded) await this.assets.loadAssets();
        this.state.reset(); this.enemyAI.reset();
        this.camera.resetSoundButtonCount();
        const cp = document.getElementById('camera-panel');
        if (cp) cp.style.display = '';
        await this.showNightIntro();
        this.gameScreen.classList.add('active');
        this.ui.currentSceneImg.src = this.assets.images.office.src;
        this.ui.currentSceneImg.style.display = 'block';
        this.viewPosition = 0.25; this.ui.updateViewPosition(this.viewPosition);
        this.ui.update(); this.ui.createHotspots();
        this.initVentFanAnimation();
        this.startGameLoop(); this.startViewRotation();
        this.enemyAI.start();
        this.assets.playSound('vents', true);
        if (this.state.currentNight === 2) this.showTutorial('night2');
        else if (this.state.currentNight === 3) this.showTutorial('night3');
        if (this.state.currentNight === 5) setTimeout(() => this.showGoldenStephen(), 1000);
    }

    stopGame() {
        this.state.isGameRunning = false;
        clearInterval(this.timeInterval);
        clearInterval(this.powerInterval);
        this.enemyAI.stop();
    }

    restartGame() {
        this.gameOverElement.classList.add('hidden');
        this.gameScreen.classList.remove('active');
        if (this.state.customNight && this.state.currentNight === 7) this.startCustomNight();
        else this.startGame();
    }

    showMainMenu() {
        this.gameOverElement.classList.add('hidden');
        this.gameScreen.classList.remove('active');
        this.volumeBtn?.classList.remove('hidden');
        if (this.state.cameraOpen) this.camera.close();
        const cp = document.getElementById('camera-panel');
        if (cp) { cp.classList.add('hidden'); cp.classList.remove('show'); }
        const co = document.getElementById('character-overlay');
        if (co) co.innerHTML = '';
        const ctrl = document.getElementById('control-panel');
        if (ctrl) ctrl.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        this.stopGame();
        this.updateContinueButton();
        this.assets.stopSound('vents'); this.assets.stopSound('static');
        this.assets.stopSound('staticLoop'); this.assets.stopSound('ventCrawling');
        const mm = document.getElementById('menu-music');
        if (mm) { mm.loop = true; mm.currentTime = 0; mm.play().catch(() => {}); }
    }
}
