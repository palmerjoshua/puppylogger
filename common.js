const hamburberBtn = document.querySelector('.js-hamburger');
const mobileNav = document.getElementById('main-nav');
hamburberBtn.addEventListener('click', () => {
  const isActive = hamburberBtn.classList.toggle('is-active');
  mobileNav.classList.toggle('hidden', !isActive);
  hamburberBtn.setAttribute('aria-expanded', String(isActive));
});

function offerOptIn () {
  const optSpan = document.getElementById("opt-back-in");
  const banner = document.getElementById("cookie-banner");
  const consent = localStorage.getItem("cookieConsent");

  if (consent === "declined" && optSpan) {
    optSpan.innerHTML =
      '<strong>Want to opt back in? Click <a href="#" id="opt-in-link" class="underline text-blue-600">here</a>!</strong>';
    const link = document.getElementById("opt-in-link");

    link.addEventListener("click", function (e) {
      e.preventDefault();
      // remove the “declined” flag
      localStorage.removeItem("cookieConsent");
      // hide this message
      optSpan.textContent = "";
      // show the banner again
      banner.style.display = "flex";
    });
  }
  // if consent is “accepted” or not set, leave the span empty
}