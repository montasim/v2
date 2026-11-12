// The public site scrolls inside #page-scroll, below the header, so the scrollbar starts under the
// navbar. The dashboard (and tests) have no such element and keep scrolling the window.
export const pageScrollId = "page-scroll"

function pageScroller() {
  return document.getElementById(pageScrollId)
}

export function getPageScrollTop() {
  return pageScroller()?.scrollTop ?? window.scrollY
}

/** Viewport offset of the scroll area's top edge (0 when the window scrolls). */
export function getPageScrollOffset() {
  return pageScroller()?.getBoundingClientRect().top ?? 0
}

export function setPageScrollTop(top: number, behavior: ScrollBehavior) {
  ;(pageScroller() ?? window).scrollTo({ left: 0, top, behavior })
}

export function isPageScrolledToEnd() {
  const scroller = pageScroller()
  return scroller
    ? scroller.clientHeight + scroller.scrollTop >= scroller.scrollHeight - 2
    : window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
}

export function getPageScrollEventTarget(): EventTarget {
  return pageScroller() ?? window
}
