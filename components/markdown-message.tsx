import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeMarkdownUrl } from "@/lib/source-links";

export function MarkdownMessage({ children }: { children: string }) {
  const components: Components = {
    a: ({ node: _node, href, children: linkChildren, ...props }) => {
      const safeHref = href ? safeMarkdownUrl(href) : "";
      if (!safeHref) return <span>{linkChildren}</span>;
      const external = /^https?:/i.test(safeHref);
      return <a {...props} href={safeHref} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{linkChildren}</a>;
    },
    img: ({ node: _node, alt }) => <span className="markdown-image-label">{alt ? `[Image: ${alt}]` : "[Image]"}</span>,
  };

  return <div className="markdown-body">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      urlTransform={safeMarkdownUrl}
      components={components}
    >
      {children}
    </ReactMarkdown>
  </div>;
}
