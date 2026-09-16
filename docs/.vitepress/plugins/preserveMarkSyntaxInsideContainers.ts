import { MarkdownRenderer } from 'vitepress';

/**
 * vitepress-plugin-tabs 会把容器内任何以 `==` 开头的行当成 tab 分隔符，
 * 导致 `:::warning` 之类容器里的 ==高亮== 失效。
 * 这里在 tab 规则之前插队，先把完整的 `==...==` 整行交给 mark 插件处理。
 */
export default function preserveMarkSyntaxInsideContainers(
  md: MarkdownRenderer,
) {
  md.block.ruler.before(
    'tab',
    'mark_line_in_container',
    (state, startLine, endLine, silent) => {
      // @ts-expect-error parentType 未在类型里暴露
      if (state.parentType !== 'container') {
        return false;
      }

      const start = state.bMarks[startLine] + state.tShift[startLine];
      const line = state.src.slice(start, state.eMarks[startLine]).trim();

      if (!/^==\S.*==\s*$/.test(line)) {
        return false;
      }

      if (silent) {
        return true;
      }

      // @ts-expect-error 同上
      const oldParent = state.parentType;
      const nextLine = startLine + 1;
      // @ts-expect-error 同上
      state.parentType = 'paragraph';

      const paragraphOpen = state.push('paragraph_open', 'p', 1);
      paragraphOpen.map = [startLine, nextLine];

      const inline = state.push('inline', '', 0);
      inline.map = [startLine, nextLine];
      inline.content = state
        .getLines(startLine, nextLine, state.blkIndent, false)
        .trim();
      inline.children = [];

      state.push('paragraph_close', 'p', -1);
      // @ts-expect-error 同上
      state.parentType = oldParent;
      state.line = nextLine;
      return true;
    },
  );
}
