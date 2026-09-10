import { useEffect, useRef, useState } from "react";

type Mode = "inline" | "shadow" | "shadow-reset" | "iframe";

/**
 * Stands in for the builder's own stylesheet, and is always live.
 *
 * It used to sit behind a checkbox. Every rule here is selector-based, and
 * selectors do not cross a shadow boundary – so the toggle changed nothing in
 * three of the four modes and looked broken. There is also no question the
 * "off" state answers: the comparison that matters is between the modes, and
 * this is the instrument that makes leak-in visible at all.
 */
const HOSTILE_PAGE_CSS = `
/* Pretend the builder UI ships these. An email template should not inherit them. */
.preview-target p     { color: #d13b3b; font-family: cursive; letter-spacing: .08em; }
.preview-target h1    { font-size: 14px; text-transform: lowercase; }
.preview-target table { border: 3px dashed #d13b3b; }
`;

const SAMPLE = `<style>
  /* An email template's OWN stylesheet. Does it escape and restyle the app? */
  body, p { background: #fffbe6; }
  .cta { background: #1f7a4d; color: #fff; padding: 8px 14px; }
</style>
<h1>Quarterly update</h1>
<p>Hi <b>Procter &amp; Gamble</b>, your report is ready.</p>
<table width="100%" bgcolor="#f4f4f4"><tr><td align="center">
  <span class="cta">View report</span>
</td></tr></table>`;

/**
 * Answers: "I kind of wonder if our preview needs to render these in an
 * isolated shadow DOM that doesn't inherit any styles from the main page, so
 * they see the unstyled preview."
 *
 * There are two leaks, and they are not the same problem:
 *
 *   IN  – the app's CSS styles the email, so the builder sees a preview that
 *         does not match what the recipient gets.
 *   OUT – the email's own <style> block escapes and restyles the builder UI.
 *
 * Step through the four modes to see which leak each one actually closes.
 */
export const PreviewIsolation = () => {
  const [mode, setMode] = useState<Mode>("shadow");
  const [html, setHtml] = useState(SAMPLE);
  const shadowHost = useRef<HTMLDivElement>(null);

  // Inject the "app stylesheet" so leak-in is observable.
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "hostile-page-css";
    style.textContent = HOSTILE_PAGE_CSS;
    document.head.appendChild(style);

    return () => style.remove();
  }, []);

  // Shadow DOM modes.
  useEffect(() => {
    const host = shadowHost.current;
    if (!host || (mode !== "shadow" && mode !== "shadow-reset")) return;

    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    root.innerHTML = "";

    if (mode === "shadow-reset") {
      // Inherited properties (color, font-family, letter-spacing) cross a
      // shadow boundary even though selectors do not. This is the only way to
      // stop them.
      const reset = document.createElement("style");
      reset.textContent = ":host { all: initial; display: block; }";
      root.appendChild(reset);
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    root.appendChild(wrapper);
  }, [mode, html]);

  return (
    <div className="panel">
      <div className="panel__hd">Preview isolation · which leak does each mode close?</div>

      <div className="panel__bd">
        <div className="row">
          <span className="row__label">the app stylesheet is live</span>
          <div className="seg">
            {(
              [
                ["inline", "inline div"],
                ["shadow", "shadow DOM"],
                ["shadow-reset", "shadow + all:initial"],
                ["iframe", "sandboxed iframe"],
              ] as Array<[Mode, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={mode === value ? "on" : ""}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="hint">
          {mode === "inline" &&
            "Both leaks are open. The app's CSS restyles the email, and the email's <style> block escapes into the app."}
          {mode === "shadow" &&
            "Selectors no longer reach in, and the email's <style> is trapped. But inherited properties – color, font-family, letter-spacing – still cross the boundary. Switch to inline div to see what a leak actually looks like: the whole page turns cream."}
          {mode === "shadow-reset" &&
            "all:initial on :host cuts inheritance too. Closest thing to a true blank slate without an iframe."}
          {mode === "iframe" &&
            "Nothing crosses in either direction. Also the only mode that gets its own document, so <style> and conditional comments behave the way an email client would treat them."}
        </p>

        <textarea
          className="code-input"
          rows={8}
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          spellCheck={false}
        />

        <div className="preview-label">rendered output</div>

        {mode === "inline" && (
          <div
            className="preview-target preview-box"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: the point of the harness
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {(mode === "shadow" || mode === "shadow-reset") && (
          <div
            ref={shadowHost}
            className="preview-target preview-box"
            key={mode}
          />
        )}

        {mode === "iframe" && (
          <iframe
            className="preview-box"
            title="isolated preview"
            sandbox=""
            srcDoc={html}
          />
        )}
      </div>
    </div>
  );
};
