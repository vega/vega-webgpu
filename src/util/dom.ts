// Taken from vega-scenegraph

// create a new DOM element
export function domCreate(doc, tag, ns = null) {
  if (!doc && typeof document !== 'undefined' && document.createElement) {
    doc = document;
  }
  return doc ? (ns ? doc.createElementNS(ns, tag) : doc.createElement(tag)) : null;
}

// find first child element with matching tag
export function domFind(el, tag) {
  tag = tag.toLowerCase();
  var nodes = el.childNodes,
    i = 0,
    n = nodes.length;
  for (; i < n; ++i)
    if (nodes[i].tagName.toLowerCase() === tag) {
      return nodes[i];
    }
}
