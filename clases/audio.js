const SoundManager = {
    _ctx: null,
    _buffers: {},
    _volumes: {
        // Música
        menuMusic:        0.5,
        matchMusic:       0.5,
        // Eventos del jugador
        playerShot:       0.8,
        playerDash:       0.4,
        playerChannel:    0.3,
        playerHit:        0.1,
        transformation:   0.5,
        // Horda
        buffedZombies:    1.2,
        // Habilidades
        explosion:        0.6,
        venomousPit:      0.2,
        // Enemigos
        policeShot:       0.05,
        swatShot:         0.05,
        brawlerStrike:    0.05,
        // Victoria/derrota
        victory:          0.6,
        defeat:           0.6,
    },

    _music: null,           // nodo de música actual (loop)
    _hordeSource: null,     // sonido de horda en loop

    async init() {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Los navegadores suspenden el AudioContext hasta interacción del usuario
        const reanudar = () => {
            if (this._ctx.state === 'suspended') {
                this._ctx.resume().then(() => {
                    // Una vez reanudado, arrancamos la música del menú
                    this.playMusic('menuMusic', 0);
                });
            }
            document.removeEventListener('click',   reanudar);
            document.removeEventListener('keydown', reanudar);
        };
        document.addEventListener('click',   reanudar);
        document.addEventListener('keydown', reanudar);
    },

    async load(alias, src) {
        try {
            const res    = await fetch(src);
            const arr    = await res.arrayBuffer();
            const buffer = await this._ctx.decodeAudioData(arr);
            this._buffers[alias] = buffer;
        } catch (e) {
            console.warn(`Audio: no se pudo cargar "${alias}" desde "${src}"`);
        }
    },

    async loadAll(manifest) {
        // manifest = { alias: 'ruta', ... }
        await Promise.all(
            Object.entries(manifest).map(([alias, src]) => this.load(alias, src))
        );
    },

    play(alias, { loop = false, volume = null } = {}) {
        const buffer = this._buffers[alias];
        if (!buffer || !this._ctx) return null;
        const gain   = this._ctx.createGain();
        gain.gain.value = volume ?? this._volumes[alias] ?? 0.5;
        gain.connect(this._ctx.destination);
        const source = this._ctx.createBufferSource();
        source.buffer = buffer;
        source.loop   = loop;
        source.connect(gain);
        source.start();
        return { source, gain };
    },

    _musicTimeout: null,

    playMusic(alias, delayMs = 3000) {
        this.stopMusic();
        const node = this.play(alias, { loop: false });
        if (!node) return;
        this._music = node;

        // Cuando termina, esperamos delayMs y volvemos a reproducir
        node.source.onended = () => {
            this._music = null;
            this._musicTimeout = setTimeout(() => {
                this.playMusic(alias, delayMs);
            }, delayMs);
        };
    },

    stopMusic() {
        clearTimeout(this._musicTimeout);
        this._musicTimeout = null;
        if (this._music && this._music.source) {
            this._music.source.onended = null; // <-- This stops it from ghost-looping
            try { this._music.source.stop(); } catch(e) {}
        }
        this._music = null;
    },

    // Para sonidos que no deben solaparse (ej: horda)
    playLoop(alias, stateKey) {
        if (this[stateKey]) return; // ya está sonando
        const node = this.play(alias, { loop: true });
        this[stateKey] = node;
    },

    stopLoop(stateKey) {
        try { this[stateKey]?.source.stop(); } catch(e) {}
        this[stateKey] = null;
    },

    // Cooldown para evitar spam de sonidos (ej: disparos de policía)
    _cooldowns: {},
    playCooled(alias, cooldownMs = 80) {
        const now  = Date.now();
        const last = this._cooldowns[alias] || 0;
        if (now - last < cooldownMs) return;
        this._cooldowns[alias] = now;
        this.play(alias);
    },
    
    playIfOnScreen(alias, entity, options = {}) {
        if (!Game.instance?._isOnScreen(entity)) return;
        this.play(alias, options);
    },

    playCooledIfOnScreen(alias, entity, cooldownMs = 80) {
        if (!Game.instance?._isOnScreen(entity)) return;
        this.playCooled(alias, cooldownMs);
    },
};