class Humano extends GameObject {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this.x = startX;
        this.y = startY;

        this.headingX = 0;
        this.headingY = 0;

        this._wanderTimer = Utils.randomBetween(60, 140);
        this._wanderDirX  = Math.cos(Utils.randomAngle());
        this._wanderDirY  = Math.sin(Utils.randomAngle());
        this._fleeTimer   = 0;

        this._buildVisual();
        this._buildExclamation();

        this.currentState = null;
        this.setState(new HumanoWanderState());
    }

    setState(newState) {
        if (this.currentState) this.currentState.exit(this);
        this.currentState = newState;
        this.currentState.enter(this);
    }

    _buildVisual() {
        this.sprite = new PIXI.AnimatedSprite(humanAnimations.move);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
    }

    _buildExclamation() {
        this.exclamation = new PIXI.Text('!', {
            fontFamily: 'monospace',
            fontSize:   16,
            fontWeight: 'bold',
            fill:       0xff3333,
            dropShadow: true,
            dropShadowColor:    0x000000,
            dropShadowDistance: 2,
        });
        this.exclamation.anchor.set(0.5, 1);
        this.exclamation.position.set(0, -38);
        this.exclamation.visible = false;
        this.container.addChild(this.exclamation);
    }

    flipSprite() {
        if (!this.sprite) return;
        const speed = Math.hypot(this.headingX, this.headingY);
        if (speed < 0.1) return;  
        if (this.headingX > 0.1)       this.sprite.scale.x =  1;
        else if (this.headingX < -0.1) this.sprite.scale.x = -1;
    }

    startInfection(worldContainer, zombies) {
        if (this._infected) return;
        this._infected = true;

        this.update = () => {
            this.container.x = this.x;
            this.container.y = this.y;
        };

        let blinks = 0;
        const blinkInterval = setInterval(() => {
            if (this.sprite) {
                this.sprite.tint = blinks % 2 === 0 ? 0x69f0ae : 0xe0c97f;
            }
            blinks++;
            if (blinks >= 8) {
                clearInterval(blinkInterval);
                this.container.visible = false;
                zombies.push(new Zombie(this.x, this.y, worldContainer));
            }
        }, 200);
    }

    update(allHumans, player, allZombies, deltaTime) {

        // Reseteamos flags del charco cada frame (CharcoPit los vuelve a poner si aplica)
        this._pitSlowed  = false;
        this._pitNoAtack = false;

        for (const other of allHumans) {
            if (other === this) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.boidsSepRadius) {
                const push = (Config.boidsSepRadius - dist) / Config.boidsSepRadius * 1.8;
                this.x += (dx / dist) * push;
                this.y += (dy / dist) * push;
            }
        }

        // Pasamos el slowFactor al estado para que lo use al mover
        const pitMult = this._pitSlowed ? Config.pitSlowFactor : 1;
        this.currentState.update(this, { allHumans, player, allZombies, deltaTime, pitMult });

        this.flipSprite();
        World.clampToBounds(this);
        this.container.x = this.x;
        this.container.y = this.y;

        // Barra de infección (solo si tiene algo acumulado)
        this._actualizarBarraInfeccion();
    }

    _actualizarBarraInfeccion() {
        if (!this._infeccionAcum || this._infeccionAcum <= 0) {
            if (this._barraInfeccion) this._barraInfeccion.visible = false;
            return;
        }
        if (!this._barraInfeccion) this._crearBarraInfeccion();
        this._barraInfeccion.visible = true;
        const pct = Math.min(1, this._infeccionAcum / Config.daggerHitsToInfect);
        this._barraFill.width = 28 * pct;
    }

    _crearBarraInfeccion() {
        const contenedor = new PIXI.Container();
        contenedor.position.set(-14, -42);

        const fondo = new PIXI.Graphics();
        fondo.beginFill(0x222222, 0.7);
        fondo.drawRect(0, 0, 28, 4);
        fondo.endFill();

        this._barraFill = new PIXI.Graphics();
        this._barraFill.beginFill(0x69f0ae);
        this._barraFill.drawRect(0, 0, 28, 4);
        this._barraFill.endFill();

        contenedor.addChild(fondo);
        contenedor.addChild(this._barraFill);
        this._barraInfeccion = contenedor;
        this.container.addChild(contenedor);
    }
}

class Peleador extends Humano {
    constructor(startX, startY, worldContainer) {
        super(startX, startY, worldContainer);
        this._worldContainer = worldContainer;

        this.setState(new PeleadorWanderState());

    }

    setState(newState) {
        if (newState instanceof HumanoFleeState) return;
        super.setState(newState);
    }

    _buildVisual() {
       
        this.sprite = new PIXI.AnimatedSprite(brawlerAnimations.move);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.15;
        this.sprite.play();
        this.container.addChild(this.sprite);
    }

    update(allHumans, player, allZombies, deltaTime) {
    
        for (const other of allHumans) {
            if (other === this) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < Config.boidsSepRadius) {
                const push = (Config.boidsSepRadius - dist) / Config.boidsSepRadius * 1.8;
                this.x += (dx / dist) * push;
                this.y += (dy / dist) * push;
            }
        }

        if (!(this.currentState instanceof PeleadorAttackState)) {
            for (const zombie of allZombies) {
                const d = Utils.distance(this.x, this.y, zombie.x, zombie.y);
                if (d < Config.brawlerBatRange) {
                    this.setState(new PeleadorAttackState());
                    break;
                }
            }
        }

        this.currentState.update(this, { allHumans, player, allZombies, deltaTime });

        this.flipSprite();
        World.clampToBounds(this);
        this.container.x = this.x;
        this.container.y = this.y;
    }
}