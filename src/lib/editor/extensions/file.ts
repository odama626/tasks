import type { Extension, Node } from "@tiptap/core";

declare module '@tiptap/core' {
}

export default Node.create({
  name: 'file',
  priority: 500,

  addAttributes() {
    return {
      docAttachment: {
        default: undefined
      }
    }
  },
  

  renderHTML(args) {

  }
})