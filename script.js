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
  societe: ({ q }) =>
  `https://www.societe.com/cgi-bin/search?${new URLSearchParams({ champs: q }).toString()}`,
  pappers: ({ q }) => `https://www.pappers.fr/recherche?q=${encodeURIComponent(q)}`,
 
  annuaireAdm: ({ q, loc }) =>
    `https://www.google.com/search?q=${encodeURIComponent(
      "site:annuaire-entreprises.data.gouv.fr " + q + (loc ? " " + loc : "")
    )}`,
  bodacc: ({ q, loc }) =>
    `https://www.google.com/search?q=${encodeURIComponent(
      "site:bodacc.fr " + q + (loc ? " " + loc : "")
    )}`,

  // Réseaux (dans une futur maj)
 /*  linkedin: ({ q, loc }) =>
    `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
      q + (loc ? " " + loc : "")
    )}`,
  facebook: ({ q, loc }) =>
    `https://www.facebook.com/search/top?q=${encodeURIComponent(q + (loc ? " " + loc : ""))}`,
  twitter: ({ q, loc }) =>
    `https://twitter.com/search?q=${encodeURIComponent(q + (loc ? " " + loc : ""))}&src=typed_query`, */
};

// ---------- Lecture du formulaire ----------
function payload() {
  const q = $("#q").value.trim();
  const loc = $("#loc").value.trim();
  if (!q) {
    alert("Entrez un nom ou une raison sociale.");
    return null;
  }

  return { q, loc,};
}

// ---------- Gestion des sites cochés ----------
function selectedSites() {
  return $$(".site")
    .filter(c => c.checked)
    .map(c => c.dataset.key);
}

// ---------- Construction des URLs ----------
function buildUrls() {
  const data = payload();
  if (!data) return [];
  const picks = selectedSites();
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

// ---------- écouteur d'événements ----------
function wireEvents() {
  $("#go").addEventListener("click", () => {
    const urls = buildUrls();
    if (urls.length === 0) return;
    openAll(urls);
  });

  $("#copy").addEventListener("click", async () => {
    const urls = buildUrls();
    if (urls.length === 0) return;
    const text = urls.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      alert(`✅ ${urls.length} URL copiées dans le presse-papiers.`);
    } catch {
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
  wireEvents();
});
