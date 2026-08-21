import ArrowDownIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowDown01Icon.js"
import ArrowLeftIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowLeft02Icon.js"
import ArrowRightIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowRight02Icon.js"
import ArrowUpIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp02Icon.js"
import CommentIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/MessageCircleMoreIcon.js"
import FileSearchIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/FileSearchIcon.js"
import FilterIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/FilterIcon.js"
import MailIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/Mail01Icon.js"
import MoonIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/Moon02Icon.js"
import SearchIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/Search01Icon.js"
import SendIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/SendIcon.js"
import ShareIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/Share08Icon.js"
import SunIcon from "../../node_modules/@hugeicons/core-free-icons/dist/esm/Sun03Icon.js"

const icons = {
  "arrow-down": ArrowDownIcon,
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-up": ArrowUpIcon,
  comment: CommentIcon,
  "file-search": FileSearchIcon,
  filter: FilterIcon,
  mail: MailIcon,
  moon: MoonIcon,
  search: SearchIcon,
  send: SendIcon,
  share: ShareIcon,
  sun: SunIcon,
}

const namespace = "http://www.w3.org/2000/svg"

function attributeName(name) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function renderIcon(host) {
  const icon = icons[host.dataset.hugeicon]
  if (!icon) return

  const svg = document.createElementNS(namespace, "svg")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("focusable", "false")
  svg.setAttribute("aria-hidden", "true")

  icon.forEach(([tag, attributes]) => {
    const child = document.createElementNS(namespace, tag)
    Object.entries(attributes).forEach(([name, value]) => {
      if (name !== "key") child.setAttribute(attributeName(name), String(value))
    })
    svg.append(child)
  })

  host.replaceChildren(svg)
}

function renderHugeicons(root = document) {
  if (root.matches?.("[data-hugeicon]")) renderIcon(root)
  root.querySelectorAll?.("[data-hugeicon]").forEach(renderIcon)
}

window.renderHugeicons = renderHugeicons
renderHugeicons()
