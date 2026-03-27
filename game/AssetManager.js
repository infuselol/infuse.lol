// 资源管理器
class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.loaded = false;
        this.volumeSettings = this.loadVolumeSettings();
    }

    loadVolumeSettings() {
        const saved = localStorage.getItem('fnae_volume_settings');
        if (saved) return JSON.parse(saved);
        return { master:0.7, gameBg:0.7, menuMusic:0.7, jumpscare:0.7, ventCrawling:0.7 };
    }

    saveVolumeSettings() {
        localStorage.setItem('fnae_volume_settings', JSON.stringify(this.volumeSettings));
    }

    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        this.saveVolumeSettings();
    }

    getVolume(type) { return this.volumeSettings[type] || 0.7; }
    getAllVolumes() { return this.volumeSettings; }

    async loadAssets() {
        const basePath = this.getBasePath();

        const imagePaths = {
            office:           `${basePath}assets/images/original.png`,
            cam1:             `${basePath}assets/images/Cam1.png`,
            cam2:             `${basePath}assets/images/Cam2.png`,
            cam3:             `${basePath}assets/images/Cam3.png`,
            cam4:             `${basePath}assets/images/Cam4.png`,
            cam5:             `${basePath}assets/images/Cam5.png`,
            cam6:             `${basePath}assets/images/Cam6.png`,
            cam7:             `${basePath}assets/images/Cam7.png`,
            cam8:             `${basePath}assets/images/Cam8.png`,
            cam9:             `${basePath}assets/images/Cam9.png`,
            cam10:            `${basePath}assets/images/Cam10.png`,
            cam11:            `${basePath}assets/images/Cam11.png`,
            jumpscare:        `${basePath}assets/images/jump.png`,
            trumpJumpscare:   `${basePath}assets/images/jumptrump.png`,
            hawkingJumpscare: `${basePath}assets/images/scaryhawking.png`,
        };

        const soundPaths = {
            ambient:          `${basePath}assets/sounds/music.ogg`,
            static:           `${basePath}assets/sounds/Static_sound.ogg`,
            staticLoop:       `${basePath}assets/sounds/Static_sound.ogg`,
            vents:            `${basePath}assets/sounds/vents.ogg`,
            ventCrawling:     `${basePath}assets/sounds/vent-crawling.mp3`,
            jumpscare:        `${basePath}assets/sounds/jumpcare.ogg`,
            hawkingJumpscare: `${basePath}assets/sounds/stephenjumpscare.ogg`,
            blip:             `${basePath}assets/sounds/Blip.ogg`,
            win:              `${basePath}assets/sounds/winmusic.ogg`,
            chimes:           `${basePath}assets/sounds/chimes.ogg`,
            crank1:           `${basePath}assets/sounds/Crank1.ogg`,
            crank2:           `${basePath}assets/sounds/Crank2.ogg`,
            ekg:              `${basePath}assets/sounds/ekg.wav`,
            hawking_shock:    `${basePath}assets/sounds/hawking_shock.wav`,
            goldenstephenscare:`${basePath}assets/sounds/goldenstephenscare.ogg`,
        };

        for (const [key, path] of Object.entries(imagePaths)) {
            try { this.images[key] = await this.loadImage(path); }
            catch(e) { console.warn(`Failed to load image: ${path}`); }
        }

        for (const [key, path] of Object.entries(soundPaths)) {
            try { this.sounds[key] = new Audio(path); }
            catch(e) { console.warn(`Failed to load sound: ${path}`); }
        }

        this.loaded = true;
    }

    getBasePath() {
        const p = window.location.pathname;
        if (p.includes('/game/')) return '/game/';
        return './';
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    playSound(key, loop = false, volume = 1.0) {
        if (!this.sounds[key]) return;
        this.sounds[key].loop = loop;
        let cat = this.volumeSettings.master;
        if (key === 'music' || key === 'music3') {
            cat *= this.volumeSettings.menuMusic;
        } else if (['jumpscare','hawkingJumpscare','trumpJumpscare'].includes(key)) {
            cat *= this.volumeSettings.jumpscare;
        } else if (key === 'ventCrawling') {
            cat *= this.volumeSettings.ventCrawling;
        } else if (['vents','ambience','staticLoop','static','blip','Blip'].includes(key)) {
            cat *= this.volumeSettings.gameBg;
        }
        this.sounds[key].volume = Math.min(1, volume * cat);
        this.sounds[key].play();
    }

    stopSound(key) {
        if (!this.sounds[key]) return;
        this.sounds[key].pause();
        this.sounds[key].currentTime = 0;
    }

    setSoundVolume(key, volume) {
        if (this.sounds[key]) this.sounds[key].volume = volume;
    }
}
