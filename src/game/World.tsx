import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import Phaser from 'phaser';
import { stages } from '../content/chapter';
import type { StageId } from '../content/chapter';
import type { TouchInput } from '../features/TouchControls';
import { createTraveler } from './traveler';
const guideX = 475;
const terminalX = 1000;
const exitX = 2350;
const obstacleX = 1570;
const ravineStart = 1240;
const ravineEnd = 1740;

interface Props {
  stageId: StageId;
  locked: boolean;
  obstacleCleared: boolean;
  touch: RefObject<TouchInput>;
  codeLines: readonly string[] | null;
  onResolved: () => void;
  onInteract: (target: 'guide' | 'terminal' | 'exit') => void;
}
export default function World({ stageId, ...props }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  useEffect(() => {
    current.current = props;
  }, [props]);
  useEffect(() => {
    if (!host.current) return;
    const stage = stages[stageId];
    const ravine = stage.obstacle === 'bridge';
    const [sky, stone, light] = stage.palette;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const portrait = window.matchMedia(
      '(max-width: 700px) and (orientation: portrait)',
    );
    class Adventure extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private keys!: Record<string, Phaser.Input.Keyboard.Key>;
      private restoreObstacle!: (ready: () => void, instant: boolean) => void;
      private prompt!: Phaser.GameObjects.Text;
      private resolutionStarted = false;
      private ready = false;
      private inputPaused = true;
      private jumpRequested = false;
      private interactionRequested = false;
      constructor() {
        super(stageId);
      }
      create() {
        const width = 2600;
        this.cameras.main.setBounds(0, 0, width, 720);
        this.physics.world.setBounds(0, 0, width, ravine ? 810 : 720);
        this.add.rectangle(0, 0, width, 720, sky).setOrigin(0);
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
        this.add
          .circle(830, 145, 52, stageId === 'valley' ? 0xe6e2ca : light, 0.9)
          .setScrollFactor(0.1);
        if (!ravine) this.add.circle(846, 131, 51, sky).setScrollFactor(0.1);
        const mountains = this.add.graphics().setScrollFactor(0.35);
        for (let i = 0; i < 10; i++) {
          mountains.fillStyle(stone, i % 2 ? 0.53 : 0.33);
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
          ruins.fillStyle(stone, 0.65);
          ruins.fillRect(x, 590 - h, 45, h);
          ruins.fillRect(x - 8, 583 - h, 61, 12);
          ruins.lineStyle(1, 0x49605d, 0.4);
          ruins.strokeRect(x + 9, 598 - h, 26, h - 8);
        }
        if (ravine) {
          const center = (ravineStart + ravineEnd) / 2;
          this.add.rectangle(
            center,
            693,
            ravineEnd - ravineStart,
            54,
            0x1b2a45,
          );
          for (let i = 0; i < 10; i++) {
            this.add.ellipse(
              ravineStart + 24 + i * 52,
              674 + (i % 3) * 13,
              120,
              13,
              0x547d9b,
              0.17,
            );
          }
        }
        const islands = ravine
          ? [
              [0, ravineStart],
              [ravineEnd, width],
            ]
          : [[0, width]];
        const ground = islands.map(([start, end]) => {
          const center = (start + end) / 2;
          const span = end - start;
          this.add.rectangle(
            center,
            677,
            span,
            86,
            ravine ? 0x231d30 : 0x0a151e,
          );
          this.add.rectangle(center, 618, span, 26, stone);
          this.add.rectangle(center, 633, span, 8, light, 0.48);
          for (let x = start + 12; x < end; x += 23)
            this.add.rectangle(x, 607, 1, 5 + (x % 7), light, 0.32);
          const surface = this.add.rectangle(center, 650, span, 34, stone);
          this.physics.add.existing(surface, true);
          return surface;
        });
        createTraveler(this);
        this.player = this.physics.add
          .sprite(180, 575, 'traveler-0')
          .setScale(1.5)
          .setCollideWorldBounds(true);
        this.player.setSize(20, 48).setOffset(10, 6);
        this.physics.add.collider(this.player, ground);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(180, 180);
        this.add.rectangle(guideX, 582, 29, 54, ravine ? 0x996151 : 0x776b92);
        this.add.circle(guideX, 548, 12, 0xd1bb98);
        this.add.rectangle(guideX, 544, 31, 9, ravine ? 0x78453e : 0x504f71);
        this.label(guideX, 510, stage.guide);
        this.add
          .rectangle(terminalX, 588, 52, 48, ravine ? 0x75524d : 0x435c61)
          .setStrokeStyle(2, 0x91aaa0);
        const glow = this.add.rectangle(terminalX, 576, 30, 16, light);
        this.tweens.add({
          targets: glow,
          alpha: 0.3,
          duration: 1300,
          yoyo: true,
          repeat: -1,
        });
        this.label(terminalX, 530, stage.terminal);
        if (ravine) this.prepareBridge();
        else this.prepareGate(stage.obstacle);
        this.add
          .ellipse(exitX, 553, 64, 122, light, 0.2)
          .setStrokeStyle(2, light);
        if (ravine) {
          this.add.rectangle(exitX, 610, 38, 38, 0x856256);
          this.add.rectangle(exitX, 590, 58, 14, 0xf6bf69);
        }
        this.label(exitX, 460, stage.exit);
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
        this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => {
          if (!event.repeat && !this.inputPaused) this.jumpRequested = true;
        });
        this.input.keyboard!.on('keydown-E', (event: KeyboardEvent) => {
          if (!event.repeat && !this.inputPaused)
            this.interactionRequested = true;
        });
        const reset = () => this.input.keyboard?.resetKeys();
        this.game.events.on('blur', reset);
        this.events.once('shutdown', () => this.game.events.off('blur', reset));
        if (reducedMotion) {
          this.ready = true;
        } else {
          this.cameras.main.fadeIn(1250, 255, 255, 255);
          this.time.delayedCall(1250, () => {
            this.ready = true;
          });
        }
      }
      prepareGate(kind: typeof stage.obstacle) {
        const mirror = kind === 'mirror';
        const sluice = kind === 'sluice';
        this.add.rectangle(obstacleX - 80, 515, 24, 180, stone);
        this.add.rectangle(obstacleX + 80, 515, 24, 180, stone);
        this.add
          .rectangle(obstacleX, 421, 184, 26, stone)
          .setStrokeStyle(2, light, 0.6);
        const left = this.add
          .rectangle(obstacleX - 32.5, 520, 65, 170, light, 0.52)
          .setStrokeStyle(2, light);
        const right = this.add
          .rectangle(obstacleX + 32.5, 520, 65, 170, light, 0.52)
          .setStrokeStyle(2, light);
        const mechanism = this.add
          .circle(obstacleX, 443, sluice ? 29 : 16, sky)
          .setStrokeStyle(sluice ? 5 : 2, light);
        const needle = this.add.rectangle(
          obstacleX,
          443,
          sluice ? 40 : 21,
          3,
          light,
        );
        const barrier = this.add.rectangle(
          obstacleX,
          520,
          130,
          170,
          0xffffff,
          0,
        );
        this.physics.add.existing(barrier, true);
        const collider = this.physics.add.collider(this.player, barrier);
        const beam = this.add.rectangle(
          obstacleX,
          594,
          mirror ? 218 : 130,
          4,
          light,
          0,
        );
        this.restoreObstacle = (ready, instant) => {
          const done = () => {
            collider.active = false;
            left.setVisible(false);
            right.setVisible(false);
            mechanism.setFillStyle(light);
            beam.setAlpha(0.65);
            ready();
          };
          if (instant) {
            done();
            return;
          }
          const duration = 720;
          this.tweens.add({
            targets: needle,
            angle: sluice ? 540 : 90,
            duration,
          });
          this.tweens.add({
            targets: [left, right],
            x: mirror
              ? (target: Phaser.GameObjects.Rectangle) =>
                  obstacleX + (target === left ? -98 : 98)
              : '+=0',
            y: mirror ? 520 : 345,
            alpha: 0,
            duration,
            ease: 'Cubic.InOut',
            onComplete: done,
          });
        };
      }
      prepareBridge() {
        const span = ravineEnd - ravineStart;
        const center = (ravineStart + ravineEnd) / 2;
        this.add.rectangle(ravineStart - 14, 595, 16, 80, 0x92665d);
        this.add.rectangle(ravineEnd + 14, 595, 16, 80, 0x92665d);
        const sign = this.label(center, 565, '끊어진 다리');
        this.restoreObstacle = (ready, instant) => {
          sign.setText('빛의 다리');
          const surface = this.add.rectangle(center, 650, span, 34, light, 0);
          this.physics.add.existing(surface, true);
          this.physics.add.collider(this.player, surface);
          const tile = span / 5;
          for (let i = 0; i < 5; i++) {
            const plank = this.add
              .rectangle(
                ravineStart + tile * (i + 0.5),
                666,
                tile - 4,
                18,
                stone,
                0,
              )
              .setStrokeStyle(2, light);
            if (instant) {
              plank.setY(642).setAlpha(1);
            } else {
              this.tweens.add({
                targets: plank,
                y: 642,
                alpha: 1,
                delay: i * 105,
                duration: 290,
                ease: 'Cubic.Out',
                onComplete: i === 4 ? ready : undefined,
              });
            }
          }
          if (instant) ready();
        };
      }
      animateSolution(lines: readonly string[]) {
        const camera = this.cameras.main;
        const done = () => {
          camera.startFollow(this.player, true, 0.08, 0.08);
          current.current.onResolved();
        };
        if (reducedMotion || lines.length === 0) {
          this.restoreObstacle(done, reducedMotion);
          return;
        }
        const destinationX = ravine ? (ravineStart + ravineEnd) / 2 : obstacleX;
        const destinationY = ravine ? 612 : 484;
        camera.stopFollow();
        camera.pan(
          (terminalX + destinationX) / 2,
          360,
          280,
          Phaser.Math.Easing.Sine.Out,
        );
        for (const [index, line] of lines.entries()) {
          const command = this.add
            .text(terminalX - 96, 326 + index * 26, line, {
              fontFamily: 'Consolas, monospace',
              fontSize: '25px',
              color: '#f6ecd3',
              backgroundColor: '#172035',
              padding: { x: 10, y: 4 },
            })
            .setDepth(12)
            .setAlpha(0);
          this.tweens.add({
            targets: command,
            delay: 240 + index * 180,
            x: destinationX - 30,
            y: destinationY,
            scale: { from: 1, to: 0.2, ease: 'Quart.In' },
            alpha: { from: 1, to: 0.16, ease: 'Quart.In' },
            duration: 890,
            ease: 'Sine.InOut',
            onComplete: () => {
              command.destroy();
              const impact = this.add
                .circle(destinationX, destinationY, 15, light, 0.65)
                .setDepth(11);
              this.tweens.add({
                targets: impact,
                scale: 4,
                alpha: 0,
                duration: 360,
                onComplete: () => impact.destroy(),
              });
              if (index === lines.length - 1) this.restoreObstacle(done, false);
            },
          });
        }
      }
      label(x: number, y: number, text: string) {
        return this.add
          .text(x, y, text, {
            fontFamily: 'Malgun Gothic, sans-serif',
            fontSize: '13px',
            color: '#a4b9af',
          })
          .setOrigin(0.5);
      }
      nearby(): 'guide' | 'terminal' | 'exit' | null {
        const x = this.player.x;
        return Math.abs(x - guideX) < 100
          ? 'guide'
          : Math.abs(x - terminalX) < 100 && !current.current.obstacleCleared
            ? 'terminal'
            : Math.abs(x - exitX) < 100 && current.current.obstacleCleared
              ? 'exit'
              : null;
      }
      update() {
        if (!this.player) return;
        const {
          locked,
          obstacleCleared,
          codeLines,
          touch: input,
        } = current.current;
        const touch = input.current;
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
        if (!this.resolutionStarted) {
          if (codeLines) {
            this.resolutionStarted = true;
            this.animateSolution(codeLines);
          } else if (obstacleCleared) {
            this.resolutionStarted = true;
            this.restoreObstacle(() => {}, true);
          }
        }
        if (paused) {
          this.jumpRequested = false;
          this.interactionRequested = false;
          touch.left = false;
          touch.right = false;
          touch.jump = false;
          touch.interact = false;
          this.player.setVelocityX(0);
          this.player.anims.stop();
          this.player.setTexture('traveler-0');
          this.input.keyboard?.resetKeys();
          this.prompt.setVisible(false);
          return;
        }
        if (ravine && this.player.y > 735) {
          this.player.body!.reset(1080, 575);
          this.input.keyboard?.resetKeys();
        }
        const left = this.keys.LEFT.isDown || this.keys.A.isDown || touch.left;
        const right =
          this.keys.RIGHT.isDown || this.keys.D.isDown || touch.right;
        this.player.setVelocityX(left ? -260 : right ? 260 : 0);
        if (left || right) this.player.setFlipX(left);
        if ((left || right) && this.player.body!.blocked.down)
          this.player.play('traveler-walk', true);
        else {
          this.player.anims.stop();
          this.player.setTexture('traveler-0');
        }
        if (
          (this.jumpRequested || touch.jump) &&
          this.player.body!.blocked.down
        )
          this.player.setVelocityY(-460);
        touch.jump = false;
        this.jumpRequested = false;
        const target = this.nearby();
        const interact = this.interactionRequested || touch.interact;
        touch.interact = false;
        this.interactionRequested = false;
        if (interact && target) {
          this.input.keyboard?.resetKeys();
          current.current.onInteract(target);
        }
        this.prompt.setVisible(!!target);
        this.prompt.setPosition(this.player.x, this.player.y - 68);
        this.prompt.setText(
          target === 'guide'
            ? '이야기 듣기'
            : target === 'terminal'
              ? `${stage.terminal} 조사`
              : stage.exit,
        );
      }
    }
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: portrait.matches ? 720 : 1280,
      height: 720,
      backgroundColor: sky,
      pixelArt: true,
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 1100 }, debug: false },
      },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: Adventure,
      audio: { noAudio: true },
    });
    const resize = () =>
      game.scale.setGameSize(portrait.matches ? 720 : 1280, 720);
    portrait.addEventListener('change', resize);
    return () => {
      portrait.removeEventListener('change', resize);
      game.destroy(true);
    };
  }, [stageId]);
  return (
    <div
      className="world-canvas"
      ref={host}
      aria-label={`방향키로 이동하는 ${stages[stageId].place} 월드`}
    />
  );
}
