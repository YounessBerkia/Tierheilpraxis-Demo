/**
 * Mobile Tierheilpraxis Heike Mathes — Interactive Logic (app.js)
 * Strictly aligned with PROJEKTDOKUMENTATION.md
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================================
     1. MOBILE NAVIGATION TOGGLE
     ======================================================================== */
  const mobileBtn = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');

  if (mobileBtn && mainNav) {
    const closeMobileMenu = () => {
      mainNav.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
    };

    mobileBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', (e) => {
      if (
        mainNav.classList.contains('open') &&
        !mainNav.contains(e.target) &&
        !mobileBtn.contains(e.target)
      ) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        closeMobileMenu();
      }
    });
  }

  /* ========================================================================
     2. INTERACTIVE HOMÖOPATHIE DEEP-DIVE TABS (index.html)
     ======================================================================== */
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabBtns.length > 0) {
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        tabBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  /* ========================================================================
     3. ACCESSIBLE MODALS (IMPRESSUM § 5 DDG & DATENSCHUTZ)
     ======================================================================== */
  const modalTriggers = document.querySelectorAll('[data-open-modal]');
  const modalClosers = document.querySelectorAll('[data-close-modal]');
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-open-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
      }
    });
  });

  modalClosers.forEach((closer) => {
    closer.addEventListener('click', () => {
      const backdrop = closer.closest('.modal-backdrop');
      if (backdrop) backdrop.classList.remove('open');
    });
  });

  modalBackdrops.forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalBackdrops.forEach((b) => b.classList.remove('open'));
    }
  });

  /* ========================================================================
     4. APPOINTMENT BOOKING WIZARD (termin.html)
     ======================================================================== */
  const appointmentForm = document.getElementById('appointment-form');
  if (!appointmentForm) return;

  // Wizard State
  const state = {
    currentStep: 1,
    petType: 'Hund',
    petName: '',
    petAge: '',
    services: ['Klassische Homöopathie & Erstanamnese'],
    visitType: 'Mobiler Hausbesuch vor Ort',
    city: 'Bischofsheim',
    address: '',
    date: '',
    altDate: '',
    timeSlot: '10:30 – 12:30 Uhr (Vormittag)',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerNotes: ''
  };

  // DOM References
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const petButtons = document.querySelectorAll('.pet-option');
  const serviceChips = document.querySelectorAll('.service-chip');
  const petNameInput = document.getElementById('pet-name');
  const petAgeInput = document.getElementById('pet-age');
  const visitTypeSelect = document.getElementById('visit-type');
  const citySelect = document.getElementById('city-select');
  const addressInput = document.getElementById('address-input');
  const areaFeedbackText = document.getElementById('area-feedback-text');
  const dateInput = document.getElementById('preferred-date');
  const altDateInput = document.getElementById('alternative-date');
  const dateDayHint = document.getElementById('date-day-hint');
  const timeSlotBtns = document.querySelectorAll('.time-slot-btn');
  const ownerNameInput = document.getElementById('owner-name');
  const ownerPhoneInput = document.getElementById('owner-phone');
  const ownerEmailInput = document.getElementById('owner-email');
  const ownerNotesInput = document.getElementById('owner-notes');
  const formErrorMsg = document.getElementById('form-error-msg');

  // Summary DOM References
  const sumPet = document.getElementById('sum-pet');
  const sumServices = document.getElementById('sum-services');
  const sumLocation = document.getElementById('sum-location');
  const sumDatetime = document.getElementById('sum-datetime');

  // Set default date to next working day (Mo–Sa)
  const initDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 0) {
      // If Sunday, advance to Monday
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    dateInput.min = isoDate;
    dateInput.value = isoDate;
    state.date = isoDate;
    handleDateChange();
  };

  // Format ISO date to German readable date (e.g. "Dienstag, 17.11.2026")
  const formatGermanDate = (isoStr) => {
    if (!isoStr) return 'Noch nicht gewählt';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return `${days[d.getDay()]}, ${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  // Update Live Summary Card
  const updateSummary = () => {
    const petLabel = state.petName
      ? `${state.petType} („${state.petName}“${state.petAge ? ', ' + state.petAge : ''})`
      : `${state.petType}${state.petAge ? ' (' + state.petAge + ')' : ''}`;
    sumPet.textContent = petLabel;

    sumServices.textContent =
      state.services.length > 0 ? state.services.join(' · ') : 'Allgemeine Beratung';

    sumLocation.textContent = `${state.visitType} · ${state.city}${state.address ? ' (' + state.address + ')' : ''}`;

    sumDatetime.textContent = state.date
      ? `${formatGermanDate(state.date)} · ${state.timeSlot}`
      : 'Bitte im 3. Schritt wählen';
  };

  // Step Switching
  const wizardCard = document.getElementById('booking-wizard-container');
  const goToStep = (stepNumber, shouldScroll = false) => {
    state.currentStep = stepNumber;
    wizardSteps.forEach((stepEl, idx) => {
      stepEl.classList.toggle('active', idx + 1 === stepNumber);
    });
    stepIndicators.forEach((indEl, idx) => {
      const s = idx + 1;
      indEl.classList.toggle('active', s === stepNumber);
      indEl.classList.toggle('completed', s < stepNumber);
    });
    updateSummary();

    if (shouldScroll && window.innerWidth <= 768 && wizardCard) {
      wizardCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  document.querySelectorAll('[data-next-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = Number(btn.getAttribute('data-next-step'));
      goToStep(next, true);
    });
  });

  document.querySelectorAll('[data-prev-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prev = Number(btn.getAttribute('data-prev-step'));
      goToStep(prev, true);
    });
  });

  stepIndicators.forEach((ind) => {
    ind.addEventListener('click', () => {
      const target = Number(ind.getAttribute('data-goto-step'));
      goToStep(target, true);
    });
  });

  // Pet Option Selection
  petButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      petButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.petType = btn.getAttribute('data-pet');
      updateSummary();
    });
  });

  petNameInput.addEventListener('input', (e) => {
    state.petName = e.target.value.trim();
    updateSummary();
  });

  petAgeInput.addEventListener('input', (e) => {
    state.petAge = e.target.value.trim();
    updateSummary();
  });

  // Service Multi-Selection
  const syncServicesFromDOM = () => {
    const active = [];
    serviceChips.forEach((chip) => {
      if (chip.classList.contains('selected')) {
        active.push(chip.getAttribute('data-service'));
      }
    });
    state.services = active;
    updateSummary();
  };

  serviceChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      // Ensure at least one stays selected
      const selectedCount = document.querySelectorAll('.service-chip.selected').length;
      if (selectedCount === 0) {
        chip.classList.add('selected');
      }
      syncServicesFromDOM();
    });
  });

  // Location & Visit Type
  const updateAreaBanner = () => {
    const city = citySelect.value;
    state.city = city;
    state.visitType = visitTypeSelect.value;
    if (city === 'Weiterer Ort im Rhein-Main-Gebiet') {
      areaFeedbackText.innerHTML =
        '<strong>Rhein-Main-Gebiet:</strong> Bitte tragen Sie rechts Ihre PLZ und Ihren Ort ein – wir stimmen die Anfahrt telefonisch ab.';
    } else {
      areaFeedbackText.innerHTML = `<strong>${city}</strong> liegt im regulären Tätigkeitsgebiet der Mobilen Tierheilpraxis Heike Mathes – stressfreier Hausbesuch direkt vor Ort möglich.`;
    }
    updateSummary();
  };

  citySelect.addEventListener('change', updateAreaBanner);
  visitTypeSelect.addEventListener('change', updateAreaBanner);
  addressInput.addEventListener('input', (e) => {
    state.address = e.target.value.trim();
    updateSummary();
  });

  // Date & Speaking Hours Validation (Mo–Fr 8:30–19:30, Sa 8:30–13:00)
  const handleDateChange = () => {
    const val = dateInput.value;
    if (!val) return;
    const parts = val.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat

    if (dayOfWeek === 0) {
      dateDayHint.style.color = '#B86B43';
      dateDayHint.textContent =
        'Hinweis: Sonntags ist Ruhetag. Bitte wählen Sie möglichst einen Werktag (Mo–Sa), oder wir vereinbaren telefonisch einen Ausweichtermin.';
    } else if (dayOfWeek === 6) {
      dateDayHint.style.color = 'var(--primary-sage)';
      dateDayHint.textContent =
        'Samstag gewählt: Samstags-Sprechzeit von 08:30 bis 13:00 Uhr (Nachmittags-Zeitfenster sind samstags deaktiviert).';
    } else {
      dateDayHint.style.color = 'var(--primary-sage)';
      dateDayHint.textContent = `${formatGermanDate(val)} · Reguläre Sprechzeit: 08:30 – 19:30 Uhr`;
    }

    // Enable/disable afternoon slots on Saturday
    timeSlotBtns.forEach((btn, idx) => {
      // Indices 2, 3, 4 are 13:00-15:00, 15:00-17:00, 17:00-19:30
      if (dayOfWeek === 6 && idx >= 2 && idx <= 4) {
        btn.disabled = true;
        if (btn.classList.contains('selected')) {
          btn.classList.remove('selected');
          timeSlotBtns[0].classList.add('selected');
          state.timeSlot = timeSlotBtns[0].getAttribute('data-slot');
        }
      } else {
        btn.disabled = false;
      }
    });

    state.date = val;
    updateSummary();
  };

  dateInput.addEventListener('change', handleDateChange);
  altDateInput.addEventListener('input', (e) => {
    state.altDate = e.target.value.trim();
  });

  timeSlotBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      timeSlotBtns.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.timeSlot = btn.getAttribute('data-slot');
      updateSummary();
    });
  });

  // Pre-fill from URL parameters (?thema=... or ?ort=...)
  const applyUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const thema = params.get('thema');
    const ort = params.get('ort');

    if (thema) {
      const matchingChip = document.querySelector(`.service-chip[data-key="${thema}"]`);
      if (matchingChip) {
        serviceChips.forEach((c) => c.classList.remove('selected'));
        matchingChip.classList.add('selected');
        syncServicesFromDOM();
      } else if (thema === 'eingewoehnung') {
        const verhaltenChip = document.querySelector('.service-chip[data-key="verhalten"]');
        if (verhaltenChip) {
          serviceChips.forEach((c) => c.classList.remove('selected'));
          verhaltenChip.classList.add('selected');
          syncServicesFromDOM();
        }
      }
    }

    if (ort) {
      const options = Array.from(citySelect.options);
      const found = options.find((o) => o.value.toLowerCase() === ort.toLowerCase());
      if (found) {
        citySelect.value = found.value;
        updateAreaBanner();
      }
    }
  };

  initDefaultDate();
  applyUrlParams();
  updateSummary();

  // Form Submission & Confirmation Generation
  appointmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.ownerName = ownerNameInput.value.trim();
    state.ownerPhone = ownerPhoneInput.value.trim();
    state.ownerEmail = ownerEmailInput.value.trim();
    state.ownerNotes = ownerNotesInput.value.trim();

    if (!state.ownerName || !state.ownerPhone) {
      formErrorMsg.style.display = 'block';
      return;
    }
    formErrorMsg.style.display = 'none';

    const refId = `#THP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('conf-owner-name').textContent = state.ownerName;
    document.getElementById('conf-ref-id').textContent = refId;

    const emailSubject = `Terminanfrage (${refId}): ${state.petType} in ${state.city} – ${state.ownerName}`;
    const emailBodyLines = [
      `Guten Tag Frau Mathes,`,
      ``,
      `ich möchte gerne einen Termin / Hausbesuch über Ihre Website anfragen:`,
      ``,
      `--------------------------------------------------`,
      `1. TIER & ANLIEGEN`,
      `- Tierart: ${state.petType}${state.petName ? ' (Name: ' + state.petName + ')' : ''}${state.petAge ? ' · Alter/Rasse: ' + state.petAge : ''}`,
      `- Gewünschte Schwerpunkte: ${state.services.join(', ')}`,
      ``,
      `2. TERMINART & ORT IM RHEIN-MAIN-GEBIET`,
      `- Terminart: ${state.visitType}`,
      `- Ort: ${state.city}${state.address ? ' (' + state.address + ')' : ''}`,
      ``,
      `3. WUNSCHTERMIN`,
      `- Wunschdatum: ${formatGermanDate(state.date)}`,
      `- Bevorzugtes Zeitfenster: ${state.timeSlot}`,
      ...(state.altDate ? [`- Alternativtermin / Flexibilität: ${state.altDate}`] : []),
      ``,
      `4. KONTAKTDATEN & VORBERICHT`,
      `- Name: ${state.ownerName}`,
      `- Telefon für Rückruf: ${state.ownerPhone}`,
      ...(state.ownerEmail ? [`- E-Mail: ${state.ownerEmail}`] : []),
      ...(state.ownerNotes ? [`- Kurzbericht / Vorbefunde: ${state.ownerNotes}`] : []),
      `--------------------------------------------------`,
      ``,
      `Ich freue mich auf Ihre Rückmeldung zur Terminabstimmung.`,
      ``,
      `Mit freundlichen Grüßen`,
      `${state.ownerName}`
    ];

    const emailBody = emailBodyLines.join('\n');
    const mailtoHref = `mailto:tierheilpraxis-mathes@gmx.de?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    const mailtoBtn = document.getElementById('conf-mailto-btn');
    mailtoBtn.href = mailtoHref;

    const previewBox = document.getElementById('conf-email-preview');
    previewBox.textContent = `An: tierheilpraxis-mathes@gmx.de\nBetreff: ${emailSubject}\n\n${emailBody}`;

    // Hide form, show confirmation
    appointmentForm.style.display = 'none';
    document.querySelector('.stepper').style.display = 'none';
    document.getElementById('booking-confirmation-view').style.display = 'block';
  });

  // Reset Button
  const resetBtn = document.getElementById('conf-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('booking-confirmation-view').style.display = 'none';
      document.querySelector('.stepper').style.display = 'grid';
      appointmentForm.style.display = 'block';
      goToStep(1, true);
    });
  }

  // ICS Calendar File Download
  const icsBtn = document.getElementById('conf-ics-btn');
  if (icsBtn) {
    icsBtn.addEventListener('click', () => {
      const dateClean = (state.date || '20261117').replace(/-/g, '');
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Mobile Tierheilpraxis Heike Mathes//Termin-Assistent//DE',
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${dateClean}`,
        `DTEND;VALUE=DATE:${dateClean}`,
        `SUMMARY:Wunschtermin Tierheilpraxis Heike Mathes (${state.petType})`,
        `DESCRIPTION:Angefragtes Zeitfenster: ${state.timeSlot} | Schwerpunkte: ${state.services.join(', ')} | Tel. Heike Mathes: 06144-337222 / Mobil 0172-8010221`,
        `LOCATION:${state.city}${state.address ? ', ' + state.address : ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Terminwunsch-Tierheilpraxis-Mathes-${state.date}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
});
