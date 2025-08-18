// ---------- Helpers ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---------- Builders d'URL par site ----------
const builders = {
  // Moteurs généraux
  google: ({ q, loc }) =>
    `https://www.google.com/search?q=${encodeURIComponent(q + (loc ? " " + loc : ""))}`,
  maps: ({ q, loc }) =>
    `https://www.google.com/maps/search/${encodeURIComponent(q + (loc ? " " + loc : ""))}`,

  // Annuaires
  pjPro: ({ q, loc }) =>
    `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(q)}${
      loc ? "&ou=" + encodeURIComponent(loc) : ""
    }&univers=pagesjaunes`,
  pjBlanches: ({ q, loc }) =>
    `https://www.pagesjaunes.fr/pagesblanches/recherche?quoiqui=${encodeURIComponent(q)}${
      loc ? "&ou=" + encodeURIComponent(loc) : ""
    }&univers=pagesblanches`,

  // Registres / légal
  societe: ({ q }) => `https://www.societe.com/cgi-bin/search?champs=${encodeURIComponent(q)}`,
  pappers: ({ q }) => `https://www.pappers.fr/recherche?q=${encodeURIComponent(q)}`,
  // Interfaces pouvant changer → on passe par Google ciblé
  annuaireAdm: ({ q, loc }) =>
    `https://www.google.com/search?q=${encodeURIComponent(
      "site:annuaire-entreprises.data.gouv.fr " + q + (loc ? " " + loc : "")
    )}`,
  bodacc: ({ q, loc }) =>
    `https://www.google.com/search?q=${encodeURIComponent(
      "site:bodacc.fr " + q + (loc ? " " + loc : "")
    )}`,

  // Réseaux
  linkedin: ({ q, loc }) =>
    `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
      q + (loc ? " " + loc : "")
    )}`,
  facebook: ({ q, loc }) =>
    `https://www.facebook.com/search/top?q=${encodeURIComponent(q + (loc ? " " + loc : ""))}`,
  twitter: ({ q, loc }) =>
    `https://twitter.com/search?q=${encodeURIComponent(q + (loc ? " " + loc : ""))}&src=typed_query`,
};

// ---------- Détection SIREN/SIRET ----------
function looksLikeSirenOrSiret(txt) {
  const digits = (txt || "").replace(/\D/g, "");
  return digits.length === 9 || digits.length === 14;
}

// ---------- Lecture du formulaire ----------
function payload() {
  const q = $("#q").value.trim();
  const loc = $("#loc").value.trim();
  const type = $$('input[name="type"]').find(r => r.checked)?.value || "auto";
  if (!q) {
    alert("Entrez un nom ou une raison sociale.");
    return null;
  }
  // Suggestions auto selon le contexte
  const suggested = new Set();
  if (type === "societe" || looksLikeSirenOrSiret(q)) {
    suggested.add("societe");
    suggested.add("pappers");
  }
  if (type === "personne") {
    suggested.add("pjBlanches");
  }
  return { q, loc, type, suggested };
}

// ---------- Gestion des sites cochés ----------
function selectedSites(suggested) {
  const picks = $$(".site")
    .filter(c => c.checked)
    .map(c => c.dataset.key);
  // S'assurer que les suggestions sont incluses
  suggested.forEach(k => {
    if (!picks.includes(k)) picks.unshift(k);
  });
  return picks;
}

// ---------- Construction des URLs ----------
function buildUrls() {
  const data = payload();
  if (!data) return [];
  const picks = selectedSites(data.suggested);
  return picks
    .map(k => (builders[k] ? builders[k]({ q: data.q, loc: data.loc }) : null))
    .filter(Boolean);
}

// ---------- Ouverture des onglets ----------
function openAll(urls) {
  const progressive = $("#stagger").checked;
  const step = progressive ? 220 : 0; // léger délai pour éviter certains bloqueurs
  urls.forEach((u, i) => setTimeout(() => window.open(u, "_blank", "noopener"), i * step));
}

// ---------- Persistance locale ----------
function restorePrefs() {
  const q = localStorage.getItem("mr_q");
  if (q) $("#q").value = q;
  const l = localStorage.getItem("mr_loc");
  if (l) $("#loc").value = l;
  try {
    const sites = JSON.parse(localStorage.getItem("mr_sites") || "[]");
    sites.forEach(({ k, v }) => {
      const el = $(`.site[data-key="${k}"]`);
      if (el) el.checked = !!v;
    });
  } catch (e) {
    // ignore
  }
}

function savePrefs() {
  localStorage.setItem("mr_q", $("#q").value);
  localStorage.setItem("mr_loc", $("#loc").value);
  localStorage.setItem(
    "mr_sites",
    JSON.stringify($$(".site").map(c => ({ k: c.dataset.key, v: c.checked })))
  );
}

// ---------- Wire-up des événements ----------
function wireEvents() {
  $("#go").addEventListener("click", () => {
    const urls = buildUrls();
    if (urls.length === 0) return;
    openAll(urls);
    savePrefs();
  });

  $("#copy").addEventListener("click", async () => {
    const urls = buildUrls();
    if (urls.length === 0) return;
    const text = urls.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      alert(`✅ ${urls.length} URL copiées dans le presse-papiers.`);
    } catch {
      // fallback si clipboard non dispo
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert(`✅ ${urls.length} URL copiées (fallback).`);
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && (e.target.id === "q" || e.target.id === "loc")) $("#go").click();
  });
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  restorePrefs();
  wireEvents();
});
