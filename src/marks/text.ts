import {font, lineHeight, textLines} from '../util/text';

function draw(ctx, item, tfx) {
  let opacity = item.opacity == null ? 1 : item.opacity,
    p,
    x,
    y,
    i,
    lh,
    tl,
    str;
  return;
}

export default {
  type: 'text',
  draw: draw
};
