/* NomuOS — Boot sequence */
window.NomuBoot = (function () {
  "use strict";

  var BOOT_MS = 2600;
  var initialized = false;

  // Real mobile/touch devices OR narrow (mobile) viewports use the mobile shell.
  function isMobileDevice() {
    var ua = navigator.userAgent || "";
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  }
  function isMobileView() {
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    return isMobileDevice() || w <= 820;
  }

  var _mobileMode = null;
  function watchViewport() {
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        // Reload only when we cross the desktop/mobile boundary.
        if (isMobileView() !== _mobileMode) location.reload();
      }, 300);
    });
  }

  function showDesktop() {
    var boot = document.getElementById("boot-screen");
    var desktop = document.getElementById("desktop");
    boot.classList.add("boot-out");
    setTimeout(function () {
      boot.classList.add("hidden");
      desktop.classList.remove("hidden");
      if (!initialized) {
        NomuDesktop.init();
        initialized = true;
      } else {
        NomuTheme.apply();
      }
    }, 550);
  }

  function boot() {
    _mobileMode = isMobileView();
    watchViewport();

    // Mobile: launch the iOS-style shell instead of the desktop OS.
    if (_mobileMode) {
      document.documentElement.classList.add("is-mobile");
      try { if (window.NomuMobile) NomuMobile.init(); } catch (e) {}
      return;
    }

    // apply saved theme early so the boot screen matches
    try { NomuTheme.apply(); } catch (e) {}
    var boot = document.getElementById("boot-screen");
    boot.classList.remove("hidden", "boot-out");
    setTimeout(showDesktop, BOOT_MS);
  }

  // Lock: just show the boot screen again briefly (a playful "lock")
  function lock() {
    var boot = document.getElementById("boot-screen");
    var hint = boot.querySelector(".boot-hint");
    if (hint) hint.textContent = "Locked · unlocking…";
    var bar = boot.querySelector(".boot-bar");
    if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
    boot.classList.remove("hidden", "boot-out");
    document.getElementById("desktop").classList.add("hidden");
    setTimeout(showDesktop, 1600);
  }

  function restart() {
    location.reload();
  }

  // Log out: show a brief goodbye screen, then leave for the live portfolio.
  function logout() {
    var boot = document.getElementById("boot-screen");
    if (boot) {
      var hint = boot.querySelector(".boot-hint");
      if (hint) hint.textContent = "Logging out…";
      var tagline = boot.querySelector(".boot-tagline");
      if (tagline) tagline.textContent = "see you at imronaldmendoza.com";
      boot.classList.remove("hidden", "boot-out");
    }
    var desktop = document.getElementById("desktop");
    if (desktop) desktop.classList.add("hidden");
    setTimeout(function () {
      window.location.href = "https://imronaldmendoza.com";
    }, 1200);
  }

  // kick off on load
  window.addEventListener("DOMContentLoaded", boot);

  return { boot: boot, lock: lock, restart: restart, logout: logout };
})();
