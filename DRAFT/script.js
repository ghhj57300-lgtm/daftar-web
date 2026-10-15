"use strict";

/* ========================================
   DAFТAR — Task Manager
   Storage: Browser LocalStorage
======================================== */

document.addEventListener("DOMContentLoaded", startApp);

function startApp() {
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    taskList: $("#taskList"),
    addButton: $("#addTaskBtn"),
    dialog: $("#taskDialog"),
    form: $("#taskForm"),
    title: $("#taskTitle"),
    description: $("#taskDescription"),
    date: $("#taskDate"),
    priority: $("#taskPriority"),
    search:
      $("#searchInput") ||
      $("#taskSearch") ||
      $("#searchTasks"),
    filter: $("#taskFilter") || $("#filterSelect"),
    total: $("#totalTasks"),
    completed: $("#completedTasks"),
    remaining: $("#remainingTasks"),
    progressText: $("#progressText"),
    progressFill: $("#progressFill"),
    progressBar: $("#progressBar")
  };

  const STORAGE_KEY = "daftar.tasks.v1";

  const PRIORITIES = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية"
  };

  let tasks = loadTasks();
  let editingTaskId = null;
  let searchTerm = "";
  let currentFilter = "all";

  /* ---------- Storage ---------- */

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.title === "string"
      );
    } catch (error) {
      console.error("تعذرت قراءة المهام المحفوظة:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
      );
      return true;
    } catch (error) {
      console.error("تعذر حفظ المهام:", error);
      alert("تعذر حفظ المهام. تأكد من مساحة التخزين في المتصفح.");
      return false;
    }
  }

  function createId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  /* ---------- Dialog ---------- */

  function openDialog(task = null) {
    if (!elements.dialog || !elements.form) {
      console.error(
        "لم يتم العثور على taskDialog أو taskForm في HTML."
      );
      return;
    }

    editingTaskId = task ? task.id : null;
    elements.form.reset();

    if (elements.title) {
      elements.title.value = task ? task.title : "";
    }

    if (elements.description) {
      elements.description.value =
        task ? task.description || "" : "";
    }

    if (elements.date) {
      elements.date.value = task ? task.date || "" : "";
    }

    if (elements.priority) {
      elements.priority.value = task
        ? task.priority || "medium"
        : "medium";
    }

    const heading = elements.dialog.querySelector(
      "[data-dialog-title]"
    );

    if (heading) {
      heading.textContent = task
        ? "تعديل المهمة"
        : "إضافة مهمة جديدة";
    }

    if (typeof elements.dialog.showModal === "function") {
      if (!elements.dialog.open) {
        elements.dialog.showModal();
      }
    } else {
      elements.dialog.hidden = false;
      elements.dialog.classList.add("open");
    }

    if (elements.title) {
      elements.title.focus();
    }
  }

  function closeDialog() {
    if (!elements.dialog) return;

    if (typeof elements.dialog.close === "function") {
      if (elements.dialog.open) {
        elements.dialog.close();
      }
    } else {
      elements.dialog.hidden = true;
      elements.dialog.classList.remove("open");
    }

    editingTaskId = null;
  }

  /* ---------- Task Actions ---------- */

  function handleSubmit(event) {
    event.preventDefault();

    if (!elements.title) {
      alert("لم يتم العثور على حقل عنوان المهمة في HTML.");
      return;
    }

    const title = elements.title.value.trim();

    if (!title) {
      elements.title.focus();
      alert("اكتب عنوان المهمة أولًا.");
      return;
    }

    const description = elements.description
      ? elements.description.value.trim()
      : "";

    const date = elements.date
      ? elements.date.value
      : "";

    const priority = elements.priority
      ? elements.priority.value
      : "medium";

    if (editingTaskId) {
      const task = tasks.find(
        (item) => item.id === editingTaskId
      );

      if (!task) {
        alert("لم يتم العثور على المهمة المطلوب تعديلها.");
        return;
      }

      task.title = title;
      task.description = description;
      task.date = date;
      task.priority = priority;
    } else {
      tasks.unshift({
        id: createId(),
        title,
        description,
        date,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
      });
    }

    if (!saveTasks()) return;

    closeDialog();
    renderTasks();
  }

  function toggleTask(taskId, completed) {
    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task) return;

    task.completed = completed;

    if (saveTasks()) {
      renderTasks();
    }
  }

  function editTask(taskId) {
    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (task) openDialog(task);
  }

  function deleteTask(taskId) {
    const task = tasks.find(
      (item) => item.id === taskId
    );

    if (!task) return;

    const confirmed = window.confirm(
      `هل تريد حذف المهمة "${task.title}"؟`
    );

    if (!confirmed) return;

    const previousTasks = tasks;

    tasks = tasks.filter(
      (item) => item.id !== taskId
    );

    if (saveTasks()) {
      renderTasks();
    } else {
      tasks = previousTasks;
    }
  }

  /* ---------- Safe Element Helpers ---------- */

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function createActionButton(label, className, action) {
    const button = createElement(
      "button",
      className,
      label
    );

    button.type = "button";
    button.setAttribute("aria-label", label);
    button.addEventListener("click", action);

    return button;
  }

  /* ---------- Render Tasks ---------- */

  function renderTasks() {
    if (!elements.taskList) {
      console.error(
        'لم يتم العثور على العنصر الذي يحمل id="taskList".'
      );
      updateStats();
      return;
    }

    elements.taskList.replaceChildren();

    const query = searchTerm.trim().toLocaleLowerCase("ar");

    const visibleTasks = tasks.filter((task) => {
      const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "active" && !task.completed) ||
        (currentFilter === "completed" && task.completed);

      const searchableText = [
        task.title,
        task.description || ""
      ]
        .join(" ")
        .toLocaleLowerCase("ar");

      const matchesSearch = searchableText.includes(query);

      return matchesFilter && matchesSearch;
    });

    if (visibleTasks.length === 0) {
      const empty = createElement(
        "div",
        "empty-state",
        tasks.length === 0
          ? "لسه مفيش مهام. أضف أول مهمة وابدأ!"
          : "مفيش مهام مطابقة للبحث أو الفلتر."
      );

      elements.taskList.appendChild(empty);
      updateStats();
      return;
    }

    visibleTasks.forEach((task) => {
      const item = createElement(
        "article",
        `task-item${task.completed ? " completed" : ""}`
      );

      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = Boolean(task.completed);
      checkbox.setAttribute(
        "aria-label",
        `تحديد ${task.title} كمكتملة`
      );

      checkbox.addEventListener("change", () => {
        toggleTask(task.id, checkbox.checked);
      });

      const details = createElement("div", "task-details");

      const title = createElement(
        "strong",
        "task-title",
        task.title
      );

      details.appendChild(title);

      if (task.description) {
        details.appendChild(
          createElement(
            "p",
            "task-description",
            task.description
          )
        );
      }

      const priorityLabel =
        PRIORITIES[task.priority] || "متوسطة";

      details.appendChild(
        createElement(
          "span",
          `task-priority priority-${task.priority || "medium"}`,
          `الأولوية: ${priorityLabel}`
        )
      );

      if (task.date) {
        details.appendChild(
          createElement(
            "span",
            "task-date",
            `التاريخ: ${task.date}`
          )
        );
      }

      const actions = createElement("div", "task-actions");

      const editButton = createActionButton(
        "تعديل",
        "task-action edit-task",
        () => editTask(task.id)
      );

      const deleteButton = createActionButton(
        "حذف",
        "task-action delete-task",
        () => deleteTask(task.id)
      );

      actions.append(editButton, deleteButton);
      item.append(checkbox, details, actions);
      elements.taskList.appendChild(item);
    });

    updateStats();
  }

  /* ---------- Statistics ---------- */

  function updateStats() {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    const remaining = total - completed;

    const progress = total === 0
      ? 0
      : Math.round((completed / total) * 100);

    if (elements.total) {
      elements.total.textContent = String(total);
    }

    if (elements.completed) {
      elements.completed.textContent = String(completed);
    }

    if (elements.remaining) {
      elements.remaining.textContent = String(remaining);
    }

    if (elements.progressText) {
      elements.progressText.textContent = `${progress}%`;
    }

    if (elements.progressFill) {
      elements.progressFill.style.width = `${progress}%`;
    }

    if (elements.progressBar) {
      elements.progressBar.setAttribute(
        "aria-valuenow",
        String(progress)
      );
    }

    const message = $("#progressMessage");

    if (message) {
      message.textContent =
        `أنجزت ${completed} من ${total} مهام. كل خطوة بتفرق.`;
    }
  }

  /* ---------- Search and Filters ---------- */

  function setFilter(value) {
    const allowedFilters = ["all", "active", "completed"];

    currentFilter = allowedFilters.includes(value)
      ? value
      : "all";

    document.querySelectorAll("[data-filter]").forEach(
      (button) => {
        const active =
          button.getAttribute("data-filter") === currentFilter;

        button.classList.toggle("active", active);
        button.setAttribute(
          "aria-pressed",
          String(active)
        );
      }
    );

    renderTasks();
  }

  if (elements.search) {
    elements.search.addEventListener("input", () => {
      searchTerm = elements.search.value;
      renderTasks();
    });
  }

  if (elements.filter) {
    elements.filter.addEventListener("change", () => {
      setFilter(elements.filter.value);
    });
  }

  document.querySelectorAll("[data-filter]").forEach(
    (button) => {
      button.addEventListener("click", () => {
        setFilter(button.getAttribute("data-filter"));
      });
    }
  );

  /* ---------- Event Listeners ---------- */

  if (elements.addButton) {
    elements.addButton.addEventListener("click", () => {
      openDialog();
    });
  }

  if (elements.form) {
    elements.form.addEventListener("submit", handleSubmit);
  }

  document.querySelectorAll(
    "[data-close-dialog], #closeDialogBtn, #cancelTaskBtn"
  ).forEach((button) => {
    button.addEventListener("click", closeDialog);
  });

  if (elements.dialog) {
    elements.dialog.addEventListener("click", (event) => {
      if (
        typeof elements.dialog.showModal === "function" &&
        event.target === elements.dialog
      ) {
        closeDialog();
      }
    });
  }

  /* ---------- Start ---------- */

  renderTasks();
}
async function testSupabaseConnection() {
  const { data, error } = await window.supabaseClient
    .from("tasks")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase connection test failed:", error);
    return;
  }

  console.log("Supabase connected successfully!", data);
}

testSupabaseConnection();