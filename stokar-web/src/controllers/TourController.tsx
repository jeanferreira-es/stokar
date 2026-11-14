import { driver, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useTheme } from 'styled-components';
import { tourStepsFor, tourStorageKey, type TourStep } from '@/models/tour';
import { TourStyle } from '@/styles/TourStyle';
import { useCurrentUser } from './AuthController';

interface TourController {
  /** Abre o tutorial do começo (ex.: botão "Ver tutorial"). */
  startTour: () => void;
}

const TourContext = createContext<TourController | null>(null);

/** Espera o layout assentar (fontes, menu) antes de abrir o tutorial automático. */
const AUTO_START_DELAY = 700;

const MORE_TARGET = 'nav:more';
const MORE_HINT = '<br><br>No celular, você encontra isso em <b>Mais</b>, na barra de baixo.';

function readSeen(key: string) {
  try {
    return localStorage.getItem(key) === 'done';
  } catch {
    return true; // sem storage (modo privado restrito): melhor não insistir a cada acesso
  }
}

function writeSeen(key: string) {
  try {
    localStorage.setItem(key, 'done');
  } catch {
    /* ignore */
  }
}

/** Primeiro elemento visível entre as alternativas do passo (menu lateral, barra inferior...). */
function resolveTarget(targets: string[]): { element: Element; target: string } | null {
  for (const target of targets) {
    const element = Array.from(document.querySelectorAll(`[data-tour="${target}"]`)).find(
      (el) => el.getClientRects().length > 0,
    );
    if (element) return { element, target };
  }
  return null;
}

function buildSteps(steps: TourStep[]): DriveStep[] {
  const result: DriveStep[] = [];
  for (const step of steps) {
    const popover = { title: step.title, description: step.description };
    if (!step.targets) {
      result.push({ popover });
      continue;
    }
    const resolved = resolveTarget(step.targets);
    if (!resolved) continue;
    // no celular, várias áreas ficam dentro do botão "Mais" da barra inferior
    if (resolved.target === MORE_TARGET) popover.description += MORE_HINT;
    result.push({ element: resolved.element, popover });
  }
  return result;
}

export function TourController({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const theme = useTheme();
  const instance = useRef<Driver | null>(null);
  const storageKey = tourStorageKey(user.id);

  const startTour = useCallback(() => {
    instance.current?.destroy();
    const steps = buildSteps(tourStepsFor(user.role));
    if (steps.length === 0) return;

    const tour = driver({
      steps,
      popoverClass: 'stokar-tour',
      overlayColor: '#101418',
      overlayOpacity: theme.mode === 'dark' ? 0.7 : 0.55,
      stagePadding: 6,
      stageRadius: 14,
      smoothScroll: true,
      allowClose: true,
      // durante o tutorial o elemento destacado não responde a cliques (evita trocar de tela no meio)
      disableActiveInteraction: true,
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Próximo',
      prevBtnText: 'Voltar',
      doneBtnText: 'Concluir',
      closeBtnLabel: 'Fechar tutorial',
      onPopoverRender: (popover, { state }) => {
        const isLast = state.activeIndex === steps.length - 1;
        if (isLast) return;
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'stokar-tour-skip';
        skip.textContent = 'Pular tutorial';
        skip.addEventListener('click', () => tour.destroy());
        popover.footer.insertBefore(skip, popover.footer.firstChild);
      },
      // fechar, pular ou concluir: conta como visto
      onDestroyed: () => {
        writeSeen(storageKey);
        instance.current = null;
      },
    });

    instance.current = tour;
    tour.drive();
  }, [storageKey, theme, user.role]);

  /* Primeiro acesso: abre sozinho uma vez por usuário (e por versão do tutorial) */
  useEffect(() => {
    if (readSeen(storageKey)) return;
    const timer = window.setTimeout(startTour, AUTO_START_DELAY);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só no primeiro acesso deste usuário
  }, [storageKey]);

  /* Sai da sessão com o tutorial aberto: fecha sem deixar a sobreposição na tela */
  useEffect(() => () => instance.current?.destroy(), []);

  const value = useMemo(() => ({ startTour }), [startTour]);

  return (
    <TourContext.Provider value={value}>
      <TourStyle />
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour precisa estar dentro de <TourController>');
  return ctx;
}
