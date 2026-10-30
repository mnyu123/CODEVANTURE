import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
interface Props {
  locked: boolean;
  gateOpen: boolean;
  onInteract: (target: 'guide' | 'terminal' | 'exit') => void;
}
export default function World(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  useEffect(() => {
    current.current = props;
  }, [props]);
  useEffect(() => {
    if (!host.current) return;
    class Valley extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private keys!: Record<string, Phaser.Input.Keyboard.Key>;
      private gate!: Phaser.GameObjects.Rectangle;
      private gateCollider!: Phaser.Physics.Arcade.Collider;
      private prompt!: Phaser.GameObjects.Text;
      private gateWasOpen = false;
      private ready = false;
      private inputPaused = false;
      constructor() {
        super('valley');
      }
      create() {
        const width = 2600;
        this.cameras.main.setBounds(0, 0, width, 720);
        this.physics.world.setBounds(0, 0, width, 720);
        this.add.rectangle(0, 0, width, 720, 0x101c30).setOrigin(0);
        const stars = this.add.graphics().setScrollFactor(0.2);
        for (let i = 0; i < 90; i++) {
          stars.fillStyle(0xc9e3ee, 0.2 + (i % 4) * 0.12);
          stars.fillRect(
            (i * 137) % 1800,
            (i * 71) % 370,
            i % 3 === 0 ? 2 : 1,
            2,
          );
        }
        this.add.circle(830, 145, 52, 0xe6e2ca, 0.9).setScrollFactor(0.1);
        this.add.circle(846, 131, 51, 0x101c30).setScrollFactor(0.1);
        const mountains = this.add.graphics().setScrollFactor(0.35);
        for (let i = 0; i < 10; i++) {
          mountains.fillStyle(i % 2 ? 0x1c3444 : 0x182b40);
          mountains.fillTriangle(
            i * 340 - 120,
            585,
            i * 340 + 100,
            240 + (i % 3) * 65,
            i * 340 + 390,
            585,
          );
        }
        const ruins = this.add.graphics().setScrollFactor(0.65);
        for (let i = 0; i < 14; i++) {
          const x = i * 210;
          const h = 80 + (i % 4) * 35;
          ruins.fillStyle(0x253e49);
          ruins.fillRect(x, 590 - h, 45, h);
          ruins.fillRect(x - 8, 583 - h, 61, 12);
          ruins.lineStyle(1, 0x49605d, 0.4);
          ruins.strokeRect(x + 9, 598 - h, 26, h - 8);
        }
        this.add.rectangle(1300, 677, width, 86, 0x0a151e);
        this.add.rectangle(1300, 618, width, 26, 0x355951);
        this.add.rectangle(1300, 633, width, 8, 0x6b8270);
        for (let i = 0; i < 140; i++)
          this.add.rectangle(i * 23, 607, 1, 5 + (i % 7), 0x71907b, 0.6);
        const ground = this.add.rectangle(width / 2, 650, width, 34, 0x263b3b);
        this.physics.add.existing(ground, true);
        const texture = this.add.graphics();
        texture.fillStyle(0x92d4c5);
        texture.fillRect(7, 3, 16, 15);
        texture.fillStyle(0xd6b890);
        texture.fillRect(10, 9, 12, 10);
        texture.fillStyle(0x254f56);
        texture.fillRect(5, 19, 20, 18);
        texture.fillStyle(0xe6c889);
        texture.fillRect(5, 22, 20, 3);
        texture.fillStyle(0x142a35);
        texture.fillRect(7, 37, 7, 7);
        texture.fillRect(19, 37, 7, 7);
        texture.generateTexture('traveler', 32, 46);
        texture.destroy();
        this.player = this.physics.add
          .sprite(180, 575, 'traveler')
          .setScale(1.5)
          .setCollideWorldBounds(true);
        this.player.body!.setSize(22, 42);
        this.physics.add.collider(this.player, ground);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(180, 180);
        this.add.rectangle(475, 582, 29, 54, 0x776b92);
        this.add.circle(475, 548, 12, 0xd1bb98);
        this.add.rectangle(475, 544, 31, 9, 0x504f71);
        this.label(475, 510, '기록의 수호자');
        this.add
          .rectangle(1000, 588, 52, 48, 0x435c61)
          .setStrokeStyle(2, 0x91aaa0);
        const glow = this.add.rectangle(1000, 576, 30, 16, 0x88e1ca);
        this.tweens.add({
          targets: glow,
          alpha: 0.3,
          duration: 1300,
          yoyo: true,
          repeat: -1,
        });
        this.label(1000, 530, '동력 단말기');
        this.add.rectangle(1490, 515, 24, 180, 0x6c776b);
        this.add.rectangle(1650, 515, 24, 180, 0x6c776b);
        this.add.rectangle(1570, 421, 184, 26, 0x9ba08b);
        this.gate = this.add
          .rectangle(1570, 520, 130, 170, 0x50c9b7, 0.65)
          .setStrokeStyle(2, 0xa6efd8);
        const barrier = this.add.rectangle(1570, 520, 130, 170, 0xffffff, 0);
        this.physics.add.existing(barrier, true);
        this.gateCollider = this.physics.add.collider(this.player, barrier);
        for (let i = 0; i < 5; i++)
          this.add.text(1520 + i * 22, 440, '◇', {
            fontSize: '18px',
            color: '#b5e8ce',
          });
        this.add
          .ellipse(2350, 553, 64, 122, 0x80dfca, 0.2)
          .setStrokeStyle(2, 0xa1e4cf);
        this.label(2350, 460, '다음 이야기');
        this.prompt = this.add
          .text(0, 0, '', {
            fontFamily: 'Malgun Gothic, sans-serif',
            fontSize: '15px',
            color: '#152d2e',
            backgroundColor: '#dce8d5',
            padding: { x: 13, y: 8 },
          })
          .setOrigin(0.5)
          .setDepth(10);
        this.keys = this.input.keyboard!.addKeys(
          'LEFT,RIGHT,A,D,SPACE,E',
        ) as Record<string, Phaser.Input.Keyboard.Key>;
        this.input.keyboard!.on('keydown-E', () => {
          if (this.inputPaused) return;
          const target = this.nearby();
          if (target) {
            this.input.keyboard?.resetKeys();
            current.current.onInteract(target);
          }
        });
        this.input.keyboard!.on('keydown-SPACE', () => {
          if (!this.inputPaused && this.player.body!.blocked.down)
            this.player.setVelocityY(-460);
        });
        const reset = () => this.input.keyboard?.resetKeys();
        this.game.events.on('blur', reset);
        this.events.once('shutdown', () => this.game.events.off('blur', reset));
        this.cameras.main.fadeIn(1700, 255, 255, 255);
        this.time.delayedCall(1700, () => {
          this.ready = true;
        });
      }
      label(x: number, y: number, text: string) {
        this.add
          .text(x, y, text, {
            fontFamily: 'Malgun Gothic, sans-serif',
            fontSize: '13px',
            color: '#a4b9af',
          })
          .setOrigin(0.5);
      }
      nearby(): 'guide' | 'terminal' | 'exit' | null {
        const x = this.player.x;
        return Math.abs(x - 475) < 100
          ? 'guide'
          : Math.abs(x - 1000) < 100 && !current.current.gateOpen
            ? 'terminal'
            : x > 2250 && current.current.gateOpen
              ? 'exit'
              : null;
      }
      update() {
        if (!this.player) return;
        const { locked, gateOpen } = current.current;
        const focused = document.activeElement;
        const typing =
          focused instanceof HTMLElement &&
          (['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName) ||
            focused.isContentEditable);
        const paused = locked || typing || !this.ready || !document.hasFocus();
        if (paused !== this.inputPaused && this.input.keyboard) {
          this.inputPaused = paused;
          this.input.keyboard.resetKeys();
          if (paused) this.input.keyboard.clearCaptures();
          else this.input.keyboard.addCapture('LEFT,RIGHT,A,D,SPACE,E');
        }
        if (this.input.keyboard) this.input.keyboard.enabled = !paused;
        if (paused) this.physics.pause();
        else this.physics.resume();
        if (gateOpen && !this.gateWasOpen) {
          this.gateWasOpen = true;
          this.gateCollider.active = false;
          this.tweens.add({
            targets: this.gate,
            alpha: 0,
            y: 400,
            duration: 1000,
          });
        }
        if (paused) {
          this.player.setVelocityX(0);
          this.input.keyboard?.resetKeys();
          this.prompt.setVisible(false);
          return;
        }
        const left = this.keys.LEFT.isDown || this.keys.A.isDown;
        const right = this.keys.RIGHT.isDown || this.keys.D.isDown;
        this.player.setVelocityX(left ? -260 : right ? 260 : 0);
        if (left || right) this.player.setFlipX(left);
        if (
          Phaser.Input.Keyboard.JustDown(this.keys.SPACE) &&
          this.player.body!.blocked.down
        )
          this.player.setVelocityY(-460);
        const x = this.player.x;
        const target =
          Math.abs(x - 475) < 100
            ? 'guide'
            : Math.abs(x - 1000) < 100 && !gateOpen
              ? 'terminal'
              : x > 2250 && gateOpen
                ? 'exit'
                : null;
        this.prompt.setVisible(!!target);
        this.prompt.setPosition(x, this.player.y - 68);
        this.prompt.setText(
          target === 'guide'
            ? 'E · 이야기 듣기'
            : target === 'terminal'
              ? 'E · 단말기 조사'
              : 'E · 다음 이야기',
        );
      }
    }
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: 1280,
      height: 720,
      backgroundColor: '#101c30',
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 1100 }, debug: false },
      },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: Valley,
      audio: { noAudio: true },
    });
    return () => {
      game.destroy(true);
    };
  }, []);
  return (
    <div
      className="world-canvas"
      ref={host}
      aria-label="방향키로 이동하는 잠든 관문 월드"
    />
  );
}
