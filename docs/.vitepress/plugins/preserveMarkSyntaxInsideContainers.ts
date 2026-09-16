import { MarkdownRenderer } from 'vitepress';

/**
 * vitepress-plugin-tabs 会把容器内任何以 `==` 开头的行当成 tab 分隔符，
 * 导致 `:::warning` 之类容器里的 ==高亮== 失效，还会生成一个没有父容器的
 * tab 组件，SSR 时抛 useTabsSingleState 错误。
 *
 * 这里在 tab 规则之前插队：只要行首的 `==` 后面紧跟非空白，且同一行还有
 * 收尾的 `==`，就判定是 mark 而不是 tab，交回给正常的 inline 解析。
 *
 * 判别依据是 tab 语法写作 `== 标签名`（`==` 后有空格、且不成对），
 * 而高亮写作 `==文字==`（不留空格、成对出现）。
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

      // 不要求整行以 `==` 收尾：`==高亮==，后面还有正文。` 也算高亮
      if (!/^==\S.*?==/.test(line)) {
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
