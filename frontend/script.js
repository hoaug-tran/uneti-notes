const API = (localStorage.API || "http://localhost:4000").replace(/\/$/, "");
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
const state = {
  token: localStorage.token || "",
  role: localStorage.role || "",
  user: null,
  list: [],
  active: null,
  filter: "all",
};

const feed = qs("#feed");
const vTitle = qs("#v-title");
const vContent = qs("#v-content");
const vMeta = qs("#v-meta");
const btnTheme = qs("#theme-toggle");
const btnLoginOpen = qs("#login-open");
const btnLogout = qs("#logout-btn");
const btnAdminOpen = qs("#admin-open");
const modalAuth = qs("#modal-auth");
const modalAdmin = qs("#modal-admin");
const modalEdit = qs("#modal-edit");
const followBtn = qs("#follow-btn");
const editOpen = qs("#edit-open");

const loginEmail = qs("#login-email");
const loginPassword = qs("#login-password");
const loginSubmit = qs("#login-submit");

const nTitle = qs("#n-title");
const nLang = qs("#n-lang");
const nTags = qs("#n-tags");
const nContent = qs("#n-content");
const nSubmit = qs("#n-submit");

const eTitle = qs("#e-title");
const eLang = qs("#e-lang");
const eTags = qs("#e-tags");
const eContent = qs("#e-content");
const eSubmit = qs("#e-submit");

const search = qs("#search");
const chips = qsa(".chip");

const fetchJSON = async (url, opt = {}) => {
  const h = opt.headers || {};
  if (state.token) h.Authorization = "Bearer " + state.token;
  const r = await fetch(API + url, {
    ...opt,
    headers: { "Content-Type": "application/json", ...h },
  });
  if (!r.ok)
    throw new Error((await r.json().catch(() => ({}))).error || "error");
  return r.json();
};

const renderFeed = (items) => {
  feed.innerHTML = "";
  if (!items.length) {
    feed.innerHTML = `<div class="meta">Không có ghi chú nào</div>`;
    return;
  }
  items.forEach((n) => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.slug = n.slug;
    div.innerHTML = `
      <div class="title">${n.title}</div>
      <div class="meta">${n.language.toUpperCase()} · ${new Date(
      n.updatedAt
    ).toLocaleString()} · ${n.tags?.join(", ") || ""}</div>
    `;
    div.addEventListener("click", () => openNote(n.slug));
    feed.appendChild(div);
  });
};

const wrapCodeBlocks = () => {
  qsa("pre > code", vContent).forEach((code) => {
    const lang =
      [...code.classList]
        .find((c) => c.startsWith("language-"))
        ?.replace("language-", "") || "";
    const pre = code.parentElement;
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    const head = document.createElement("div");
    head.className = "code-header";
    head.innerHTML = `<span>${
      lang.toUpperCase() || "CODE"
    }</span><button class="copy">Copy</button>`;
    pre.replaceWith(wrap);
    wrap.appendChild(head);
    wrap.appendChild(pre);
    head.querySelector(".copy").addEventListener("click", () => {
      navigator.clipboard.writeText(code.innerText);
      head.querySelector(".copy").textContent = "Đã copy";
      setTimeout(
        () => (head.querySelector(".copy").textContent = "Copy"),
        1400
      );
    });
  });
};

const openNote = async (slug) => {
  const n = await fetchJSON(`/notes/${slug}`);
  state.active = n;

  // highlight item tương ứng
  qsa(".feed .item").forEach((i) =>
    i.classList.toggle("active", i.dataset.slug === slug)
  );

  vTitle.textContent = n.title;
  vContent.innerHTML = marked.parse(n.content);
  Prism.highlightAllUnder(vContent);
  wrapCodeBlocks();
  vMeta.textContent = `${n.language.toUpperCase()} · ${
    n.tags?.join(", ") || ""
  }`;
  qs("#welcome").classList.add("hidden");
  qs(".viewer-inner").classList.remove("hidden");
  if (state.role === "admin") editOpen.classList.remove("hidden");
  else editOpen.classList.add("hidden");
};

const loadList = async () => {
  const params = new URLSearchParams();
  if (state.filter !== "all") params.set("lang", state.filter);
  if (search.value.trim()) params.set("q", search.value.trim());
  try {
    const items = await fetchJSON("/notes?" + params.toString());
    state.list = items;
    renderFeed(items);
  } catch (e) {
    feed.innerHTML = `<div class="meta">Lỗi tải dữ liệu</div>`;
  }
};

const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");

btnTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.theme = document.body.classList.contains("dark")
    ? "dark"
    : "light";
});

btnLoginOpen.addEventListener("click", () => show(modalAuth));
qs("#modal-auth-close")?.addEventListener("click", () => hide(modalAuth));

loginSubmit.addEventListener("click", async () => {
  try {
    const data = await fetchJSON("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value,
      }),
    });
    state.token = data.token;
    state.role = data.user.role;
    localStorage.token = data.token;
    localStorage.role = data.user.role;
    hide(modalAuth);
    btnLoginOpen.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    if (state.role === "admin") btnAdminOpen.classList.remove("hidden");
  } catch (e) {
    alert("Đăng nhập thất bại");
  }
});

btnLogout.addEventListener("click", () => {
  state.token = "";
  state.role = "";
  state.user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  btnLoginOpen.classList.remove("hidden");
  btnLogout.classList.add("hidden");
  btnAdminOpen.classList.add("hidden");
});

btnAdminOpen.addEventListener("click", () => show(modalAdmin));
qs("#modal-admin-close").addEventListener("click", () => hide(modalAdmin));

nSubmit.addEventListener("click", async () => {
  const title = nTitle.value.trim();
  const content = nContent.value;
  const language = nLang.value;
  const tags = nTags.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!title || !content) return;
  await fetchJSON("/notes", {
    method: "POST",
    body: JSON.stringify({ title, content, language, tags }),
  });
  hide(modalAdmin);
  nTitle.value = "";
  nContent.value = "";
  nTags.value = "";
  await loadList();
});

editOpen.addEventListener("click", () => {
  if (!state.active) return;
  eTitle.value = state.active.title;
  eLang.value = state.active.language;
  eTags.value = (state.active.tags || []).join(", ");
  eContent.value = state.active.content;
  show(modalEdit);
});
qs("#modal-edit-close").addEventListener("click", () => hide(modalEdit));

eSubmit.addEventListener("click", async () => {
  if (!state.active) return;
  const title = eTitle.value.trim();
  const content = eContent.value;
  const language = eLang.value;
  const tags = eTags.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!title || !content) return;
  await fetchJSON(`/notes/${state.active.slug}`, {
    method: "PUT",
    body: JSON.stringify({ title, content, language, tags }),
  });
  hide(modalEdit);
  await openNote(state.active.slug);
  await loadList();
});

followBtn.addEventListener("click", async () => {
  if (!state.active) return;
  try {
    await fetchJSON(`/notes/${state.active.slug}/follow`, { method: "POST" });
  } catch {}
  followBtn.textContent = "Đã theo dõi";
  setTimeout(() => (followBtn.textContent = "Theo dõi"), 1200);
});

search.addEventListener("input", () => loadList());

chips.forEach((c) =>
  c.addEventListener("click", () => {
    chips.forEach((i) => i.classList.remove("active"));
    c.classList.add("active");
    state.filter = c.dataset.lang;
    loadList();
  })
);

const boot = async () => {
  if (localStorage.theme === "dark") document.body.classList.add("dark");
  if (state.token) {
    btnLoginOpen.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    if (state.role === "admin") btnAdminOpen.classList.remove("hidden");
  }
  await loadList();
};
boot();

qs("#modal-auth-close").addEventListener("click", () => hide(modalAuth));
qs("#modal-admin-close").addEventListener("click", () => hide(modalAdmin));
qs("#modal-edit-close").addEventListener("click", () => hide(modalEdit));
qsa(".menu li").forEach((item) => {
  item.addEventListener("click", () => {
    qsa(".menu li").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    const type = item.dataset.type;
    if (type === "latest") loadList();
    else if (type === "fav") alert("TODO: Yêu thích");
    else if (type === "tags") alert("TODO: Tags");
    else if (type === "docs") alert("TODO: Tài liệu");
  });
});

qsa(".feed .item").forEach((i) => i.classList.remove("active"));
div.classList.add("active");
