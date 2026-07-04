import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { logoDataUrl } from './logoData.js';

const STORAGE_KEY = 'fiche-projet-v1';
const STORAGE_META_KEY = 'fiche-projet-meta-v1';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const NativePrint = registerPlugin('NativePrint');

const categories = [
  'Culture',
  'Bien-être / santé',
  'Sport',
  'Sortie festive',
  'Séjour',
  'Achat matériel',
  'Courses alimentaires',
  'Alimentation',
  'Mission pour le GEM',
  'Cuisine',
  'Activité au local',
  'Activité hors du local',
  'Activité accessible à tous',
  'Autres',
];

const goals = [
  'Interaction sociale',
  'Se sentir mieux',
  'Montée en compétence',
  'Motricité',
  'Amusement',
  'Autres',
];

const defaultNeeds = [
  { label: 'Activité payante', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Intervenant', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Repas', detail: 'Déjeuner / dîner', quantity: '', estimatedCost: '23', actualCost: '' },
  { label: 'Autres repas', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Train', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Car', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Bus', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Métro / tramway', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Autre transport', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Véhicule prêté', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Location véhicule', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Assurance véhicule', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  {
    label: 'Indemnités kilométriques',
    detail: '',
    quantity: '',
    estimatedCost: '',
    actualCost: '',
  },
  { label: 'Carburant', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Péage', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Couchage hôtel / gîte', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Matériel', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
  { label: 'Autres', detail: '', quantity: '', estimatedCost: '', actualCost: '' },
];

const categoryLabelAliases = {
  'Bien-être / santé': ['Bien etre / sante'],
  Séjour: ['Sejour'],
  'Achat matériel': ['Achat materiel'],
  'Courses alimentaires': [
    'Courses alimentation',
    'Achat alimentation',
    'Achat alimentaire',
    'Achat courses alimentaires',
    'Acheter course alimentation',
    'Acheter courses alimentation',
  ],
  'Activité au local': ['Activite au local'],
  'Activité hors du local': ['Activite hors du local'],
  'Activité accessible à tous': ['Activite accessible a tous'],
};

const goalLabelAliases = {
  'Montée en compétence': ['Montee en competence'],
  Motricité: ['Motricite'],
};

const previousNeedLabels = {
  'Activité payante': [
    'Activite payante',
    'Entree / billet',
    'Cinema / spectacle',
    'Musee / visite',
    'Autre sortie',
    'Billet spectacle / activite',
  ],
  'Métro / tramway': ['Metro / tramway'],
  'Autre transport': [
    'Taxi',
    'Taxi / transports en commun',
    'Taxi / metro / bus / tramway',
    'Avion',
    'Transport autre',
    'Transport',
  ],
  'Véhicule prêté': ['Vehicule prete'],
  'Location véhicule': ['Location vehicule'],
  'Assurance véhicule': ['Assurance vehicule'],
  'Indemnités kilométriques': ['Indemnites kilometriques', 'Prise en charge kms'],
  Péage: ['Peage'],
  'Couchage hôtel / gîte': ['Couchage hotel / gite'],
  Matériel: ['Materiel'],
};

const needGroups = [
  {
    title: 'Activité',
    labels: ['Activité payante', 'Intervenant'],
  },
  {
    title: 'Repas',
    labels: ['Repas', 'Autres repas'],
  },
  {
    title: 'Transport',
    labels: [
      'Train',
      'Car',
      'Bus',
      'Métro / tramway',
      'Autre transport',
      'Véhicule prêté',
      'Location véhicule',
      'Assurance véhicule',
      'Indemnités kilométriques',
      'Carburant',
      'Péage',
    ],
  },
  {
    title: 'Hébergement',
    labels: ['Couchage hôtel / gîte'],
  },
  {
    title: 'Matériel',
    labels: ['Matériel'],
  },
  {
    title: 'Autres',
    labels: ['Autres'],
  },
];

const MEAL_LOCATION_AGGLOMERATION = 'agglomeration-havraise';
const MEAL_LOCATION_OUTSIDE = 'hors-le-havre';
const MEAL_LOCATION_NONE = 'no-meal';
const REPEATABLE_PAID_ACTIVITY_LABEL = 'Activité payante';
const REPEATABLE_MATERIAL_LABEL = 'Matériel';
const REPEATABLE_OTHER_LABEL = 'Autres';
const MANUAL_REPEATABLE_LABELS = [REPEATABLE_MATERIAL_LABEL, REPEATABLE_OTHER_LABEL];
const LOANED_VEHICLE_LABEL = 'Véhicule prêté';
const MEAL_NEED_LABELS = ['Repas', 'Autres repas'];
const AUTO_MEAL_QUANTITY_LABELS = ['Repas'];
const COMMENTS_MAX_LENGTH = 180;

const quantityPlaceholdersByNeed = {
  Repas: 'Nb repas',
  'Autres repas': 'Nb repas',
  Train: 'Billets',
  Car: 'Billets',
  Bus: 'Tickets',
  'Métro / tramway': 'Tickets',
  'Autre transport': 'Trajets',
  'Véhicule prêté': 'Jours',
  'Location véhicule': 'Jours',
  'Assurance véhicule': 'Jours',
  'Indemnités kilométriques': 'Km',
  Carburant: 'Litres',
  Péage: 'Passages',
  'Couchage hôtel / gîte': 'Nuits',
  Matériel: 'Qté',
};

const costPlaceholdersByNeed = {
  'Indemnités kilométriques': '€/km',
  Carburant: 'Prix carburant',
  Repas: 'Prix repas',
};

const needNotes = {
  'Indemnités kilométriques': 'Remboursement des kilomètres parcourus.',
  Carburant: 'Achat de carburant sur justificatif.',
};

function todayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateInputValueFromIso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromInputValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInWords(value) {
  const date = dateFromInputValue(value);
  if (!date) return value || '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function requestEndDateInWords(requestDate) {
  const date = dateFromInputValue(requestDate);
  if (!date) return '';
  const endDate = new Date(date);
  endDate.setMonth(endDate.getMonth() + 3);
  endDate.setDate(endDate.getDate() - 1);
  return formatDateInWords(
    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(
      endDate.getDate(),
    ).padStart(2, '0')}`,
  );
}

function readStorageMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isBeforeToday(inputDate) {
  return Boolean(inputDate) && inputDate < todayInputValue();
}

function createInitialForm() {
  return {
    organizers: '',
    requestDate: todayInputValue(),
    activityName: '',
    categories: [],
    categoryOther: '',
    goals: [],
    goalOther: '',
    location: '',
    firstDate: '',
    repetitions: '',
    participantsCount: '',
    comments: '',
    mealLocation: MEAL_LOCATION_NONE,
    facebookCommitment: false,
    receiptsCommitment: false,
    needs: defaultNeeds.map((need) =>
      need.label === 'Repas' ? { ...need, estimatedCost: mealPrice(MEAL_LOCATION_NONE) } : need,
    ),
  };
}

function createNeed(label) {
  const defaultNeed = defaultNeeds.find((need) => need.label === label);
  return defaultNeed
    ? { ...defaultNeed }
    : { label, detail: '', quantity: '', estimatedCost: '', actualCost: '' };
}

function normalizeListLabels(list, aliasesByLabel) {
  if (!Array.isArray(list)) return [];
  return list.reduce((normalizedLabels, label) => {
    const normalizedLabel =
      Object.entries(aliasesByLabel).find(
        ([currentLabel, aliases]) => currentLabel === label || aliases.includes(label),
      )?.[0] ?? label;
    return normalizedLabels.includes(normalizedLabel)
      ? normalizedLabels
      : [...normalizedLabels, normalizedLabel];
  }, []);
}

function isNeedFilled(need) {
  return ['detail', 'quantity', 'estimatedCost', 'actualCost'].some(
    (key) => String(need[key] || '').trim() !== '',
  );
}

function hasUserEnteredNeed(need) {
  if (['detail', 'quantity', 'actualCost'].some((key) => String(need[key] || '').trim() !== '')) {
    return true;
  }
  return need.label !== 'Repas' && parseAmount(need.estimatedCost) > 0;
}

function hasMeaningfulForm(form) {
  return (
    [
      'organizers',
      'activityName',
      'categoryOther',
      'goalOther',
      'location',
      'firstDate',
      'repetitions',
      'participantsCount',
      'comments',
    ].some((key) => String(form[key] || '').trim() !== '') ||
    form.categories?.length > 0 ||
    form.goals?.length > 0 ||
    form.mealLocation !== MEAL_LOCATION_NONE ||
    form.facebookCommitment ||
    form.receiptsCommitment ||
    form.needs?.some(hasUserEnteredNeed)
  );
}

function isManualRepeatableNeed(need) {
  return MANUAL_REPEATABLE_LABELS.includes(need.label);
}

function normalizeManualRepeatableNeeds(needs) {
  const nextNeeds = needs.filter((need) => !isManualRepeatableNeed(need));
  MANUAL_REPEATABLE_LABELS.forEach((label) => {
    const matchingNeeds = needs.filter((need) => need.label === label);
    const nextMatchingNeeds = matchingNeeds.length > 0 ? matchingNeeds : [createNeed(label)];
    const defaultIndex = defaultNeeds.findIndex((need) => need.label === label);
    const nextInsertIndex = nextNeeds.findIndex((need) => {
      const needDefaultIndex = defaultNeeds.findIndex(
        (defaultNeed) => defaultNeed.label === need.label,
      );
      return needDefaultIndex > defaultIndex;
    });
    nextNeeds.splice(
      nextInsertIndex >= 0 ? nextInsertIndex : nextNeeds.length,
      0,
      ...nextMatchingNeeds,
    );
  });
  return nextNeeds;
}

function hasEstimatedCostField(need) {
  return need.label !== LOANED_VEHICLE_LABEL;
}

function costAmountForNeed(need, key) {
  return hasEstimatedCostField(need) ? parseAmount(need[key]) : 0;
}

function displayLabelForRepeatedNeed(need, paidActivityNumber) {
  if (need.label !== REPEATABLE_PAID_ACTIVITY_LABEL || paidActivityNumber <= 1) return need.label;
  return `${need.label} ${paidActivityNumber}`;
}

function annotateNeedDisplayLabels(needs) {
  let paidActivityCount = 0;
  return needs.map((need) => {
    if (need.label === REPEATABLE_PAID_ACTIVITY_LABEL) {
      paidActivityCount += 1;
      return { need, displayLabel: displayLabelForRepeatedNeed(need, paidActivityCount) };
    }
    return { need, displayLabel: need.label };
  });
}

function loadForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const initialForm = createInitialForm();
    if (!raw) return initialForm;
    const saved = JSON.parse(raw);
    const mealLocation = normalizeMealLocation(saved.mealLocation ?? initialForm.mealLocation);
    const savedNeeds = Array.isArray(saved.needs) ? saved.needs : [];
    const needs = defaultNeeds.flatMap((need, index) => {
      const matchingLabels = [need.label, ...(previousNeedLabels[need.label] ?? [])];
      if (need.label === REPEATABLE_PAID_ACTIVITY_LABEL) {
        const exactNeeds = savedNeeds.filter((item) => item?.label === need.label);
        const convertedNeeds = savedNeeds.filter(
          (item) => previousNeedLabels[need.label]?.includes(item?.label) && isNeedFilled(item),
        );
        const matchingNeeds = [...exactNeeds.filter(isNeedFilled), ...convertedNeeds];
        return matchingNeeds.length > 0
          ? matchingNeeds.map((savedNeed) => ({ ...need, ...savedNeed, label: need.label }))
          : { ...need };
      }
      if (isManualRepeatableNeed(need)) {
        const matchingNeeds = savedNeeds.filter((item) => matchingLabels.includes(item?.label));
        return matchingNeeds.length > 0
          ? matchingNeeds.map((savedNeed) => ({ ...need, ...savedNeed, label: need.label }))
          : { ...need };
      }
      const savedNeed =
        savedNeeds.find((item) => matchingLabels.includes(item?.label)) ??
        (savedNeeds[index]?.label ? undefined : savedNeeds[index]);
      return { ...need, ...(savedNeed ?? {}), label: need.label };
    });
    return {
      ...initialForm,
      ...saved,
      comments: limitText(saved.comments ?? initialForm.comments, COMMENTS_MAX_LENGTH),
      categories: normalizeListLabels(saved.categories, categoryLabelAliases),
      goals: normalizeListLabels(saved.goals, goalLabelAliases),
      mealLocation,
      needs: normalizeManualRepeatableNeeds(
        needs.map((need) =>
          need.label === 'Repas' ? { ...need, estimatedCost: mealPrice(mealLocation) } : need,
        ),
      ),
    };
  } catch {
    return createInitialForm();
  }
}

function hasSavedForm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? hasMeaningfulForm(JSON.parse(raw)) : false;
  } catch {
    return false;
  }
}

function isSavedFormOld() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    const meta = readStorageMeta();
    const createdDate = dateInputValueFromIso(meta.createdAt);
    return isBeforeToday(createdDate || saved.requestDate);
  } catch {
    return false;
  }
}

function initialHomeMessage() {
  if (!hasSavedForm()) return '';
  if (isSavedFormOld()) return 'Cette fiche est ancienne.';
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Object.keys(validateForm(saved)).length === 0) return 'Cette fiche semble complète.';
  } catch {
    return 'Une fiche est déjà commencée.';
  }
  return 'Une fiche est déjà commencée.';
}

function parseAmount(value) {
  const normalized = String(value || '').replace(',', '.');
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function amountError(value) {
  const trimmed = String(value || '').trim();
  if (trimmed === '') return '';
  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized) || Number.parseFloat(normalized) < 0) {
    return 'Nombre positif ou zéro uniquement.';
  }
  return '';
}

function integerError(value) {
  const trimmed = String(value || '').trim();
  if (trimmed === '') return '';
  if (!/^\d+$/.test(trimmed)) return 'Chiffres uniquement.';
  return '';
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function needHasPrintContent(need) {
  return shouldPrintNeed(need);
}

function formHasPrintableNeed(form) {
  return groupedNeeds(form.needs, form.mealLocation).some((group) =>
    group.items.some(({ need }) => needHasPrintContent(need)),
  );
}

function numericValidationErrors(form) {
  const errors = {};
  const repetitionsError = integerError(form.repetitions);
  const participantsError = integerError(form.participantsCount);
  if (repetitionsError) errors.repetitions = repetitionsError;
  if (participantsError) errors.participantsCount = participantsError;
  form.needs.forEach((need, index) => {
    if (!shouldShowNeed(need, form.mealLocation)) return;

    const quantityError = integerError(need.quantity);
    const estimatedCostError = hasEstimatedCostField(need) ? amountError(need.estimatedCost) : '';
    if (quantityError) errors[`need-${index}-quantity`] = quantityError;
    if (estimatedCostError) errors[`need-${index}-estimatedCost`] = estimatedCostError;
    if (!quantityError && !isBlank(need.quantity) && isBlank(need.detail)) {
      errors[`need-${index}-detail`] = 'Écris une précision.';
    }
  });
  return errors;
}

function quantityForNeed(need) {
  const quantity = parseAmount(need.quantity);
  if (quantity > 0) return quantity;
  if (need.label === 'Repas') return 0;
  return parseAmount(need.estimatedCost) > 0 ? 1 : 0;
}

function shouldShowNeed(need, mealLocation) {
  return mealLocation !== MEAL_LOCATION_NONE || !MEAL_NEED_LABELS.includes(need.label);
}

function estimatedTotalForNeed(need) {
  return costAmountForNeed(need, 'estimatedCost') * quantityForNeed(need);
}

function groupedNeeds(needs, mealLocation) {
  const indexedNeeds = needs.map((need, index) => ({ need, index }));
  return needGroups
    .map((group) => {
      const items = group.labels
        .flatMap((label) => indexedNeeds.filter(({ need }) => need.label === label))
        .filter(({ need }) => shouldShowNeed(need, mealLocation));
      return {
        ...group,
        items,
      };
    })
    .filter((group) => group.items.length > 0);
}

function shouldPrintNeed(need) {
  if (need.label === 'Repas') {
    return parseAmount(need.quantity) > 0;
  }
  if (String(need.quantity || '').trim() !== '') return true;
  if (String(need.detail || '').trim() !== '') return true;
  return (
    need.label !== 'Repas' && hasEstimatedCostField(need) && parseAmount(need.estimatedCost) > 0
  );
}

function hasMinimumQuantityForDetail(need) {
  return parseAmount(need.quantity) >= 1;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function textValue(value) {
  return escapeHtml(value || '-').replaceAll('\n', '<br>');
}

function limitText(value, maxLength) {
  return String(value || '').slice(0, maxLength);
}

function yesNo(value) {
  return value ? 'Oui' : 'Non';
}

function normalizeMealLocation(mealLocation) {
  return mealLocation === 'le-havre' ? MEAL_LOCATION_AGGLOMERATION : mealLocation;
}

function mealPrice(mealLocation) {
  if (mealLocation === MEAL_LOCATION_NONE) return '0';
  return mealLocation === MEAL_LOCATION_OUTSIDE ? '40' : '23';
}

function shouldAutoFillMealQuantity(need, previousParticipants) {
  return (
    AUTO_MEAL_QUANTITY_LABELS.includes(need.label) &&
    (isBlank(need.quantity) || String(need.quantity) === String(previousParticipants || ''))
  );
}

function withSyncedMealQuantity(needs, participantsCount, previousParticipants = '') {
  return needs.map((need) =>
    shouldAutoFillMealQuantity(need, previousParticipants)
      ? { ...need, quantity: participantsCount }
      : need,
  );
}

function quantityPlaceholderForNeed(need) {
  return quantityPlaceholdersByNeed[need.label] || 'Nombre';
}

function costPlaceholderForNeed(need) {
  return costPlaceholdersByNeed[need.label] || 'Prix';
}

function projectedThreeMonthCost(totals, repetitions) {
  const occurrenceCount = parseAmount(repetitions) || 1;
  return totals.estimated * occurrenceCount;
}

function hasRepetitionsValue(repetitions) {
  return String(repetitions || '').trim() !== '';
}

function isBlank(value) {
  return String(value || '').trim() === '';
}

function validateForm(form) {
  const errors = numericValidationErrors(form);
  const isMaterialPurchase = form.categories.includes('Achat matériel');

  if (isBlank(form.requestDate)) errors.requestDate = 'Choisis une date.';
  if (isBlank(form.organizers)) errors.organizers = "Écris le nom de l'organisateur.";
  if (isBlank(form.activityName)) errors.activityName = "Écris le nom de l'activité.";
  if (form.categories.length === 0) {
    errors.categories = 'Choisis une catégorie.';
  }
  if (form.categories.includes('Autres') && isBlank(form.categoryOther)) {
    errors.categoryOther = 'Écris la catégorie.';
  }
  if (!isMaterialPurchase && form.goals.length === 0) {
    errors.goals = 'Choisis un but.';
  }
  if (!isMaterialPurchase && form.goals.includes('Autres') && isBlank(form.goalOther)) {
    errors.goalOther = 'Écris le but.';
  }
  if (isBlank(form.participantsCount)) {
    errors.participantsCount = 'Écris le nombre de participants.';
  }
  if (!form.facebookCommitment) {
    errors.facebookCommitment = 'Coche cette case.';
  }
  if (!form.receiptsCommitment) {
    errors.receiptsCommitment = 'Coche cette case.';
  }
  if (!formHasPrintableNeed(form)) errors.needs = 'Ajoute au moins un besoin.';

  return errors;
}

function scrollToFirstValidationError(errors) {
  window.setTimeout(() => {
    const firstErrorElement = Object.keys(errors)
      .map((key) => document.querySelector(`[data-validation-key="${key}"]`))
      .filter(Boolean)
      .sort(
        (firstElement, secondElement) =>
          firstElement.getBoundingClientRect().top - secondElement.getBoundingClientRect().top,
      )[0];

    if (!firstErrorElement) return;

    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstErrorElement.querySelector('input, textarea, button')?.focus({ preventScroll: true });
  }, 0);
}

function budgetLevelClassName(amount) {
  if (amount <= 500) return 'budget-low';
  if (amount <= 1000) return 'budget-medium';
  if (amount <= 2500) return 'budget-high';
  return 'budget-very-high';
}

function budgetDecisionLabel(amount) {
  if (amount <= 500) return 'Sous Pôle';
  if (amount <= 1000) return 'Bureau';
  if (amount <= 2500) return 'CA';
  return 'AG';
}

function buildPrintHtml(form, totals) {
  const categoriesText = [...form.categories, form.categoryOther].filter(Boolean).join(', ');
  const goalsText =
    form.categories.includes('Achat matériel') && form.goals.length === 0
      ? 'Non requis'
      : [...form.goals, form.goalOther].filter(Boolean).join(', ');
  const locationText = isBlank(form.location) ? 'à définir' : form.location;
  const requestDateText = formatDateInWords(form.requestDate);
  const requestEndDateText = requestEndDateInWords(form.requestDate);
  const firstDateText = isBlank(form.firstDate) ? 'à définir' : formatDateInWords(form.firstDate);
  const commentsText = limitText(form.comments, COMMENTS_MAX_LENGTH);
  const hasRepetitions = hasRepetitionsValue(form.repetitions);
  const projectedCost = projectedThreeMonthCost(totals, form.repetitions);
  const referenceCost = hasRepetitions ? projectedCost : totals.estimated;
  const estimatedBudgetClassName = budgetLevelClassName(totals.estimated);
  const referenceBudgetClassName = budgetLevelClassName(referenceCost);
  const decisionLabel = budgetDecisionLabel(referenceCost);
  const printableNeeds = groupedNeeds(form.needs, form.mealLocation).flatMap((group) =>
    group.items.map(({ need }) => need),
  );
  const printableNeedRows = annotateNeedDisplayLabels(printableNeeds).filter(({ need }) =>
    shouldPrintNeed(need),
  );
  const printDensityClassName =
    printableNeedRows.length > 18
      ? 'dense-budget'
      : printableNeedRows.length > 12
        ? 'compact-budget'
        : '';
  const needsRows = printableNeedRows
    .map(({ need, displayLabel }) => {
      const quantity = quantityForNeed(need);
      const estimatedTotal = estimatedTotalForNeed(need);
      const hasQuantity = String(need.quantity || '').trim() !== '';
      const displayQuantity = hasQuantity ? textValue(need.quantity) : quantity > 0 ? '1' : '';
      const showDetail = hasMinimumQuantityForDetail(need);
      const hasCostField = hasEstimatedCostField(need);
      const isConditionalMeal =
        need.label === 'Repas' && form.mealLocation === MEAL_LOCATION_OUTSIDE;
      const estimatedUnitClassName = isConditionalMeal ? 'money conditional-meal-money' : 'money';
      const estimatedUnitCost = hasCostField && quantity > 0 ? textValue(need.estimatedCost) : '';
      const estimatedTotalCost = hasCostField && quantity > 0 ? formatCurrency(estimatedTotal) : '';
      return `
        <tr>
          <td>${textValue(displayLabel)}</td>
          <td>${showDetail ? textValue(need.detail) : ''}</td>
          <td class="num">${displayQuantity}</td>
          <td class="${estimatedUnitClassName}">${estimatedUnitCost}</td>
          <td class="money">${estimatedTotalCost}</td>
          <td class="money"><span class="dot-line"></span></td>
          <td class="money"><span class="dot-line"></span></td>
        </tr>
      `;
    })
    .join('');
  const useSplitPrintPages = printableNeedRows.length > 12;
  const projectContent = `
      <header class="header">
        <img class="logo" src="${logoDataUrl}" alt="La Maison Bleue">
        <div>
          <h1>Fiche projet</h1>
          <p class="subtitle">Demande d'activité - valable 3 mois</p>
        </div>
        <div class="validity">
          ${hasRepetitions ? 'Total sur 3 mois' : 'Prix estimé'}<br>
          <span class="budget-total ${referenceBudgetClassName}">
            ${formatCurrency(referenceCost)}
          </span>
        </div>
      </header>

      <div class="info-grid">
        <section>
          <div class="section-title admin-title">Validation ${decisionLabel}</div>
          <table class="two-col admin-table">
            <tr>
              <td>Valable jusqu'au</td>
              <td><span class="dot-line"></span></td>
            </tr>
            <tr>
              <td>Réponse</td>
              <td><span class="dot-line"></span></td>
            </tr>
            <tr>
              <td>Décision ${decisionLabel}</td>
              <td><span class="dot-line"></span></td>
            </tr>
            <tr>
              <td>Date décision</td>
              <td><span class="dot-line"></span></td>
            </tr>
            <tr>
              <td>Nom</td>
              <td><span class="dot-line"></span></td>
            </tr>
          </table>
        </section>

        <section>
          <div class="section-title">Projet</div>
          <table class="two-col">
            <tr><td>Date demande</td><td>${textValue(requestDateText)}</td></tr>
            <tr><td>Fin de demande</td><td>${textValue(requestEndDateText)}</td></tr>
            <tr><td>Organisateur(s)</td><td>${textValue(form.organizers)}</td></tr>
            <tr><td>Activité</td><td>${textValue(form.activityName)}</td></tr>
            <tr><td>Catégorie</td><td>${textValue(categoriesText)}</td></tr>
            <tr><td>But</td><td>${textValue(goalsText)}</td></tr>
            <tr><td>Lieu</td><td>${textValue(locationText)}</td></tr>
            <tr><td>1ère date</td><td>${textValue(firstDateText)}</td></tr>
            <tr><td>Fois / 3 mois</td><td class="num">${textValue(form.repetitions)}</td></tr>
            <tr>
              <td>Participants</td>
              <td class="num">${textValue(form.participantsCount)}</td>
            </tr>
            <tr><td>Commentaires</td><td>${textValue(commentsText)}</td></tr>
          </table>
        </section>
      </div>

      <table class="commitments">
        <tr>
          <td>Diffusion du projet après validation</td>
          <td>${yesNo(form.facebookCommitment)}</td>
        </tr>
        <tr>
          <td>Fourniture des justificatifs de dépenses</td>
          <td>${yesNo(form.receiptsCommitment)}</td>
        </tr>
      </table>`;
  const budgetContent = `
      <section class="budget-section">
        <div class="section-title">J'ai besoin de</div>
        <table class="budget-table">
          <thead>
            <tr>
              <th>Besoin</th>
              <th>Précision</th>
              <th>Qté / nb / km</th>
              <th>Prix unité</th>
              <th>Total estimé</th>
              <th>Prix réel unité</th>
              <th>Total réel</th>
            </tr>
          </thead>
          <tbody>
            ${needsRows || '<tr><td colspan="7">Aucun besoin renseigné.</td></tr>'}
            <tr class="total-row">
              <td class="total-label" colspan="4">Total</td>
              <td class="money budget-total ${estimatedBudgetClassName}">
                ${formatCurrency(totals.estimated)}
              </td>
              <td></td>
              <td class="money"><span class="dot-line"></span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="signature-section">
        <div class="section-title">Signatures</div>
        <div class="signature-grid">
          <div class="signature-card">
            <p>Signature(s) organisateur(s)</p>
            <div class="signature-box"></div>
          </div>
          <div class="signature-card">
            <p>Signature ${decisionLabel}</p>
            <div class="signature-box"></div>
          </div>
        </div>
      </section>`;
  const budgetPageHeader = `
      <header class="budget-page-header">
        <img class="small-logo" src="${logoDataUrl}" alt="La Maison Bleue">
        <div>
          <p class="page-kicker">Budget détaillé</p>
          <h2>${textValue(form.activityName)}</h2>
          <p>${textValue(firstDateText)} · ${textValue(form.participantsCount)} participant(s)</p>
        </div>
        <div class="validity compact-validity">
          Validation ${decisionLabel}<br>
          <span class="budget-total ${referenceBudgetClassName}">
            ${formatCurrency(referenceCost)}
          </span>
        </div>
      </header>`;
  const printBody = useSplitPrintPages
    ? `
    <main class="print-page project-page ${printDensityClassName}">
      ${projectContent}
    </main>
    <main class="print-page budget-page ${printDensityClassName}">
      ${budgetPageHeader}
      ${budgetContent}
    </main>`
    : `
    <main class="print-page ${printDensityClassName}">
      ${projectContent}
      ${budgetContent}
    </main>`;

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <title>Fiche projet</title>
    <style>
      @page { size: A4; margin: 9mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #202020;
        font-family: Aptos, Calibri, "Segoe UI", Arial, sans-serif;
        font-size: 10.5px;
        line-height: 1.25;
      }
      .print-page {
        min-height: 279mm;
        display: flex;
        flex-direction: column;
        border: 1.5px solid #202020;
        padding: 7mm;
        background: #fff;
      }
      .project-page {
        break-after: page;
        page-break-after: always;
      }
      .header {
        display: grid;
        grid-template-columns: 30mm 1fr 42mm;
        align-items: center;
        gap: 12px;
        padding-bottom: 8px;
        border-bottom: 2.5px solid #1f6ca7;
      }
      .logo {
        width: 25mm;
        height: 25mm;
        object-fit: contain;
      }
      h1 {
        margin: 0;
        color: #1f6ca7;
        font-size: 24px;
        line-height: 1;
        text-align: center;
        text-transform: uppercase;
      }
      .subtitle {
        margin: 3px 0 0;
        color: #555;
        font-weight: 700;
        text-align: center;
      }
      .validity {
        min-width: 42mm;
        border: 1px solid #999;
        padding: 5px;
        text-align: right;
        background: #f2f2f2;
        font-weight: 700;
      }
      .budget-page-header {
        display: grid;
        grid-template-columns: 19mm 1fr 42mm;
        align-items: center;
        gap: 8px;
        padding-bottom: 6px;
        border-bottom: 2.5px solid #1f6ca7;
      }
      .small-logo {
        width: 17mm;
        height: 17mm;
        object-fit: contain;
      }
      .budget-page-header h2 {
        margin: 0;
        color: #1f6ca7;
        font-size: 15px;
        line-height: 1.1;
        text-transform: uppercase;
      }
      .budget-page-header p {
        margin: 2px 0 0;
        color: #555;
        font-weight: 700;
      }
      .page-kicker {
        color: #555;
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .compact-validity {
        padding: 4px;
        font-size: 9px;
      }
      .section-title {
        margin: 8px 0 4px;
        padding: 4px 6px;
        background: #1f6ca7;
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .admin-title {
        background: #6b6b6b;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        page-break-inside: avoid;
      }
      th,
      td {
        border: 1px solid #4b4b4b;
        padding: 3px 4px;
        vertical-align: top;
        text-align: center;
      }
      th {
        background: #e8f2fa;
        color: #14507d;
        text-align: center;
        font-size: 9px;
      }
      .num,
      .money {
        text-align: right;
        white-space: nowrap;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 0.78fr 1.22fr;
        gap: 7px;
      }
      .two-col td:first-child {
        width: 34%;
        color: #333;
        font-weight: 800;
        background: #f4f4f4;
      }
      .admin-table td:first-child {
        background: #d9d9d9;
      }
      .commitments {
        margin-top: 6px;
      }
      .commitments td:first-child {
        width: 82%;
      }
      .budget-section {
        margin-top: 6px;
        flex: 1;
      }
      .budget-page .budget-section {
        flex: 0 0 auto;
        margin-top: 7px;
      }
      .budget-table {
        font-size: 9px;
        margin-left: auto;
        margin-right: auto;
      }
      .budget-table th:nth-child(1) { width: 23%; }
      .budget-table th:nth-child(2) { width: 20%; }
      .budget-table th:nth-child(3) { width: 9%; }
      .budget-table th:nth-child(4) { width: 12%; }
      .budget-table th:nth-child(5) { width: 12%; }
      .budget-table th:nth-child(6) { width: 12%; }
      .budget-table th:nth-child(7) { width: 12%; }
      .budget-table td {
        height: 22px;
      }
      .compact-budget {
        padding: 5mm;
      }
      .compact-budget .section-title {
        margin: 5px 0 3px;
        padding: 3px 5px;
      }
      .compact-budget .budget-table {
        font-size: 8px;
      }
      .compact-budget th,
      .compact-budget td {
        padding: 2px 3px;
      }
      .compact-budget .budget-table td {
        height: 17px;
      }
      .dense-budget {
        padding: 4mm;
      }
      .dense-budget .header {
        padding-bottom: 5px;
      }
      .dense-budget .budget-table {
        font-size: 7.4px;
      }
      .dense-budget .budget-table td {
        height: 14px;
      }
      .dense-budget .signature-section {
        padding-top: 5px;
      }
      .dense-budget .signature-box {
        min-height: 34px;
      }
      .total-row td {
        color: #14507d;
        font-weight: 800;
        background: #e8f2fa;
      }
      .budget-total {
        color: #fff;
        font-weight: 800;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .validity .budget-total {
        display: inline-block;
        margin-top: 3px;
        padding: 2px 4px;
      }
      .budget-low {
        background: #2e7d32;
      }
      .budget-medium {
        background: #1565c0;
      }
      .budget-high {
        background: #303f9f;
      }
      .budget-very-high {
        background: #b3261e;
      }
      .total-row td.budget-low {
        background: #2e7d32;
        color: #fff;
      }
      .total-row td.budget-medium {
        background: #1565c0;
        color: #fff;
      }
      .total-row td.budget-high {
        background: #303f9f;
        color: #fff;
      }
      .total-row td.budget-very-high {
        background: #b3261e;
        color: #fff;
      }
      .conditional-meal-money {
        background: #6f42c1;
        color: #fff;
        font-weight: 800;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .total-label {
        text-align: left;
      }
      .dot-line {
        display: block;
        min-height: 14px;
        border-bottom: 1px dotted #333;
      }
      .signature-section {
        margin-top: auto;
        padding-top: 9px;
        break-inside: avoid;
      }
      .signature-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .signature-card {
        border: 1px solid #4b4b4b;
        padding: 5px;
      }
      .signature-card p {
        margin: 0 0 4px;
        font-weight: 800;
      }
      .signature-box {
        min-height: 48px;
        background:
          linear-gradient(#fff, #fff),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 15px,
            #ededed 16px
          );
      }
    </style>
  </head>
  <body>
    ${printBody}
  </body>
</html>
  `;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  placeholder = '',
  validationKey,
  error,
  maxLength,
  hint,
  inputMode,
  pattern,
}) {
  const id = label.toLowerCase().replaceAll(' ', '-');
  return (
    <label
      className={`field ${error ? 'field-error' : ''}`}
      data-validation-key={validationKey}
      htmlFor={id}
    >
      <span>{label}</span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : undefined}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          pattern={pattern}
          aria-invalid={error ? 'true' : undefined}
        />
      )}
      {hint && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error-message">{error}</small>}
    </label>
  );
}

function DateField({ label, value, onChange, validationKey, error }) {
  const id = label.toLowerCase().replaceAll(' ', '-');
  const displayValue = value ? formatDateInWords(value) : '';

  return (
    <label
      className={`field date-field ${error ? 'field-error' : ''}`}
      data-validation-key={validationKey}
      htmlFor={id}
    >
      <span>{label}</span>
      <span className="date-picker-shell">
        <span className={`date-display ${displayValue ? '' : 'placeholder'}`}>
          <span>{displayValue || 'Choisir une date'}</span>
          <span className="date-action">{displayValue ? 'Modifier' : 'Sélectionner'}</span>
        </span>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          aria-invalid={error ? 'true' : undefined}
        />
      </span>
      {error && <small className="field-error-message">{error}</small>}
    </label>
  );
}

function CheckboxGrid({ options, selected, onToggle }) {
  return (
    <div className="checkbox-grid">
      {options.map((option) => (
        <label key={option} className="check-tile">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(loadForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPrintSummary, setShowPrintSummary] = useState(false);
  const [showHome, setShowHome] = useState(hasSavedForm);
  const [homeMessage, setHomeMessage] = useState(initialHomeMessage);
  const [newFormStarted, setNewFormStarted] = useState(false);
  const [oldFormAccepted, setOldFormAccepted] = useState(false);
  const showHomeRef = useRef(showHome);
  const formRef = useRef(form);
  const wasHiddenRef = useRef(false);
  const formHasContent = hasMeaningfulForm(form);

  useEffect(() => {
    showHomeRef.current = showHome;
  }, [showHome]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (formHasContent) {
      const now = new Date().toISOString();
      const currentMeta = readStorageMeta();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      localStorage.setItem(
        STORAGE_META_KEY,
        JSON.stringify({
          createdAt: currentMeta.createdAt || now,
          updatedAt: now,
        }),
      );
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
  }, [form, formHasContent]);

  useEffect(() => {
    if (showHome || !formHasContent) return undefined;

    let timeoutId;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        returnToHome(
          Object.keys(validateForm(form)).length === 0
            ? 'Cette fiche semble complète.'
            : 'Pause longue. Choisis avant de continuer.',
        );
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'input'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, true));
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer, true));
    };
  }, [form, formHasContent, showHome]);

  useEffect(() => {
    const returnFromPause = () => {
      if (showHomeRef.current || !hasMeaningfulForm(formRef.current)) return;
      returnToHome(
        Object.keys(validateForm(formRef.current)).length === 0
          ? 'Cette fiche semble complète.'
          : "L'application était en pause.",
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
        return;
      }
      if (!wasHiddenRef.current) return;
      wasHiddenRef.current = false;
      returnFromPause();
    };

    const handleFocus = () => {
      if (!wasHiddenRef.current) return;
      wasHiddenRef.current = false;
      returnFromPause();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (showHome || oldFormAccepted || !formHasContent) return undefined;

    const checkOldForm = () => {
      const meta = readStorageMeta();
      const createdDate = dateInputValueFromIso(meta.createdAt);
      if (!isBeforeToday(createdDate || form.requestDate)) return;
      returnToHome('Cette fiche est ancienne.');
    };

    const intervalId = window.setInterval(checkOldForm, 60 * 1000);
    checkOldForm();

    return () => window.clearInterval(intervalId);
  }, [form, formHasContent, oldFormAccepted, showHome]);

  useEffect(() => {
    window.history.replaceState({ screen: 'fiche-projet' }, '');
  }, []);

  useEffect(() => {
    if (showHome || !formHasContent) return undefined;

    window.history.pushState({ screen: 'formulaire' }, '');
    const handlePopState = () => {
      if (showHomeRef.current || !hasMeaningfulForm(formRef.current)) return;
      returnToHome('Retour à l’accueil.');
      window.history.pushState({ screen: 'accueil' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [formHasContent, showHome]);

  const totals = useMemo(() => {
    return form.needs.reduce(
      (acc, need) => {
        const quantity = quantityForNeed(need);
        const estimated = costAmountForNeed(need, 'estimatedCost') * quantity;
        const actual = costAmountForNeed(need, 'actualCost') * quantity;
        return {
          estimated: acc.estimated + estimated,
          actual: acc.actual + actual,
        };
      },
      { estimated: 0, actual: 0 },
    );
  }, [form.needs]);
  const projectedCost = projectedThreeMonthCost(totals, form.repetitions);
  const hasRepetitions = hasRepetitionsValue(form.repetitions);
  const referenceCost = hasRepetitions ? projectedCost : totals.estimated;
  const decisionLabel = budgetDecisionLabel(referenceCost);
  const categoriesSummaryText =
    [...form.categories, form.categoryOther].filter(Boolean).join(', ') || 'Non renseigné';
  const goalsSummaryText =
    form.categories.includes('Achat matériel') && form.goals.length === 0
      ? 'Non requis'
      : [...form.goals, form.goalOther].filter(Boolean).join(', ') || 'Non renseigné';
  const printSummaryErrors = useMemo(
    () => (showPrintSummary ? validateForm(form) : {}),
    [form, showPrintSummary],
  );
  const missingFieldMessages = Object.values(printSummaryErrors);
  const visibleNeedGroups = useMemo(
    () => groupedNeeds(form.needs, form.mealLocation),
    [form.needs, form.mealLocation],
  );
  const hasPrintableNeed = formHasPrintableNeed(form);

  function clearValidationErrors(...keys) {
    setValidationErrors((current) => {
      if (!keys.some((key) => current[key])) return current;
      const next = { ...current };
      keys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  }

  function updateField(key, value) {
    setForm((current) => {
      if (key === 'repetitions') {
        return { ...current, repetitions: digitsOnly(value) };
      }
      if (key === 'participantsCount') {
        const nextValue = digitsOnly(value);
        return {
          ...current,
          participantsCount: nextValue,
          needs:
            current.mealLocation === MEAL_LOCATION_NONE
              ? current.needs
              : withSyncedMealQuantity(current.needs, nextValue, current.participantsCount),
        };
      }
      if (key === 'comments') {
        return { ...current, comments: limitText(value, COMMENTS_MAX_LENGTH) };
      }
      return { ...current, [key]: value };
    });
    clearValidationErrors(key);
  }

  function updateMealLocation(value) {
    setForm((current) => ({
      ...current,
      mealLocation: value,
      needs: current.needs.map((need) =>
        need.label === 'Repas'
          ? {
              ...need,
              quantity:
                value !== MEAL_LOCATION_NONE && isBlank(need.quantity)
                  ? current.participantsCount
                  : need.quantity,
              estimatedCost: mealPrice(value),
            }
          : need,
      ),
    }));
  }

  function toggleList(key, value) {
    setForm((current) => {
      const list = current[key];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...current, [key]: next };
    });
    clearValidationErrors(
      key,
      key === 'categories' ? 'categoryOther' : '',
      key === 'goals' ? 'goalOther' : '',
    );
  }

  function updateNeed(index, key, value) {
    const nextValue = key === 'quantity' ? digitsOnly(value) : value;
    setForm((current) => ({
      ...current,
      needs: normalizeManualRepeatableNeeds(
        current.needs.map((need, needIndex) =>
          needIndex === index ? { ...need, [key]: nextValue } : need,
        ),
      ),
    }));
    clearValidationErrors(
      `need-${index}-quantity`,
      `need-${index}-estimatedCost`,
      `need-${index}-detail`,
      'needs',
    );
  }

  function addPaidActivityNeed() {
    setForm((current) => {
      const nextNeeds = [...current.needs];
      const lastActivityIndex = nextNeeds.findLastIndex(
        (need) => need.label === REPEATABLE_PAID_ACTIVITY_LABEL,
      );
      const insertIndex = lastActivityIndex >= 0 ? lastActivityIndex + 1 : 0;
      nextNeeds.splice(insertIndex, 0, createNeed(REPEATABLE_PAID_ACTIVITY_LABEL));
      return { ...current, needs: nextNeeds };
    });
  }

  function removePaidActivityNeed(index) {
    setForm((current) => {
      const nextNeeds = current.needs.filter((_, needIndex) => needIndex !== index);
      const hasPaidActivity = nextNeeds.some(
        (need) => need.label === REPEATABLE_PAID_ACTIVITY_LABEL,
      );
      if (!hasPaidActivity) {
        const insertIndex = nextNeeds.findIndex((need) => need.label === 'Intervenant');
        nextNeeds.splice(
          insertIndex >= 0 ? insertIndex : 0,
          0,
          createNeed(REPEATABLE_PAID_ACTIVITY_LABEL),
        );
      }
      return { ...current, needs: nextNeeds };
    });
  }

  function removeManualRepeatableNeed(index, label) {
    setForm((current) => {
      const nextNeeds = current.needs.filter((_, needIndex) => needIndex !== index);
      if (!nextNeeds.some((need) => need.label === label)) {
        const defaultIndex = defaultNeeds.findIndex((need) => need.label === label);
        const insertIndex = nextNeeds.findIndex((need) => {
          const needDefaultIndex = defaultNeeds.findIndex(
            (defaultNeed) => defaultNeed.label === need.label,
          );
          return needDefaultIndex > defaultIndex;
        });
        nextNeeds.splice(insertIndex >= 0 ? insertIndex : nextNeeds.length, 0, createNeed(label));
      }
      return { ...current, needs: nextNeeds };
    });
  }

  function addManualRepeatableNeed(label) {
    setForm((current) => {
      const nextNeeds = [...current.needs];
      const lastMatchingIndex = nextNeeds.findLastIndex((need) => need.label === label);
      const defaultIndex = defaultNeeds.findIndex((need) => need.label === label);
      const nextDefaultIndex = nextNeeds.findIndex((need) => {
        const needDefaultIndex = defaultNeeds.findIndex(
          (defaultNeed) => defaultNeed.label === need.label,
        );
        return needDefaultIndex > defaultIndex;
      });
      const insertIndex =
        lastMatchingIndex >= 0
          ? lastMatchingIndex + 1
          : nextDefaultIndex >= 0
            ? nextDefaultIndex
            : nextNeeds.length;
      nextNeeds.splice(insertIndex, 0, createNeed(label));
      return { ...current, needs: nextNeeds };
    });
  }

  function renderNeedRow({
    need,
    index,
    displayLabel,
    isPaidActivity = false,
    canRemovePaidActivity = false,
    isRemovableManual = false,
  }) {
    const hasQuantityField = need.label !== 'Repas' || form.mealLocation !== MEAL_LOCATION_NONE;
    const showDetail =
      hasQuantityField &&
      (hasMinimumQuantityForDetail(need) ||
        String(need.detail || '').trim() !== '' ||
        String(need.quantity || '').trim() !== '' ||
        String(need.estimatedCost || '').trim() !== '');
    const hasCostField = hasEstimatedCostField(need);
    const canCancelPaidActivity = isPaidActivity && canRemovePaidActivity;
    const hasAction = canCancelPaidActivity || isRemovableManual;
    const rowClassName = [
      'need-row',
      hasCostField ? '' : 'no-cost',
      hasQuantityField ? '' : 'no-quantity',
      hasAction ? 'with-action' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={rowClassName}>
        <div
          className={`need-label ${validationErrors[`need-${index}-detail`] ? 'field-error' : ''}`}
          data-validation-key={`need-${index}-detail`}
        >
          <strong>
            {displayLabel}
            {need.label === LOANED_VEHICLE_LABEL ? ' *' : ''}
          </strong>
          {need.label === LOANED_VEHICLE_LABEL && (
            <span className="need-note">
              * Véhicule de la Ligue havraise : prévoir une assurance
            </span>
          )}
          {needNotes[need.label] && <span className="need-note">{needNotes[need.label]}</span>}
          {showDetail && (
            <input
              value={need.detail}
              onChange={(event) => updateNeed(index, 'detail', event.target.value)}
              placeholder="Précision"
              aria-invalid={validationErrors[`need-${index}-detail`] ? 'true' : undefined}
            />
          )}
          {validationErrors[`need-${index}-detail`] && (
            <small className="field-error-message">{validationErrors[`need-${index}-detail`]}</small>
          )}
        </div>
        {hasQuantityField && (
          <label
            className={`need-field ${validationErrors[`need-${index}-quantity`] ? 'field-error' : ''}`}
            data-validation-key={`need-${index}-quantity`}
          >
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={need.quantity}
              onChange={(event) => updateNeed(index, 'quantity', event.target.value)}
              placeholder={quantityPlaceholderForNeed(need)}
              aria-label={`${need.label} ${quantityPlaceholderForNeed(need)}`}
              aria-invalid={validationErrors[`need-${index}-quantity`] ? 'true' : undefined}
            />
            {validationErrors[`need-${index}-quantity`] && (
              <small className="field-error-message">{validationErrors[`need-${index}-quantity`]}</small>
            )}
          </label>
        )}
        {hasCostField && (
          <label
            className={`need-field ${validationErrors[`need-${index}-estimatedCost`] ? 'field-error' : ''}`}
            data-validation-key={`need-${index}-estimatedCost`}
          >
            <input
              inputMode="decimal"
              value={need.estimatedCost}
              onChange={(event) => updateNeed(index, 'estimatedCost', event.target.value)}
              placeholder={costPlaceholderForNeed(need)}
              readOnly={need.label === 'Repas'}
              className={
                need.label === 'Repas' && form.mealLocation === MEAL_LOCATION_OUTSIDE
                  ? 'conditional-meal-cost'
                  : ''
              }
              aria-label={`${need.label} prix`}
              aria-invalid={validationErrors[`need-${index}-estimatedCost`] ? 'true' : undefined}
            />
            {validationErrors[`need-${index}-estimatedCost`] && (
              <small className="field-error-message">
                {validationErrors[`need-${index}-estimatedCost`]}
              </small>
            )}
          </label>
        )}
        {canCancelPaidActivity && (
          <button
            type="button"
            className="remove-need-button"
            onClick={() => removePaidActivityNeed(index)}
            aria-label={`Enlever ${displayLabel}`}
          >
            Enlever
          </button>
        )}
        {isRemovableManual && (
          <button
            type="button"
            className="remove-need-button"
            onClick={() => removeManualRepeatableNeed(index, need.label)}
            aria-label={`Enlever ${displayLabel}`}
          >
            Enlever
          </button>
        )}
      </div>
    );
  }

  function resetForm() {
    const confirmed = window.confirm('Tout ce qui est écrit sera effacé. Continuer ?');
    if (!confirmed) return;
    startNewForm();
  }

  function startNewForm() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
    setForm(createInitialForm());
    setValidationErrors({});
    setShowPrintSummary(false);
    setHomeMessage('');
    setNewFormStarted(true);
    setOldFormAccepted(false);
    setShowHome(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueSavedForm() {
    setValidationErrors({});
    setShowPrintSummary(false);
    setHomeMessage('');
    setNewFormStarted(false);
    setOldFormAccepted(isSavedFormOld());
    setShowHome(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function returnToHome(message = 'Choisis avant de continuer.') {
    if (!hasMeaningfulForm(formRef.current)) return;
    setValidationErrors({});
    setShowPrintSummary(false);
    setHomeMessage(message);
    setNewFormStarted(false);
    setOldFormAccepted(false);
    setShowHome(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openPrintSummary() {
    const errors = validateForm(form);
    setValidationErrors(errors);
    setShowPrintSummary(true);
    window.setTimeout(() => {
      document.querySelector('[data-print-summary]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function correctPrintSummaryErrors() {
    setValidationErrors(printSummaryErrors);
    scrollToFirstValidationError(printSummaryErrors);
  }

  async function printForm() {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowPrintSummary(true);
      return;
    }

    if (totals.estimated <= 0 && !window.confirm('Le budget est à 0 €. Continuer ?')) {
      return;
    }

    setValidationErrors({});
    const html = buildPrintHtml(form, totals);
    try {
      if (Capacitor.isNativePlatform()) {
        await NativePrint.printHtml({ title: 'Fiche projet', html });
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        window.print();
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch {
      window.alert("L'impression n'a pas pu être lancée.");
    }
  }

  if (showHome) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <img className="app-logo" src={logoDataUrl} alt="Logo de l'application" />
          <div>
            <p className="eyebrow">Fiche projet</p>
            <h1>Accueil</h1>
          </div>
        </header>

        <section className="home-screen">
          <div className="home-title">
            <h2>Que veux-tu faire ?</h2>
            {homeMessage && <p className="home-message">{homeMessage}</p>}
            <p>Fiche en cours : {form.activityName || 'sans nom'}</p>
          </div>
          <div className="home-actions">
            <button type="button" className="home-choice continue" onClick={continueSavedForm}>
              <strong>Reprendre la fiche en cours</strong>
              <span>Je garde ce qui est déjà écrit.</span>
            </button>
            <button type="button" className="home-choice new-form" onClick={startNewForm}>
              <strong>Créer une nouvelle fiche</strong>
              <span>J'efface et je repars de zéro.</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <img className="app-logo" src={logoDataUrl} alt="Logo de l'application" />
        <div>
          <p className="eyebrow">Fiche projet</p>
          <h1>Demande d'activité</h1>
        </div>
        {formHasContent && (
          <button
            type="button"
            className="topbar-home-button secondary"
            onClick={() => returnToHome('Accueil. Choisis une action.')}
          >
            Accueil
          </button>
        )}
      </header>

      {newFormStarted && (
        <section className="new-form-banner">
          <strong>Nouvelle fiche</strong>
          <span>Tu peux commencer à remplir.</span>
        </section>
      )}

      <section className="notice">
        <label
          className={`commitment-check ${
            validationErrors.facebookCommitment ? 'commitment-error' : ''
          }`}
          data-validation-key="facebookCommitment"
        >
          <input
            type="checkbox"
            checked={form.facebookCommitment}
            onChange={(event) => updateField('facebookCommitment', event.target.checked)}
            aria-invalid={validationErrors.facebookCommitment ? 'true' : undefined}
          />
          Je m'engage à diffuser mon projet aux gemmeurs après validation.
        </label>
        {validationErrors.facebookCommitment && (
          <small className="field-error-message">{validationErrors.facebookCommitment}</small>
        )}
        <label
          className={`commitment-check ${
            validationErrors.receiptsCommitment ? 'commitment-error' : ''
          }`}
          data-validation-key="receiptsCommitment"
        >
          <input
            type="checkbox"
            checked={form.receiptsCommitment}
            onChange={(event) => updateField('receiptsCommitment', event.target.checked)}
            aria-invalid={validationErrors.receiptsCommitment ? 'true' : undefined}
          />
          Je m'engage à fournir les justificatifs de dépenses.
        </label>
        {validationErrors.receiptsCommitment && (
          <small className="field-error-message">{validationErrors.receiptsCommitment}</small>
        )}
      </section>

      <section className="form-section">
        <h2>Informations générales</h2>
        <div className="grid two">
          <DateField
            label="Date de demande"
            value={form.requestDate}
            onChange={(value) => updateField('requestDate', value)}
            validationKey="requestDate"
            error={validationErrors.requestDate}
          />
          <Field
            label="Nom du/des organisateur(s)"
            value={form.organizers}
            onChange={(value) => updateField('organizers', value)}
            validationKey="organizers"
            error={validationErrors.organizers}
          />
        </div>
        <Field
          label="Nom de l'activité"
          value={form.activityName}
          onChange={(value) => updateField('activityName', value)}
          validationKey="activityName"
          error={validationErrors.activityName}
        />
      </section>

      <section
        className={`form-section ${validationErrors.categories ? 'section-error' : ''}`}
        data-validation-key="categories"
      >
        <div className="section-title-row">
          <h2>Catégorie de l'activité</h2>
          {validationErrors.categories && (
            <small className="field-error-message">{validationErrors.categories}</small>
          )}
        </div>
        <CheckboxGrid
          options={categories}
          selected={form.categories}
          onToggle={(value) => toggleList('categories', value)}
        />
        {form.categories.includes('Autres') && (
          <Field
            label="Autre catégorie"
            value={form.categoryOther}
            onChange={(value) => updateField('categoryOther', value)}
            validationKey="categoryOther"
            error={validationErrors.categoryOther}
          />
        )}
      </section>

      <section
        className={`form-section ${validationErrors.goals ? 'section-error' : ''}`}
        data-validation-key="goals"
      >
        <div className="section-title-row">
          <h2>But de cette activité</h2>
          {validationErrors.goals && (
            <small className="field-error-message">{validationErrors.goals}</small>
          )}
        </div>
        <CheckboxGrid
          options={goals}
          selected={form.goals}
          onToggle={(value) => toggleList('goals', value)}
        />
        {form.goals.includes('Autres') && (
          <Field
            label="Autre but"
            value={form.goalOther}
            onChange={(value) => updateField('goalOther', value)}
            validationKey="goalOther"
            error={validationErrors.goalOther}
          />
        )}
      </section>

      <section className="form-section">
        <h2>Organisation</h2>
        <div className="grid two">
          <Field
            label="Lieu de l'activité"
            value={form.location}
            onChange={(value) => updateField('location', value)}
            validationKey="location"
            error={validationErrors.location}
          />
          <DateField
            label="1ère date de l'activité"
            value={form.firstDate}
            onChange={(value) => updateField('firstDate', value)}
            validationKey="firstDate"
            error={validationErrors.firstDate}
          />
          <Field
            label="Combien de fois sur 3 mois"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.repetitions}
            onChange={(value) => updateField('repetitions', value)}
            validationKey="repetitions"
            error={validationErrors.repetitions}
          />
          <Field
            label="Nombre de participants"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.participantsCount}
            onChange={(value) => updateField('participantsCount', value)}
            validationKey="participantsCount"
            error={validationErrors.participantsCount}
          />
        </div>
        <div className="meal-choice">
          <span>Tarif repas par personne</span>
          <div className="segmented-control" role="group" aria-label="Tarif repas par personne">
            <button
              type="button"
              className={form.mealLocation === MEAL_LOCATION_AGGLOMERATION ? 'active' : ''}
              onClick={() => updateMealLocation(MEAL_LOCATION_AGGLOMERATION)}
            >
              23 €
            </button>
            <button
              type="button"
              className={form.mealLocation === MEAL_LOCATION_OUTSIDE ? 'active conditional' : ''}
              onClick={() => updateMealLocation(MEAL_LOCATION_OUTSIDE)}
            >
              40 € *
            </button>
            <button
              type="button"
              className={form.mealLocation === MEAL_LOCATION_NONE ? 'active no-meal' : ''}
              onClick={() => updateMealLocation(MEAL_LOCATION_NONE)}
            >
              Pas de repas
            </button>
          </div>
          {form.mealLocation === MEAL_LOCATION_OUTSIDE && (
            <span className="meal-condition">* sous condition</span>
          )}
        </div>
        <Field
          label="Commentaires"
          value={form.comments}
          onChange={(value) => updateField('comments', value)}
          multiline
          maxLength={COMMENTS_MAX_LENGTH}
          hint={`${form.comments.length}/${COMMENTS_MAX_LENGTH} caractères`}
        />
      </section>

      <section className={`form-section ${validationErrors.needs ? 'section-error' : ''}`} data-validation-key="needs">
        <div className="section-heading">
          <h2>J'ai besoin de</h2>
          <div className="needs-heading-actions">
            <div className="totals">
              <span className={`budget-total ${budgetLevelClassName(totals.estimated)}`}>
                Prix estimé : {formatCurrency(totals.estimated)}
              </span>
              {hasRepetitions && (
                <span className={`budget-total ${budgetLevelClassName(projectedCost)}`}>
                  Total sur 3 mois : {formatCurrency(projectedCost)}
                </span>
              )}
            </div>
          </div>
        </div>
        {validationErrors.needs && (
          <small className="field-error-message section-error-message" data-validation-key="needs">
            {validationErrors.needs}
          </small>
        )}
        <div className="needs-list">
          {visibleNeedGroups.map((group) => {
            const groupNeeds = group.items;

            if (groupNeeds.length === 0) return null;

            const paidActivityIndexes = groupNeeds
              .filter(({ need }) => need.label === REPEATABLE_PAID_ACTIVITY_LABEL)
              .map(({ index }) => index);
            const lastPaidActivityIndex = paidActivityIndexes[paidActivityIndexes.length - 1];
            let paidActivityCount = 0;
            const groupNeedsWithDisplayLabels = groupNeeds.map(({ need, index }) => {
              if (need.label === REPEATABLE_PAID_ACTIVITY_LABEL) {
                paidActivityCount += 1;
                return {
                  need,
                  index,
                  displayLabel: displayLabelForRepeatedNeed(need, paidActivityCount),
                };
              }
              return { need, index, displayLabel: need.label };
            });

            return (
              <section className="need-group" key={group.title}>
                <div className="need-group-heading">
                  <h3>{group.title}</h3>
                </div>
                <div className="need-group-list">
                  {groupNeedsWithDisplayLabels.map(({ need, index, displayLabel }) => {
                    const isPaidActivity = need.label === REPEATABLE_PAID_ACTIVITY_LABEL;
                    const isManualRepeatable = MANUAL_REPEATABLE_LABELS.includes(need.label);
                    const matchingNeedCount = groupNeeds.filter(
                      ({ need: groupNeed }) => groupNeed.label === need.label,
                    ).length;
                    return (
                      <React.Fragment key={`${need.label}-${index}`}>
                        {renderNeedRow({
                          need,
                          index,
                          displayLabel,
                          isPaidActivity,
                          canRemovePaidActivity: isPaidActivity,
                          isRemovableManual: isManualRepeatable && matchingNeedCount > 1,
                        })}
                        {group.title === 'Activité' && index === lastPaidActivityIndex && (
                          <button
                            type="button"
                            className="add-need-button below-group"
                            onClick={addPaidActivityNeed}
                            aria-label="Ajouter une activité payante"
                          >
                            + Activité
                          </button>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {group.title === 'Matériel' && (
                    <button
                      type="button"
                      className="add-need-button below-group"
                      onClick={() => addManualRepeatableNeed(REPEATABLE_MATERIAL_LABEL)}
                      aria-label="Ajouter du matériel"
                    >
                      + Matériel
                    </button>
                  )}
                  {group.title === 'Autres' && (
                    <button
                      type="button"
                      className="add-need-button below-group"
                      onClick={() => addManualRepeatableNeed(REPEATABLE_OTHER_LABEL)}
                      aria-label="Ajouter un autre besoin"
                    >
                      + Autre
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {showPrintSummary && (
        <section className="form-section print-summary" data-print-summary>
          <div className="section-heading">
            <h2>Récapitulatif avant impression</h2>
            <div className="summary-heading-badges">
              {missingFieldMessages.length === 0 && (
                <span className="ready-badge">Fiche prête à imprimer</span>
              )}
              <span className={`budget-total ${budgetLevelClassName(referenceCost)}`}>
                Validation : {decisionLabel}
              </span>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-panel">
              <h3>Projet</h3>
              <dl>
                <div>
                  <dt>Activité</dt>
                  <dd>{form.activityName || 'Non renseigné'}</dd>
                </div>
                <div>
                  <dt>Organisateur(s)</dt>
                  <dd>{form.organizers || 'Non renseigné'}</dd>
                </div>
                <div>
                  <dt>Catégorie</dt>
                  <dd>{categoriesSummaryText}</dd>
                </div>
                <div>
                  <dt>But</dt>
                  <dd>{goalsSummaryText}</dd>
                </div>
                <div>
                  <dt>Lieu</dt>
                  <dd>{form.location || 'à définir'}</dd>
                </div>
                <div>
                  <dt>Date demande</dt>
                  <dd>{formatDateInWords(form.requestDate) || 'Non renseigné'}</dd>
                </div>
                <div>
                  <dt>1ère date</dt>
                  <dd>{isBlank(form.firstDate) ? 'à définir' : formatDateInWords(form.firstDate)}</dd>
                </div>
                <div>
                  <dt>Participants</dt>
                  <dd>{form.participantsCount || 'Non renseigné'}</dd>
                </div>
              </dl>
            </div>

            <div className="summary-panel summary-budget">
              <h3>Budget</h3>
              <dl>
                <div>
                  <dt>Prix estimé</dt>
                  <dd>{formatCurrency(totals.estimated)}</dd>
                </div>
                <div>
                  <dt>Besoins remplis</dt>
                  <dd>{hasPrintableNeed ? 'Oui' : 'Non'}</dd>
                </div>
                {hasRepetitions && (
                  <div>
                    <dt>Total sur 3 mois</dt>
                    <dd>{formatCurrency(projectedCost)}</dd>
                  </div>
                )}
                <div>
                  <dt>Niveau de validation</dt>
                  <dd>{decisionLabel}</dd>
                </div>
              </dl>
            </div>

            <div className="summary-panel summary-missing">
              <h3>Champs manquants</h3>
              {missingFieldMessages.length > 0 ? (
                <ul className="missing-list">
                  {missingFieldMessages.map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                </ul>
              ) : (
                <p className="summary-ok">Aucun champ obligatoire manquant.</p>
              )}
            </div>
          </div>

          <div className="summary-actions">
            <button type="button" className="secondary" onClick={() => setShowPrintSummary(false)}>
              Retour
            </button>
            {missingFieldMessages.length > 0 ? (
              <button type="button" onClick={correctPrintSummaryErrors}>
                Corriger les champs
              </button>
            ) : (
              <button type="button" onClick={printForm}>
                Confirmer l'impression
              </button>
            )}
          </div>
        </section>
      )}

      {!showPrintSummary && (
        <footer className="actions">
          <button type="button" className="secondary" onClick={resetForm}>
            Nouvelle fiche
          </button>
          <button type="button" onClick={openPrintSummary}>
            Imprimer
          </button>
        </footer>
      )}
    </main>
  );
}
