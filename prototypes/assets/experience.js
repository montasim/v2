const experienceList = document.querySelector("#experience-list")

const companyDetails = {
  "MyMedicalHub International Ltd.": {
    logo: "../../public/images/organizations/mymedicalhub.png",
    period: "Sep 2022 - Present",
    location: "Mohakhali, Dhaka, Bangladesh",
  },
  "Multiversal Software Ltd.": {
    logo: "../../public/images/organizations/multiversal.jpg",
  },
  "Disabled Rehabilitation and Research Association (DRRA)": {
    logo: "../../public/images/organizations/drra.jpg",
    period: "Dec 2021 - Aug 2022",
    location: "Ershadnagar, Tongi, Gazipur, Dhaka, Bangladesh",
  },
  "Codez Info Tech.": {
    logo: "../../public/images/organizations/codez.png",
  },
}

function createElement(tag, className, text) {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text) element.textContent = text
  return element
}

function createLogo(company, large = false) {
  const image = document.createElement("img")
  image.src = companyDetails[company]?.logo || "../../public/images/logo.png"
  image.alt = ""
  image.width = large ? 48 : 36
  image.height = large ? 48 : 36
  image.className = `${large ? "size-12" : "mt-0.5 size-9"} shrink-0 rounded-md object-cover`
  return image
}

function createMetadata(values) {
  const metadata = createElement(
    "p",
    "mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500 dark:text-ink-400"
  )
  values.filter(Boolean).forEach((value) => {
    metadata.append(createElement("span", "", value))
  })
  return metadata
}

function roleData(article) {
  const columns = article.children
  const details = columns[0]
  const content = columns[1]
  return {
    period: details.children[0]?.textContent.trim() || "",
    location: details.children[1]?.textContent.trim() || "",
    role: content.querySelector("h2")?.textContent.trim() || "",
    company: content.querySelector("h2 + p")?.textContent.trim() || "",
    description: content.querySelector("h2 + p + p"),
    technologies: content.querySelector("ul"),
  }
}

function createRole(role) {
  const item = createElement("li")
  item.append(createElement("h3", "text-sm font-semibold", role.role))
  item.append(
    createElement(
      "p",
      "mt-0.5 text-xs text-ink-500 dark:text-ink-400",
      role.period
    )
  )
  role.description.className =
    "mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400"
  role.technologies.className = "mt-3 flex flex-wrap gap-2"
  role.technologies.setAttribute(
    "aria-label",
    `Technologies used as ${role.role}`
  )
  item.append(role.description, role.technologies)
  return item
}

function createCompanyCard(company, roles) {
  const grouped = roles.length > 1
  const card = createElement(
    "article",
    "rounded-xl border border-ink-200 bg-white p-4 dark:border-white/10 dark:bg-ink-900 sm:p-5"
  )
  const header = createElement("header", "flex items-start gap-3")
  header.append(createLogo(company, grouped))

  const heading = createElement("div", "min-w-0")
  if (grouped) {
    heading.append(createElement("h2", "font-semibold", company))
    const details = companyDetails[company]
    heading.append(createMetadata([details?.period, details?.location]))
  } else {
    const role = roles[0]
    heading.append(createElement("h2", "text-sm font-semibold", role.role))
    heading.append(createMetadata([company, role.period, role.location]))
  }
  header.append(heading)
  card.append(header)

  if (grouped) {
    const timeline = createElement("ol", "role-timeline mt-5 ml-5 space-y-5")
    timeline.setAttribute("aria-label", `Roles at ${company}`)
    roles.forEach((role) => timeline.append(createRole(role)))
    card.append(timeline)
  } else {
    const role = roles[0]
    role.description.className =
      "mt-4 text-sm leading-relaxed text-ink-500 dark:text-ink-400"
    role.technologies.className = "mt-3 flex flex-wrap gap-2"
    role.technologies.setAttribute(
      "aria-label",
      `Technologies used as ${role.role}`
    )
    card.append(role.description, role.technologies)
  }

  return card
}

if (experienceList) {
  const roles = Array.from(experienceList.querySelectorAll(":scope > article")).map(
    roleData
  )
  const companies = new Map()
  roles.forEach((role) => {
    const companyRoles = companies.get(role.company) || []
    companyRoles.push(role)
    companies.set(role.company, companyRoles)
  })

  experienceList.replaceChildren(
    ...Array.from(companies, ([company, companyRoles]) =>
      createCompanyCard(company, companyRoles)
    )
  )
}
