import { Bounds } from 'vega-scenegraph';
import { visit } from '../util/visit';
import { Scene, SceneGroup, SceneItem } from 'vega-typings';


interface GroupGPUCanvasContext extends GPUCanvasContext {
  _tx : number,
  _ty : number,
  _origin : [number, number],
  _clip : unknown,
  _textContext : CanvasRenderingContext2D,
}

function draw(device: GPUDevice, ctx: GroupGPUCanvasContext, scene: Scene, vb: Bounds) {
  visit(scene, (group: SceneGroup) => {
    var gx = group.x || 0,
      gy = group.y || 0,
      w = group.width || 0,
      h = group.height || 0,
      offset, oldClip;

    // setup graphics context
    ctx._tx += gx;
    ctx._ty += gy;
    ctx._textContext.save();
    ctx._textContext.translate(gx, gy);

    //@ts-ignore
    if (group.clip ||group.bounds.clip) {
      oldClip = ctx._clip;
      ctx._clip = [
        ctx._origin[0] + ctx._tx,
        ctx._origin[1] + ctx._ty,
        ctx._origin[0] + ctx._tx + w,
        ctx._origin[1] + ctx._ty + h
      ];
    }
    if (vb) vb.translate(-gx, -gy);

    visit(group, (item: SceneItem) => {
      this.draw(device, ctx, item, vb);
    });
    
    if (vb) vb.translate(gx, gy);
    //@ts-ignore
    if (group.clip ||group.bounds.clip) {
      ctx._clip = oldClip;
    }
    ctx._tx -= gx;
    ctx._ty -= gy;
    ctx._textContext.restore();
  });
}

export default {
  type: 'group',
  draw: draw,
};
