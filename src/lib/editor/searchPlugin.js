import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export function createSearchPlugin(query) {
  if (!query || !query.trim()) return new Plugin({ key: new PluginKey('search') }); // empty plugin, no decorations

  return new Plugin({
    key: new PluginKey('search'),
    props: {
      decorations(state) {
        const decorations = [];
        const regex = new RegExp(query, 'gi');

        state.doc.descendants((node, pos) => {
          if (node.isText) {
            let match;
            while ((match = regex.exec(node.text)) !== null) {
              decorations.push(
                Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                  class: 'highlight',
                })
              );
            }
          }
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
}
