import { useEffect, useState } from "react";
import { flexoki } from "ui-bits";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import tsx from "shiki/dist/langs/tsx.mjs";
import type { RawThemeSetting, ThemeRegistration } from "@shikijs/types";

const THEME_NAME = "flexoki-dark";

const flexokiTokenSettings: RawThemeSetting[] = [
  {
    scope: ["comment", "punctuation.definition.comment"],
    settings: { foreground: flexoki.base["500"], fontStyle: "italic" },
  },
  {
    scope: ["string", "string.quoted", "string.template"],
    settings: { foreground: flexoki.green["300"] },
  },
  {
    scope: ["constant.numeric", "constant.language", "constant.character", "constant.other"],
    settings: { foreground: flexoki.orange["300"] },
  },
  {
    scope: ["keyword", "storage.type", "storage.modifier"],
    settings: { foreground: flexoki.purple["400"] },
  },
  {
    scope: ["entity.name.function", "support.function", "meta.function-call"],
    settings: { foreground: flexoki.blue["300"] },
  },
  {
    scope: ["entity.name.type", "support.type", "support.class", "entity.name.class"],
    settings: { foreground: flexoki.cyan["300"] },
  },
  {
    scope: ["variable", "variable.parameter", "variable.other"],
    settings: { foreground: flexoki.base["100"] },
  },
  {
    scope: ["punctuation", "meta.brace", "meta.delimiter"],
    settings: { foreground: flexoki.base["300"] },
  },
  {
    scope: ["entity.name.tag", "support.class.component"],
    settings: { foreground: flexoki.yellow["300"] },
  },
  {
    scope: ["keyword.operator", "meta.operator"],
    settings: { foreground: flexoki.base["200"] },
  },
  {
    scope: ["invalid", "invalid.illegal"],
    settings: { foreground: flexoki.red["400"] },
  },
] as RawThemeSetting[];

const flexokiDarkTheme: ThemeRegistration = {
  name: THEME_NAME,
  type: "dark",
  fg: flexoki.base["150"],
  bg: flexoki.base["950"],
  colors: {
    "editor.background": flexoki.base["950"],
    "editor.foreground": flexoki.base["150"],
    "editorLineNumber.foreground": flexoki.base["600"],
    "editorLineNumber.activeForeground": flexoki.base["200"],
    "editorCursor.foreground": flexoki.base["100"],
    "editor.selectionBackground": flexoki.base["850"],
  },
  settings: flexokiTokenSettings,
  tokenColors: flexokiTokenSettings,
};

const highlighterPromise = createHighlighterCore({
  themes: [flexokiDarkTheme],
  langs: [tsx],
  engine: createJavaScriptRegexEngine(),
});

interface CodeBlockProps {
  code: string;
  language?: "tsx";
}

export default function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  const normalizedCode = code.endsWith("\n") ? code : `${code}\n`;

  useEffect(() => {
    let isActive = true;
    highlighterPromise.then((highlighter) => {
      const highlighted = highlighter.codeToHtml(normalizedCode, { lang: language, theme: THEME_NAME });
      if (isActive) setHtml(highlighted);
    });
    return () => {
      isActive = false;
    };
  }, [language, normalizedCode]);

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
