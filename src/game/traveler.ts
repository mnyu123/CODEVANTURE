import Phaser from 'phaser';
// Small original pixel sprite; textures stay owned by the Phaser game instance.
const palette: Record<string, number> = {
  o: 0x17282c,
  g: 0x35695f,
  l: 0x629b80,
  h: 0xa6c6a0,
  s: 0xe2b590,
  d: 0xb17d63,
  b: 0x655044,
  a: 0xd5a765,
  c: 0xb8f2c8,
  t: 0x30474d,
};
const pixels = [
  '        oooo        ',
  '      ooggggoo      ',
  '     oggllllggo     ',
  '    ogllhhhllgo     ',
  '    oglhhhhhlgo     ',
  '   ogglsssssggo     ',
  '   oggssossosgo     ',
  '    ogssssssgo      ',
  '     ogsddsgo       ',
  '    ooggaggoo       ',
  '   ogglaaalggo      ',
  '  ogglaaaallggo     ',
  '  ogglooolllggo     ',
  '  oggllbblllggo     ',
  '  oggllbblllggo     ',
  '   oglooolllgo      ',
  '   ogllggllggo      ',
  '   ogllggllggo      ',
  '  oggglgglggggo     ',
  '  oggllggllgggo     ',
  '   ooloooooloo      ',
  '     ottttto        ',
  '     ottttto        ',
  '     obboobbo       ',
  '     obboobbo       ',
  '    obbbobbbbo      ',
  '    oooo ooooo      ',
];
export function createTraveler(scene: Phaser.Scene) {
  for (let frame = 0; frame < 5; frame++) {
    const graphics = scene.add.graphics();
    for (let y = 0; y < pixels.length; y++)
      for (let x = 0; x < pixels[y].length; x++) {
        const color = palette[pixels[y][x]];
        if (color === undefined) continue;
        const footOffset =
          y > 21 && frame > 0
            ? x < 10
              ? frame % 2
                ? -1
                : 1
              : frame % 2
                ? 1
                : -1
            : 0;
        graphics.fillStyle(color);
        graphics.fillRect(x * 2, y * 2 + footOffset * 2, 2, 2);
      }
    // Copper clasp, satchel and a trailing scarf give a readable silhouette.
    graphics.fillStyle(0xd5a765);
    graphics.fillRect(17, 23, 3, 3);
    graphics.fillStyle(0x775a42);
    graphics.fillRect(9, 30, 7, 9);
    graphics.fillStyle(0xb89365);
    graphics.fillRect(10, 30, 6, 2);
    graphics.fillStyle(0x73b99c);
    graphics.fillRect(4 - (frame % 2) * 2, 20, 8, 4);
    graphics.fillRect(2, 24, 5, 3);
    graphics.generateTexture(`traveler-${frame}`, 40, 58);
    graphics.destroy();
  }
  scene.anims.create({
    key: 'traveler-walk',
    frames: [1, 2, 3, 4].map((frame) => ({ key: `traveler-${frame}` })),
    frameRate: 9,
    repeat: -1,
  });
}
