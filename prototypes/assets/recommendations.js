const recommendationList = document.querySelector("#recommendation-list");
const recommendationsLoading = document.querySelector("#recommendations-loading");

function cleanRecommendationText(value = "") {
  return value.replaceAll("\u2014", "-").replaceAll("\u2013", "-");
}

function escapeRecommendationText(value = "") {
  return cleanRecommendationText(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

try {
  const recommendations = window.portfolioRecommendations;
  if (!Array.isArray(recommendations)) throw new Error("Recommendation data is unavailable.");

    recommendationList.innerHTML = recommendations.map((recommendation) => {
      const year = recommendation.date.match(/\b\d{4}\b/)?.[0] || "";
      return `<article data-filter-item data-filter-tags="${year}" class="rounded-xl border border-ink-200 bg-white p-4 dark:border-white/10 dark:bg-ink-900 sm:p-5">
      <header>
        <h3 class="font-semibold leading-snug">${escapeRecommendationText(recommendation.name)}</h3>
        <p class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400 sm:text-sm">
            <span class="inline-flex items-center gap-1.5"><i class="ph ph-users-three" aria-hidden="true"></i>${escapeRecommendationText(recommendation.relationship)}</span>
            <span class="inline-flex items-center gap-1.5"><i class="ph ph-calendar-blank" aria-hidden="true"></i>${escapeRecommendationText(recommendation.date)}</span>
        </p>
      </header>
      <div class="mt-5 grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
        <div class="pt-0.5">
          <p class="text-xs font-medium text-ink-500 dark:text-ink-400">Role</p>
          <p class="mt-1 text-sm font-semibold leading-relaxed">${escapeRecommendationText(recommendation.role)}</p>
        </div>
        <blockquote class="border-l-2 border-ink-400 pl-4 text-sm leading-relaxed text-ink-500 dark:border-ink-500 dark:text-ink-400">“${escapeRecommendationText(recommendation.text)}”</blockquote>
      </div>
    </article>`;
    }).join("");
    recommendationsLoading.hidden = true;
    const filterStatus = document.querySelector("[data-filter-group][data-filter-label='recommendation'] [data-filter-status]");
    if (filterStatus) filterStatus.textContent = `${recommendations.length} recommendations shown`;
} catch {
  recommendationsLoading.textContent = "Recommendations could not be loaded. Please refresh the page.";
  recommendationsLoading.classList.add("text-red-700", "dark:text-red-300");
}
