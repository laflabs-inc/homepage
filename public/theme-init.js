// Runs during parsing so the page never flashes the wrong theme.
(function () {
  try {
    var stored = document.cookie.match(/(?:^|; )laf_theme=([^;]+)/)
    var theme = stored && stored[1]
    if (theme !== "dark" && theme !== "light") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    document.documentElement.classList.toggle("dark", theme === "dark")
  } catch {
    /* Theme is cosmetic; never let it block rendering. */
  }
})()
