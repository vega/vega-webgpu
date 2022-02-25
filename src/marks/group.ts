import {Bounds} from 'vega-scenegraph';
import {visit} from '../util/visit';
import {Scene, SceneGroup, SceneItem} from 'vega-typings';

function draw(device: GPUDevice, ctx: GPUCanvasContext, scene: Scene, vb: Bounds) {
  visit(scene, (group: SceneGroup) => {
    const {x, y} = group;
    //@ts-ignore
    vb.translate(x, y);
    visit(group, (item: SceneItem) => {
      this.draw(device, ctx, item, vb);
    });
  });
}

export default {
  type: 'group',
  draw: draw,
};
