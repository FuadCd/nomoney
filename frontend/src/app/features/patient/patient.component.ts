import { Component, Injectable, signal, computed, inject, effect, afterNextRender, DestroyRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/* ─── Shared accessibility profile type ─── */
export interface IntakeAccessibilityProfile {
  mobility: boolean;
  sensory: boolean;
  chronicPain: boolean;
  cognitive: boolean;
  language: boolean;
  supportPerson: boolean;
}

/* ─── Inline i18n translations ─── */
const EN: Record<string, string> = {
  stepXof3: 'Step {{step}} of 3',
  complaintQuestion: 'What brings you in today?',
  complaintPlaceholder: 'Describe what brings you in today',
  severityQuestion: 'How much discomfort are you feeling?',
  severity1: '1 – Minimal',
  severity2: '2 – Mild',
  severity3: '3 – Moderate',
  severity4: '4 – Severe',
  severity5: '5 – Emergency',
  accessibilityIntro: "Let's make your visit comfortable.",
  q_mobility: 'Do you use a wheelchair or walking aid?',
  q_sensory: 'Do loud environments cause you distress?',
  q_chronicPain: 'Do you have ongoing pain that makes sitting difficult?',
  q_cognitive: 'Do you need information shown with larger text?',
  q_language: 'Do you prefer quieter communication?',
  q_support: 'Would you like a support person to stay with you?',
  yes: 'YES',
  no: 'NO',
  languageLabel: 'Language',
  confirmButton: 'Confirm and Check In',
  waitingTitle: "You're checked in!",
  waitingTime: 'Estimated wait: ~15 minutes',
  waitingMessage: "We'll check in with you soon",
  passportTitle: 'Your Accessibility Passport',
  urgencyLabel: 'Urgency',
  checkinTitle: 'Check-In',
  checkinMessage: 'This is the check-in screen.',
  questionXof6: 'Question {{n}} of 6',
  errorComplaintRequired: 'Please describe your concern first',
  urgencyLow: 'Low',
  urgencyMedium: 'Medium',
  urgencyHigh: 'High',
  urgencyUrgent: 'Urgent',
  checkinDiscomfort: 'How are you feeling right now?',
  checkinNeeds: 'Is there anything you need?',
  checkinLeave: 'Are you thinking of leaving?',
  needInterpreter: 'Interpreter',
  needQuietSpace: 'Quiet space',
  needInfo: 'More info',
  needMobility: 'Mobility help',
  needNone: 'None',
  leaveStaying: 'Staying',
  leaveUnsure: 'Unsure',
  leaveThinking: 'Thinking of leaving',
  thankYou: 'Thank you!',
  thankYouMessage: 'Your response has been recorded.',
  returnToWaiting: 'Returning to waiting room...',
  highContrast: 'High contrast',
  largeText: 'Large text',
  patientId: 'Patient ID',
  waitingSince: 'Waiting since check-in',
  ttsLabel: 'Read aloud',
};

const FR: Record<string, string> = {
  stepXof3: 'Étape {{step}} sur 3',
  complaintQuestion: "Qu'est-ce qui vous amène aujourd'hui ?",
  complaintPlaceholder: "Décrivez ce qui vous amène aujourd'hui",
  severityQuestion: "Quel est votre niveau d'inconfort ?",
  severity1: '1 – Minimal',
  severity2: '2 – Léger',
  severity3: '3 – Modéré',
  severity4: '4 – Sévère',
  severity5: '5 – Urgence',
  accessibilityIntro: 'Rendons votre visite confortable.',
  q_mobility: 'Utilisez-vous un fauteuil roulant ou une aide à la marche ?',
  q_sensory: 'Les environnements bruyants vous causent-ils de la détresse ?',
  q_chronicPain: 'Avez-vous des douleurs qui rendent la position assise difficile ?',
  q_cognitive: "Avez-vous besoin d'un texte plus grand ?",
  q_language: 'Préférez-vous une communication plus calme ?',
  q_support: "Souhaitez-vous qu'une personne de soutien reste avec vous ?",
  yes: 'OUI',
  no: 'NON',
  languageLabel: 'Langue',
  confirmButton: "Confirmer et s'enregistrer",
  waitingTitle: 'Vous êtes enregistré !',
  waitingTime: 'Attente estimée : ~15 minutes',
  waitingMessage: 'Nous reviendrons bientôt vers vous',
  passportTitle: "Votre Passeport d'Accessibilité",
  urgencyLabel: 'Urgence',
  checkinTitle: 'Enregistrement',
  checkinMessage: "Ceci est l'écran d'enregistrement.",
  questionXof6: 'Question {{n}} sur 6',
  errorComplaintRequired: "Veuillez d'abord décrire votre problème",
  urgencyLow: 'Faible',
  urgencyMedium: 'Moyen',
  urgencyHigh: 'Élevé',
  urgencyUrgent: 'Urgent',
  checkinDiscomfort: 'Comment vous sentez-vous en ce moment ?',
  checkinNeeds: 'Avez-vous besoin de quelque chose ?',
  checkinLeave: 'Pensez-vous partir ?',
  needInterpreter: 'Interprète',
  needQuietSpace: 'Espace calme',
  needInfo: "Plus d'info",
  needMobility: 'Aide à la mobilité',
  needNone: 'Aucun',
  leaveStaying: 'Je reste',
  leaveUnsure: 'Incertain',
  leaveThinking: 'Je pense partir',
  thankYou: 'Merci !',
  thankYouMessage: 'Votre réponse a été enregistrée.',
  returnToWaiting: "Retour à la salle d'attente...",
  highContrast: 'Contraste élevé',
  largeText: 'Grand texte',
  patientId: 'ID Patient',
  waitingSince: "En attente depuis l'enregistrement",
  ttsLabel: 'Lecture vocale',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _locale = signal(
    (typeof localStorage !== 'undefined' && localStorage.getItem('patient_lang')) || 'en',
  );
  readonly locale = computed(() => this._locale());

  private readonly translations: Record<string, Record<string, string>> = { en: EN, fr: FR };

  t(key: string, params?: Record<string, string>): string {
    let val = this.translations[this._locale()]?.[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(`{{${k}}}`, v);
      }
    }
    return val;
  }

  setLocale(lang: string): void {
    this._locale.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('patient_lang', lang);
    }
  }
}

@Injectable({ providedIn: 'root' })
export class A11yModeService {
  readonly highContrast = signal(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('a11y_hc') === '1',
  );
  readonly fontScale = signal(
    typeof sessionStorage !== 'undefined' ? +(sessionStorage.getItem('a11y_fs') ?? '1') : 1,
  );
  readonly tts = signal(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('a11y_tts') === '1',
  );

  toggleHighContrast(): void {
    const next = !this.highContrast();
    this.highContrast.set(next);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('a11y_hc', next ? '1' : '0');
    }
  }

  increaseFontSize(): void {
    const next = Math.min(this.fontScale() + 0.15, 1.75);
    this.fontScale.set(+next.toFixed(2));
    this._persistFs();
  }

  decreaseFontSize(): void {
    const next = Math.max(this.fontScale() - 0.15, 0.85);
    this.fontScale.set(+next.toFixed(2));
    this._persistFs();
  }

  toggleTts(): void {
    const next = !this.tts();
    this.tts.set(next);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('a11y_tts', next ? '1' : '0');
    }
    if (!next && typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
  }

  speak(text: string, lang = 'en'): void {
    if (!this.tts() || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'fr' ? 'fr-CA' : 'en-US';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  private _persistFs(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('a11y_fs', this.fontScale().toString());
    }
  }
}

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="patient-layout" [class.hc]="a11y.highContrast()">
      <header class="header">
        <div class="header-top">
          <h1>AccessER</h1>
          <div class="a11y-toggles">
            <button
              class="toggle-btn lang"
              [class.on]="i18n.locale() === 'en'"
              (click)="i18n.setLocale('en')"
            >
              EN
            </button>
            <button
              class="toggle-btn lang"
              [class.on]="i18n.locale() === 'fr'"
              (click)="i18n.setLocale('fr')"
            >
              FR
            </button>
            <button
              class="toggle-btn"
              (click)="a11y.toggleTts()"
              [class.on]="a11y.tts()"
              [attr.aria-label]="i18n.t('ttsLabel')"
            >
              🔊
            </button>
            <button
              class="toggle-btn"
              (click)="a11y.toggleHighContrast()"
              [class.on]="a11y.highContrast()"
              [attr.aria-label]="i18n.t('highContrast')"
            >
              ◑
            </button>
            <button class="toggle-btn" (click)="a11y.decreaseFontSize()" aria-label="Decrease text">
              A−
            </button>
            <button class="toggle-btn" (click)="a11y.increaseFontSize()" aria-label="Increase text">
              A+
            </button>
          </div>
        </div>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .patient-layout {
        --p-bg: #f5f7fa;
        --p-fg: #1a1a1a;
        --p-card-bg: white;
        --p-accent: #0d47a1;
        --p-accent-fg: white;
        --p-muted: #555;
        --p-border: #bbb;
        --p-input-bg: white;
        --p-green: #2e7d32;
        --p-red: #c62828;
        --p-light-accent: #e3f2fd;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--p-bg);
        color: var(--p-fg);
        transition:
          background 0.2s,
          color 0.2s;
      }
      .patient-layout.hc {
        --p-bg: #000;
        --p-fg: #fff;
        --p-card-bg: #111;
        --p-accent: #ffd600;
        --p-accent-fg: #000;
        --p-muted: #ccc;
        --p-border: #fff;
        --p-input-bg: #222;
        --p-green: #00e676;
        --p-red: #ff5252;
        --p-light-accent: #222;
      }
      .header {
        width: 100%;
        max-width: 480px;
        padding: 0.75rem 1rem;
        background: #0d47a1;
        color: white;
      }
      .patient-layout.hc .header {
        background: #111;
        border-bottom: 2px solid var(--p-accent);
      }
      .header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .header h1 {
        margin: 0;
        font-size: 1.3rem;
        letter-spacing: 0.5px;
      }
      .a11y-toggles {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .toggle-btn {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: 2px solid rgba(255, 255, 255, 0.5);
        background: transparent;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      .toggle-btn.lang {
        font-size: 0.7rem;
        width: 30px;
      }
      .toggle-btn.on {
        background: rgba(255, 255, 255, 0.25);
        border-color: white;
      }
      .content {
        width: 100%;
        max-width: 480px;
        flex: 1;
        padding: 1rem 1rem 2rem;
      }
    `,
  ],
})
export class PatientComponent {
  readonly i18n = inject(I18nService);
  readonly a11y = inject(A11yModeService);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: MutationObserver;
  private speakTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    /* Sync fontScale → <html> root so all rem units scale */
    effect(() => {
      const scale = this.a11y.fontScale();
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = scale * 100 + '%';
      }
    });

    /* When TTS toggled ON, read current screen */
    effect(() => {
      if (this.a11y.tts()) {
        this.debouncedSpeak();
      }
    });

    /* Observe .content for child-list / text changes → auto-speak */
    afterNextRender(() => {
      const el = document.querySelector('.content');
      if (!el) return;
      this.observer = new MutationObserver(() => this.debouncedSpeak());
      this.observer.observe(el, { childList: true, subtree: true, characterData: true });
    });

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      clearTimeout(this.speakTimer);
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = '';
      }
    });
  }

  private debouncedSpeak(): void {
    clearTimeout(this.speakTimer);
    this.speakTimer = setTimeout(() => {
      if (!this.a11y.tts() || typeof document === 'undefined') return;
      const text = document.querySelector('.content')?.textContent?.trim();
      if (text) this.a11y.speak(text, this.i18n.locale());
    }, 500);
  }
}
