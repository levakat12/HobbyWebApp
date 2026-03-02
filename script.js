(() => {
  const themeToggle = document.getElementById("modeBtn");
  const dashboardMenuToggle = document.getElementById("menuList-toggle");
  const dashboardMenu = document.getElementById("menuList");
  const dashLinks = Array.from(document.querySelectorAll("[data-go-dashboard]"));
  const logoutLinks = Array.from(document.querySelectorAll("[data-logout-link]"));
  const loginForm = document.getElementById("formLoginNow");
  const bypassLoginBtn = document.getElementById("bypassLoginBtn");
  const registerForm = document.getElementById("formRegNow");
  const loginMsg = document.getElementById("loginMsg");
  const registerMsg = document.getElementById("registerMsg");
  const goBackBtn = document.getElementById("goBackBtn");
  const panels = Array.from(document.querySelectorAll(".secBlock"));
  const scrollRoot = document.querySelector(".scrollThing");
  const usersKey = "hobby-users";
  const authKey = "hobby-auth";
  const currentUserKey = "hobby-current-user";

  const readStore = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeStore = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };

  const removeStore = (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op if storage is blocked
    }
  };

  // tiny mock auth store: keeps fake users and current login in localStorage
  const getUsers = () => {
    const raw = readStore(usersKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveUsers = (users) => writeStore(usersKey, JSON.stringify(users));

  const setLoggedIn = (email) => {
    const wroteAuth = writeStore(authKey, "1");
    const wroteUser = writeStore(currentUserKey, email);
    return wroteAuth && wroteUser;
  };

  const clearLoggedIn = () => {
    removeStore(authKey);
    removeStore(currentUserKey);
  };

  const setAuthMessage = (msgEl, text, ok = false) => {
    if (!msgEl) {
      return;
    }

    msgEl.textContent = text;
    msgEl.classList.remove("ok", "bad");

    if (!text) {
      return;
    }

    msgEl.classList.add(ok ? "ok" : "bad");
  };

  // only logout links on inner pages clear mock session
  logoutLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      clearLoggedIn();
      window.location.href = "login.html";
    });
  });

  if (goBackBtn) {
    goBackBtn.addEventListener("click", () => {
      // if user came from another page, go there; else safe fallback
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }

  if (bypassLoginBtn) {
    bypassLoginBtn.addEventListener("click", (event) => {
      event.preventDefault();

      const didSaveGuest = setLoggedIn("guest@mock.local");
      if (didSaveGuest) {
        setAuthMessage(loginMsg, "Guest mode on. Opening dashboard...", true);
      } else {
        setAuthMessage(loginMsg, "Guest mode on (storage off). Opening dashboard...", true);
      }

      window.setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 240);
    });
  }

  // login mock: checks if email/pass match one saved fake user
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setAuthMessage(loginMsg, "");

      const emailInput = String(loginForm.elements.email?.value || "").trim().toLowerCase();
      const passwordInput = String(loginForm.elements.password?.value || "");
      const users = getUsers();
      const found = users.find((user) => user.email === emailInput && user.password === passwordInput);

      if (!found) {
        setAuthMessage(loginMsg, "Login failed. Check email/password or register first.");
        return;
      }

      if (!setLoggedIn(found.email)) {
        setAuthMessage(loginMsg, "Storage blocked. Could not start session.");
        return;
      }

      setAuthMessage(loginMsg, "Login ok. Sending you to dashboard...", true);
      window.setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 420);
    });
  }

  // register mock: saves fake user in localStorage then logs them in
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      setAuthMessage(registerMsg, "");

      const usernameInput = String(registerForm.elements.username?.value || "").trim();
      const emailInput = String(registerForm.elements.email?.value || "").trim().toLowerCase();
      const passwordInput = String(registerForm.elements.password?.value || "");

      if (!usernameInput || !emailInput || !passwordInput) {
        setAuthMessage(registerMsg, "Please fill all fields.");
        return;
      }

      if (passwordInput.length < 4) {
        setAuthMessage(registerMsg, "Password too short. Use 4+ chars.");
        return;
      }

      const users = getUsers();
      const exists = users.some((user) => user.email === emailInput);
      if (exists) {
        setAuthMessage(registerMsg, "Email already registered. Try login.");
        return;
      }

      users.push({
        username: usernameInput,
        email: emailInput,
        password: passwordInput,
      });

      if (!saveUsers(users) || !setLoggedIn(emailInput)) {
        setAuthMessage(registerMsg, "Storage blocked. Could not save account.");
        return;
      }

      setAuthMessage(registerMsg, "Account created. Opening dashboard...", true);
      registerForm.reset();
      window.setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 420);
    });
  }

  // theme helper: updates dataset + icon + aria in one place
  const applyTheme = (theme) => {
    const activeTheme = theme === "light" ? "light" : "dark";
    document.body.dataset.theme = activeTheme;

    if (themeToggle) {
      const nextTheme = activeTheme === "dark" ? "light" : "dark";
      themeToggle.textContent = nextTheme === "dark" ? "☾" : "☀";
      themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
      themeToggle.setAttribute("aria-pressed", activeTheme === "light" ? "true" : "false");
    }
  };

  try {
    const savedTheme = window.localStorage.getItem("hobbies-theme");
    applyTheme(savedTheme || document.body.dataset.theme || "light");
  } catch {
    applyTheme(document.body.dataset.theme || "light");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.dataset.theme === "light" ? "light" : "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);

      try {
        window.localStorage.setItem("hobbies-theme", nextTheme);
      } catch {
        // Ignore storage errors (private mode / strict settings).
      }
    });
  }

  // saves a small flag so dashboard page can play open-to-full animation
  dashLinks.forEach((link) => {
    link.addEventListener("click", () => {
      try {
        window.sessionStorage.setItem("dash-open", "1");
      } catch {
        // no-op if storage is blocked
      }
    });
  });

  // dashboard entry animation only when coming from home menu click
  if (document.body.classList.contains("pageDash")) {
    try {
      const shouldAnimateDash = window.sessionStorage.getItem("dash-open") === "1";
      if (shouldAnimateDash) {
        document.body.classList.add("dashStartAnim");
        window.sessionStorage.removeItem("dash-open");
      }
    } catch {
      // no-op if storage is blocked
    }
  }

  if (dashboardMenuToggle && dashboardMenu) {
    // menu helper so open/close always stays in sync with aria
    const setMenuState = (open) => {
      dashboardMenu.classList.toggle("openNow", open);
      dashboardMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    dashboardMenuToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = !dashboardMenu.classList.contains("openNow");
      setMenuState(willOpen);
    });

    dashboardMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.addEventListener("click", () => {
      setMenuState(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuState(false);
      }
    });
  }

  // fills hobby details page title/data from query like hobby.html?h=Running
  const hobbyNameEl = document.querySelector("[data-hobby-name]");
  if (hobbyNameEl) {
    const hobbyData = {
      "Guitar Practice": {
        progress: 62,
        goals: [
          "Clean fingerstyle intro section",
          "Hold 30 min daily practice for 10 days",
          "Record one full smooth take",
        ],
      },
      Running: {
        progress: 45,
        goals: [
          "Run 5km two times this week",
          "Keep pace under target window",
          "Practice controlled breathing drills",
        ],
      },
      Sketching: {
        progress: 81,
        goals: [
          "Complete 7 anatomy warmups this week",
          "Finish one full figure study",
          "Review line quality and fix weak areas",
        ],
      },
      Cooking: {
        progress: 33,
        goals: [
          "Master 3 new meal recipes",
          "Cut prep time by 15%",
          "Plan weekly grocery list better",
        ],
      },
    };

    const params = new URLSearchParams(window.location.search);
    const hobbyFromUrl = params.get("h");
    const safeName = hobbyFromUrl && hobbyFromUrl.trim() ? hobbyFromUrl.trim() : "Hobby Focus";
    const selected = hobbyData[safeName] || { progress: 50, goals: ["Set first goal", "Track progress daily"] };

    hobbyNameEl.textContent = safeName;
    document.title = `${safeName} | Hobby Tracker`;

    const goalText = document.querySelector("[data-hobby-goal]");
    if (goalText) {
      goalText.textContent = `Goal: Keep daily focused work in ${safeName} and finish current milestone.`;
    }

    const prog = document.querySelector("[data-hobby-prog]");
    const progLabel = document.querySelector("[data-hobby-prog-label]");
    if (prog) {
      prog.style.width = `${selected.progress}%`;
    }
    if (progLabel) {
      progLabel.textContent = `${selected.progress}%`;
    }

    const goalsList = document.querySelector("[data-hobby-goals]");
    if (goalsList) {
      goalsList.innerHTML = "";
      selected.goals.forEach((goal) => {
        const li = document.createElement("li");
        li.textContent = goal;
        goalsList.appendChild(li);
      });
    }
  }

  if (panels.length === 0 || !scrollRoot) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const panelStarts = () => panels.map((secBlock) => secBlock.offsetTop);

  let lastScrollTop = scrollRoot.scrollTop;
  let lastDirection = 0;
  let snapTimer = null;
  let snapping = false;

  // moves scroll to exact section top (this gives that page-by-page feel)
  const snapToPanel = (targetIndex) => {
    const starts = panelStarts();
    const clampedIndex = Math.max(0, Math.min(targetIndex, starts.length - 1));
    const targetTop = starts[clampedIndex];

    snapping = true;
    scrollRoot.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });

    window.setTimeout(() => {
      snapping = false;
      lastScrollTop = scrollRoot.scrollTop;
    }, prefersReducedMotion.matches ? 0 : 420);
  };

  // checks how far user moved and decides prev/next section
  const settleScrollPosition = () => {
    if (snapping) {
      return;
    }

    const starts = panelStarts();
    const currentTop = scrollRoot.scrollTop;

    if (starts.length === 1) {
      snapToPanel(0);
      return;
    }

    let segmentIndex = starts.length - 1;
    for (let i = 0; i < starts.length - 1; i += 1) {
      if (currentTop < starts[i + 1]) {
        segmentIndex = i;
        break;
      }
    }

    const start = starts[segmentIndex];
    const nextStart = starts[Math.min(segmentIndex + 1, starts.length - 1)];
    const distance = Math.max(nextStart - start, 1);
    const progress = (currentTop - start) / distance;
    const targetIndex =
      lastDirection >= 0
        ? (progress >= 0.35 ? segmentIndex + 1 : segmentIndex)
        : (progress <= 0.65 ? segmentIndex : segmentIndex + 1);

    snapToPanel(targetIndex);
  };

  scrollRoot.addEventListener(
    "scroll",
    () => {
      const currentTop = scrollRoot.scrollTop;
      const delta = currentTop - lastScrollTop;
      if (Math.abs(delta) > 1) {
        lastDirection = delta > 0 ? 1 : -1;
      }
      lastScrollTop = currentTop;

      if (snapTimer) {
        window.clearTimeout(snapTimer);
      }
      snapTimer = window.setTimeout(settleScrollPosition, 120);
    },
    { passive: true }
  );

  if (prefersReducedMotion.matches) {
    return;
  }

  const timers = new WeakMap();

  // replays section "rerender" effect each time section becomes active
  const triggerRerender = (secBlock) => {
    const inner = secBlock.querySelector(".secBlock-inner");
    if (!inner) {
      return;
    }

    secBlock.classList.remove("blinkNow");
    inner.classList.remove("blinkNow");

    void inner.offsetWidth;

    secBlock.classList.add("blinkNow");
    inner.classList.add("blinkNow");

    const oldTimer = timers.get(secBlock);
    if (oldTimer) {
      window.clearTimeout(oldTimer);
    }

    const timer = window.setTimeout(() => {
      secBlock.classList.remove("blinkNow");
      inner.classList.remove("blinkNow");
    }, 620);

    timers.set(secBlock, timer);
  };

  // watches which section is mostly visible, then runs rerender
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.62) {
          triggerRerender(entry.target);
        }
      });
    },
    {
      root: scrollRoot,
      threshold: [0.62],
    }
  );

  panels.forEach((secBlock) => observer.observe(secBlock));
})();
