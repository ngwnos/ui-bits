import { useEffect, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import tsx from "shiki/dist/langs/tsx.mjs";
import githubDark from "shiki/dist/themes/github-dark.mjs";

const THEME_NAME = "github-dark";
const highlighterPromise = createHighlighterCore({
  themes: [githubDark],
  langs: [tsx],
  engine: createJavaScriptRegexEngine(),
});

interface CodeBlockProps {
  code: string;
  language?: "tsx";
}

export default function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    highlighterPromise.then((highlighter) => {
      const highlighted = highlighter.codeToHtml(code, { lang: language, theme: THEME_NAME });
      if (isActive) setHtml(highlighted);
    });
    return () => {
      isActive = false;
    };
  }, [code, language]);

  if (!html) {
    return (
      <div className="docs-code">
        <pre className="docs-code-empty" />
      </div>
    );
  }

  return (
    <div
      className="docs-code"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
