"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

// Illustrations provisoires : remplacer les fichiers de public/hero/ par de
// vraies photos et mettre à jour les chemins ci-dessous.
const SLIDES: Slide[] = [
  {
    image: "/hero/fenetre.svg",
    title: "Ton prochain chez-toi, à distance de marche de l'UQAC",
    subtitle: "Chambres, studios et appartements près du campus",
  },
  {
    image: "/hero/porte.svg",
    title: "Des propriétaires du Saguenay, pas des intermédiaires",
    subtitle: "Publie ou trouve un logement, directement",
  },
  {
    image: "/hero/chambre.svg",
    title: "La distance réelle du campus, sur chaque annonce",
    subtitle: "Fini les surprises une fois sur place",
  },
  {
    image: "/hero/cles.svg",
    title: "Gère tes locataires et tes paiements facilement",
    subtitle: "Chambres, loyers et retards suivis automatiquement",
  },
  {
    image: "/hero/maison.svg",
    title: "Ton chez-toi étudiant t'attend",
    subtitle: "Commence ta recherche dès maintenant",
  },
];

// Distance minimale (en px) pour qu'un glissement change de diapositive.
const SWIPE_THRESHOLD = 50;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStartX = useRef<number | null>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  const previous = useCallback(() => {
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // index en dépendance : le délai repart à zéro après chaque changement,
  // pour qu'un glissement ne soit pas suivi aussitôt d'un défilement auto.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, index]);

  function handlePointerUp(e: React.PointerEvent) {
    if (swipeStartX.current === null) return;
    const distance = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;
    if (distance < 0) next();
    else previous();
  }

  const slide = SLIDES[index];

  return (
    <div
      className="relative h-[420px] w-full touch-pan-y select-none overflow-hidden sm:h-[480px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => {
        swipeStartX.current = e.clientX;
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStartX.current = null;
      }}
    >
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
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
