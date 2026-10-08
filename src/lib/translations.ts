import { profile } from "./profile";

export const translations = {
  en: {
    projectCategories: "Project categories", web: "Web", extensions: "Extensions",
    sections: "Sections", navigation: ["Home", "About", "Projects", "Contact"],
    hello: "Hi, I'm", aboutTitle: "About me.", projectsTitle: "Projects.", contactTitle: "Let's talk.",
    introduction: "Frontend engineer. I build interfaces and tools that make everyday life easier.",
    about: "I focus on frontend development with TypeScript, Angular, React and Next.js, with special attention to user experience and usability. I also have experience with backend and mobile development. I build apps, tools and browser extensions. I also explore automation and AI integrations to simplify everyday tasks.",
    contact: "Have something in mind or just want to chat? Drop me an email.", email: "Email me",
    pause: "Pause", resume: "Resume", pauseLabel: "Pause animation", resumeLabel: "Resume animation",
    language: "Switch to Spanish",
  },
  es: {
    projectCategories: "Categorías de proyectos", web: "Web", extensions: "Extensiones",
    sections: "Secciones", navigation: ["Inicio", "Sobre mí", "Proyectos", "Contacto"],
    hello: "Hola, soy", aboutTitle: "Sobre mí.", projectsTitle: "Proyectos.", contactTitle: "Hablemos.",
    introduction: profile.introduction, about: profile.about,
    contact: "Si tenés algo en mente o querés charlar, mandame un mail.", email: "Escribime",
    pause: "Pausar", resume: "Reanudar", pauseLabel: "Pausar animación", resumeLabel: "Reanudar animación",
    language: "Cambiar a inglés",
  },
};
