// src/components/Comment.js
import { Mark, mergeAttributes } from "@tiptap/core";

const Comment = Mark.create({
  name: "comment",

  addAttributes() {
    return {
      id: { default: null },
      content: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-comment-id": HTMLAttributes.id,
        title: HTMLAttributes.content,
        class: "comment-highlight",
        style: "background:rgba(255,229,100,.4);",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      addComment:
        (attrs) =>
        ({ chain }) =>
          chain().setMark("comment", attrs).run(),

      removeComment:
        (id) =>
        ({ state, tr, dispatch }) => {
          let changed = false;
          state.doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === "comment" && mark.attrs.id === id) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
                changed = true;
              }
            });
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      updateComment:
        (id, newContent) =>
        ({ state, tr, dispatch }) => {
          let changed = false;
          state.doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === "comment" && mark.attrs.id === id) {
                const newMark = mark.type.create({
                  ...mark.attrs,
                  content: newContent,
                });
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
                tr.addMark(pos, pos + node.nodeSize, newMark);
                changed = true;
              }
            });
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});

export default Comment;
