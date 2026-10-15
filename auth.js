"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const client = window.supabaseClient;
  const appShell = document.querySelector(".app-shell");  
  const form = document.getElementById("authForm");
  const emailInput = document.getElementById("authEmail");
  const passwordInput = document.getElementById("authPassword");
  const submitButton = document.getElementById("authSubmit");
  const toggleButton = document.getElementById("authToggle");
  const title = document.getElementById("authTitle");
  const description = document.getElementById("authDescription");
  const message = document.getElementById("authMessage");
  const signedInPanel = document.getElementById("signedInPanel");
  const signedInEmail = document.getElementById("signedInEmail");
  const signOutButton = document.getElementById("signOutBtn");

  if (!client || !form) {
    console.error("Supabase client أو واجهة تسجيل الدخول غير موجودة.");
    return;
  }

  let isSignUp = false;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b42318" : "#247448";
  }

  function renderAuth(user) {
    const loggedIn = Boolean(user);

   form.hidden = loggedIn;
signedInPanel.hidden = !loggedIn;
appShell?.classList.toggle("auth-locked", !loggedIn); 

    title.textContent = loggedIn
      ? "أهلًا بيك في دفتر"
      : isSignUp ? "إنشاء حساب جديد" : "سجّل دخولك";

    description.textContent = loggedIn
      ? "أنت مسجل الدخول حاليًا."
      : "سجّل الدخول للوصول إلى حسابك.";

    signedInEmail.textContent = user?.email || "";

    toggleButton.hidden = loggedIn;
    showMessage("");
  }

  toggleButton.addEventListener("click", () => {
    isSignUp = !isSignUp;

    title.textContent = isSignUp
      ? "إنشاء حساب جديد"
      : "سجّل دخولك";

    description.textContent = isSignUp
      ? "أنشئ حسابًا باستخدام بريدك الإلكتروني."
      : "ادخل لحسابك للوصول إلى مهامك.";

    submitButton.textContent = isSignUp
      ? "إنشاء الحساب"
      : "تسجيل الدخول";

    toggleButton.textContent = isSignUp
      ? "عندي حساب بالفعل"
      : "إنشاء حساب جديد";

    passwordInput.autocomplete = isSignUp
      ? "new-password"
      : "current-password";

    showMessage("");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitButton.disabled = true;
    toggleButton.disabled = true;
    showMessage("جارٍ تنفيذ الطلب...");

    try {
      if (isSignUp) {
     const { data, error } = await client.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: "https://daftar-web.netlify.app/index.html"
  }
});
        if (error) throw error;

        if (data.session) {
          renderAuth(data.user);
          showMessage("تم إنشاء الحساب وتسجيل الدخول.");
        } else {
          showMessage(
            "تم إرسال طلب إنشاء الحساب. راجع بريدك الإلكتروني للتأكيد، ثم سجّل الدخول."
          );
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        renderAuth(data.user);
        showMessage("تم تسجيل الدخول بنجاح.");
      }
    } catch (error) {
      showMessage(error.message || "حصل خطأ. حاول مرة أخرى.", true);
    } finally {
      submitButton.disabled = false;
      toggleButton.disabled = false;
    }
  });

  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;

    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;

      renderAuth(null);
      showMessage("تم تسجيل الخروج.");
    } catch (error) {
      showMessage(error.message || "تعذر تسجيل الخروج.", true);
    } finally {
      signOutButton.disabled = false;
    }
  });

  client.auth.onAuthStateChange((_event, session) => {
    renderAuth(session?.user || null);
  });

  const { data, error } = await client.auth.getSession();

  if (error) {
    showMessage("تعذر التحقق من جلسة الدخول.", true);
    return;
  }

  renderAuth(data.session?.user || null);
});