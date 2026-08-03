"use client";

import { useEffect, useState, useCallback } from "react";

interface Slide {
  gradient: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

// Icônes en traits simples, décoratives, en arrière-plan de chaque scène.
const IconWindow = () => (
  <svg viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.5">
    <rect x="40" y="30" width="120" height="140" rx="4" />
    <line x1="100" y1="30" x2="100" y2="170" />
    <line x1="40" y1="100" x2="160" y2="100" />
  </svg>
);

const IconDoor = () => (
  <svg viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.5">
    <rect x="60" y="20" width="80" height="160" rx="4" />
    <circle cx="120" cy="100" r="3" fill="white" stroke="none" />
    <path d="M40 180h120" />
  </svg>
);

const IconPlantLamp = () => (
  <svg viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.5">
    <path d="M100 180V90" />
    <path d="M100 90c0-30-25-40-40-35 5 25 20 40 40 35Z" />
    <path d="M100 90c0-25 20-35 35-30-5 22-18 34-35 30Z" />
    <ellipse cx="100" cy="182" rx="30" ry="6" />
  </svg>
);

const IconKey = () => (
  <svg viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.5">
    <circle cx="70" cy="100" r="30" />
    <line x1="98" y1="120" x2="160" y2="182" />
    <line x1="130" y1="150" x2="148" y2="132" />
    <line x1="148" y1="168" x2="166" y2="150" />
  </svg>
);

const IconHouse = () => (
  <svg viewBox="0 0 200 200" fill="none" stroke="white" strokeWidth="1.5">
    <path d="M30 100 100 40l70 60" />
    <path d="M50 90v90h100V90" />
    <rect x="90" y="130" width="20" height="50" />
  </svg>
);

const SLIDES: Slide[] = [
  {
    gradient: "linear-gradient(135deg, #1f6f5c 0%, #123f34 100%)",
    icon: <IconWindow />,
    title: "Ton prochain chez-toi, à distance de marche de l'UQAC",
    subtitle: "Chambres, studios et appartements près du campus",
  },
  {
    gradient: "linear-gradient(135deg, #c34e36 0%, #7a2f1f 100%)",
    icon: <IconDoor />,
    title: "Des propriétaires du Saguenay, pas des intermédiaires",
    subtitle: "Publie ou trouve un logement, directement",
  },
  {
    gradient: "linear-gradient(135deg, #164a3e 0%, #0d2b24 100%)",
    icon: <IconPlantLamp />,
    title: "La distance réelle du campus, sur chaque annonce",
    subtitle: "Fini les surprises une fois sur place",
  },
  {
    gradient: "linear-gradient(135deg, #b98a2e 0%, #6e510f 100%)",
    icon: <IconKey />,
    title: "Gère tes locataires et tes paiements facilement",
    subtitle: "Chambres, loyers et retards suivis automatiquement",
  },
  {
    gradient: "linear-gradient(135deg, #2c4a6e 0%, #16293e 100%)",
    icon: <IconHouse />,
    title: "Ton chez-toi étudiant t'attend",
    subtitle: "Commence ta recherche dès maintenant",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const slide = SLIDES[index];

  return (
    <div
      className="relative h-[420px] w-full overflow-hidden sm:h-[480px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <div className="absolute inset-0" style={{ background: s.gradient }} />
          <div className="absolute -right-10 bottom-0 h-[420px] w-[420px] opacity-20 sm:h-[520px] sm:w-[520px]">
            {s.icon}
          </div>
          {/* Voile sombre pour la lisibilité du texte */}
          <div className="absolute inset-0 bg-ink/30" />
        </div>
      ))}

      <div className="relative flex h-full flex-col items-start justify-center px-6 sm:px-12">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {slide.title}
          </h1>
          <p className="mt-3 text-white/85">{slide.subtitle}</p>
        </div>
      </div>

      {/* Indicateurs cliquables */}
      <div className="absolute bottom-6 left-6 flex gap-2 sm:left-12">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Aller à la diapositive ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
