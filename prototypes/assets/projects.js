const projectList = document.querySelector("#project-list");
const projectsLoading = document.querySelector("#projects-loading");
const projectImages = {
  "project-b4joinacompany": "assets/b4joinacompany.png",
  "project-devtools": "assets/devtools.png",
  "project-postcraft": "assets/postcraft.png",
};

function cleanProjectText(value = "") {
  return value.replaceAll("**", "").replaceAll("\u2014", "-").replaceAll("\u2013", "-");
}

function escapeProjectText(value = "") {
  return cleanProjectText(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

function projectLink(url, label, icon) {
  if (!url || !url.startsWith("https://")) return "";
  return `<a href="${escapeProjectText(url)}" class="focus-ring inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-ink-700 transition-colors hover:text-ink-950 hover:underline active:translate-y-px dark:text-ink-200 dark:hover:text-ink-50">${label}<i class="ph ${icon}" aria-hidden="true"></i></a>`;
}

function projectType(project) {
  if (project.type === "extension") return { label: "Browser extension", icon: "ph-browser" };
  if (project.type === "package") return { label: "Open-source package", icon: "ph-package" };
  return { label: "Web application", icon: "ph-browser" };
}

function projectVisual(project, image) {
  const type = projectType(project);
  if (!image) {
    return `<div class="grid aspect-[16/10] place-items-center rounded-lg border border-ink-200 bg-ink-100 text-center dark:border-white/10 dark:bg-ink-950">
      <div class="px-6 text-ink-500 dark:text-ink-400">
        <i class="ph ${type.icon} text-4xl" aria-hidden="true"></i>
        <p class="mt-3 text-xs font-medium">Project preview unavailable</p>
      </div>
    </div>`;
  }

  const preview = `<img src="${image}" alt="${escapeProjectText(project.title)} interface" loading="lazy" width="1600" height="1000" class="aspect-[16/10] w-full rounded-lg border border-ink-200 object-cover object-top transition-transform duration-300 group-hover:scale-[1.015] dark:border-white/10" />`;
  if (!project.liveUrl) return preview;
  return `<a href="${escapeProjectText(project.liveUrl)}" class="focus-ring block overflow-hidden rounded-lg" aria-label="Open ${escapeProjectText(project.title)} live site">${preview}</a>`;
}

try {
  const projects = window.portfolioProjects;
  if (!Array.isArray(projects)) throw new Error("Project data is unavailable.");

    projectList.innerHTML = projects.map((project) => {
      const image = projectImages[project.id];
      const type = projectType(project);
      const technologies = project.technologies.slice(0, 5).map((technology) => `<li class="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-xs text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-400">${escapeProjectText(technology)}</li>`).join("");
      const remainingTechnologies = project.technologies.length - 5;
      const links = [
        projectLink(project.liveUrl, "Live site", "ph-arrow-up-right"),
        projectLink(project.githubUrl, "Source", "ph-github-logo"),
        projectLink(project.npmUrl, "npm", "ph-package"),
        projectLink(project.releaseUrl, "Release", "ph-download-simple"),
      ].filter(Boolean).join("");
      return `<article data-filter-item data-filter-tags="${escapeProjectText(project.type)}" class="group grid overflow-hidden rounded-xl border border-ink-200 bg-white transition-colors hover:border-ink-400 lg:grid-cols-[1.08fr_0.92fr] dark:border-white/10 dark:bg-ink-900 dark:hover:border-white/25">
        <div class="border-b border-ink-200 bg-ink-100/70 p-3 sm:p-4 lg:border-b-0 lg:border-r dark:border-white/10 dark:bg-ink-950/60">
          ${projectVisual(project, image)}
        </div>
        <div class="flex min-w-0 flex-col p-5 sm:p-6">
          <p class="flex items-center gap-1.5 text-xs font-medium text-ink-500 dark:text-ink-400"><i class="ph ${type.icon}" aria-hidden="true"></i>${type.label}</p>
          <h2 class="mt-2 text-lg font-semibold leading-snug tracking-tight">${escapeProjectText(project.title)}</h2>
          <p class="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400">${escapeProjectText(project.description)}</p>
          <ul class="mt-4 flex flex-wrap gap-2" aria-label="Technologies used">${technologies}${remainingTechnologies > 0 ? `<li class="px-1 py-1 text-xs font-medium text-ink-500 dark:text-ink-400">+${remainingTechnologies} more</li>` : ""}</ul>
          <div class="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">${links || '<span class="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400"><i class="ph ph-lock-key" aria-hidden="true"></i>Private work</span>'}</div>
        </div>
      </article>`;
    }).join("");
    projectsLoading.hidden = true;
    const status = document.querySelector("[data-filter-status]");
    if (status) status.textContent = `${projects.length} projects shown`;
} catch {
  projectsLoading.textContent = "Projects could not be loaded. Please refresh the page.";
  projectsLoading.classList.add("text-red-700", "dark:text-red-300");
}
