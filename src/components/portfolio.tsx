"use client";

import { useEffect, useState } from "react";
import { ShaderBackground } from "@/components/shader-background";
import { profile } from "@/lib/profile";

import { translations } from "@/lib/translations";

type View = "intro" | "about" | "projects" | "contact";
function Arrow() {
  return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow /></a>;
}
export function Portfolio() {
  const [view, setView] = useState<View>("intro");
  const [paused, setPaused] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const copy = translations[language];
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <div className="portfolio">
    <ShaderBackground paused={paused} />
    <main className="stage">
      <div className="content">
        <nav className="navigation" aria-label={copy.sections}>
          {(["intro", "about", "projects", "contact"] as View[]).map((id, index) => [id, copy.navigation[index]] as [View, string]).map(([id, label]) =>
            <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>{label}</button>)}
        </nav>
        <section className="copy" aria-live="polite" aria-atomic="true">
          <div className="copy-panel" aria-hidden={view !== "intro"} inert={view !== "intro"}><h1>{copy.hello}<br /><span>{profile.name}.</span></h1><p>{copy.introduction}</p></div>
          <div className="copy-panel" aria-hidden={view !== "about"} inert={view !== "about"}><h1>{copy.aboutTitle}</h1><p>{copy.about}</p></div>
          <div className="copy-panel" aria-hidden={view !== "projects"} inert={view !== "projects"}><h1>{copy.projectsTitle}</h1><div className="project-links">{profile.projects.map(project => <ExternalLink key={project.url} href={project.url}>{project.name}</ExternalLink>)}</div></div>
          <div className="copy-panel" aria-hidden={view !== "contact"} inert={view !== "contact"}><h1>{copy.contactTitle}</h1><p>{copy.contact}</p><a className="email" href={`mailto:${profile.email}`}>{copy.email}<Arrow /></a></div>
        </section>
        <div className="social-links">
          <ExternalLink href={profile.linkedin}>LinkedIn</ExternalLink>
          <ExternalLink href={profile.github}>GitHub</ExternalLink>
        </div>
      </div>
    </main>
    <footer className="footer">
      <button className="language-toggle" type="button" aria-label={copy.language} onClick={() => setLanguage(value => value === "en" ? "es" : "en")}>{language === "en" ? "EN / ES" : "ES / EN"}</button>

      <button className="motion-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)} aria-label={paused ? copy.resumeLabel : copy.pauseLabel}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">{paused ? <path d="m5 3 7 5-7 5Z" fill="currentColor" /> : <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.5" />}</svg><span>{paused ? copy.resume : copy.pause}</span>
      </button>
    </footer>
  </div>;
}
