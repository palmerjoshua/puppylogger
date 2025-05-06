const hamburberBtn = document.querySelector('.js-hamburger');
const mobileNav = document.getElementById('main-nav');
hamburberBtn.addEventListener('click', () => {
  const isActive = hamburberBtn.classList.toggle('is-active');
  mobileNav.classList.toggle('hidden', !isActive);
  hamburberBtn.setAttribute('aria-expanded', String(isActive));
});

function offerOptIn () {
  const optInP = document.getElementById("opt-back-in");
  const banner = document.getElementById("cookie-banner");
  const consent = localStorage.getItem("cookieConsent");

  if (consent === "declined" && optInP) {
    optInP.innerHTML =
      'Want to help make this website better? <a href="#" id="opt-in-link" class="underline text-blue-600">Opt back in here</a>!';
    const link = document.getElementById("opt-in-link");

    link.addEventListener("click", function (e) {
      e.preventDefault();
      // remove the “declined” flag
      localStorage.removeItem("cookieConsent");
      // hide this message
      optInP.textContent = "";
      // show the banner again
      banner.style.display = "flex";
    });
  }
}