import {sceneVisit as visit, Bounds} from 'vega-scenegraph';
import {Scene, SceneGroup, SceneItem} from 'vega-typings';

function draw(ctx: GPUCanvasContext, scene: Scene, vb: Bounds) {
  visit(scene, (group: SceneGroup) => {
    const {x, y} = group;
    //@ts-ignore
    vb.translate(x, y);
    visit(group, (item: SceneItem) => {
      this.draw(ctx, item, vb);
    });
  });
}

export default {
  type: 'group',
  draw: draw,
  pick: () => null
};
