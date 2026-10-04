// Shared behaviour for all pages: footer year + FAQ accordion

document.addEventListener("DOMContentLoaded", () => {
  // Current year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // FAQ accordion (only runs on pages that have FAQ items)
  const questions = document.querySelectorAll(".faq-question");
  questions.forEach((btn) => {
    btn.addEventListener("click", () => {
      const answer = document.getElementById(btn.getAttribute("aria-controls"));
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // Accordion behaviour: close all others first
      questions.forEach((other) => {
        other.setAttribute("aria-expanded", "false");
        document.getElementById(other.getAttribute("aria-controls")).hidden = true;
      });

      // Toggle the clicked one
      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        answer.hidden = false;
      }
    });
  });
});
