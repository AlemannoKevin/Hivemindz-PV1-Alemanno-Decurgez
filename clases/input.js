const Input = {

    _held: {},
    _onPress: {},

    init() {
        window.addEventListener('keydown', e => {
            const code = e.code;
            if (!this._held[code]) {
                this._held[code] = true;
                const key = e.key.toLowerCase();
                if (this._held[e.key]) this._onPress[key]();
            }
        });
        window.addEventListener('keyup', e => {
            this._held[e.code] = false;
        });

        window.addEventListener('contextmenu', e => e.preventDefault());

    },

    isHeld(key) { 

        const code = key.startsWith('arrow') 
            ? key.charAt(0).toUpperCase() + key.slice(1) 
            : 'Key' + key.toUpperCase();
            
        return !!this._held[code]; 
    },

    onPress(key, callback) { this._onPress[key] = callback; },
};

const Mouse = {
    screenX: 0,
    screenY: 0,
    rightHeld: false,
    leftHeld: false,

    init() {
        window.addEventListener('mousemove', e => {
            this.screenX = e.clientX;
            this.screenY = e.clientY;
        });
        window.addEventListener('mousedown', e => {
            if (e.button === 2) this.rightHeld = true;
        });
        window.addEventListener('mouseup', e => {
            if (e.button === 2) this.rightHeld = false;
        });
        window.addEventListener('mousedown', e => {
            if (e.button === 2) this.rightHeld = true;
            if (e.button === 0) this.leftHeld  = true;
        });
        window.addEventListener('mouseup', e => {
            if (e.button === 2) this.rightHeld = false;
            if (e.button === 0) this.leftHeld  = false;
        });
    },

    worldX(cameraOffsetX) { return (this.screenX - cameraOffsetX) / Config.zoom; },
    worldY(cameraOffsetY) { return (this.screenY - cameraOffsetY) / Config.zoom; },
};