/* Professional To-Do App
   - Categories & category-specific tasks
   - Filters: all / pending / completed
   - Clear All tasks for current category
   - Name stored in localStorage (welcome)
   - Collapsible sidebar
   - Persistent state via localStorage
*/

/* =========== DOM =========== */
const categoryListEl = document.getElementById('categoryList');
const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');

const selectedCategoryTitle = document.getElementById('selectedCategoryTitle');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskListEl = document.getElementById('taskList');

const filters = document.querySelectorAll('.filter-btn');
const clearAllBtn = document.getElementById('clearAllBtn');

const nameModal = document.getElementById('nameModal');
const nameInput = document.getElementById('nameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const skipNameBtn = document.getElementById('skipNameBtn');
const greetingEl = document.getElementById('greeting');
const greetingSubEl = document.getElementById('greetingSub');
const editNameBtn = document.getElementById('editNameBtn');

const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');

/* =========== Local Storage Keys =========== */
const LS = {
  categories: 'td:categories:v1',
  tasks: 'td:tasks:v1',
  selected: 'td:selectedCat:v1',
  username: 'td:username:v1'
};

/* =========== State =========== */
let categories = []; // [{id,name}]
let tasks = {};      // { categoryId: [ {id,text,done,createdAt} ] }
let selectedCategoryId = null;
let selectedFilter = 'all'; // 'all' | 'pending' | 'completed'

/* =========== Helpers =========== */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

const saveState = () => {
  localStorage.setItem(LS.categories, JSON.stringify(categories));
  localStorage.setItem(LS.tasks, JSON.stringify(tasks));
  localStorage.setItem(LS.selected, selectedCategoryId || '');
};

const loadState = () => {
  try {
    categories = JSON.parse(localStorage.getItem(LS.categories)) || [];
    tasks = JSON.parse(localStorage.getItem(LS.tasks)) || {};
    selectedCategoryId = localStorage.getItem(LS.selected) || null;
    if (selectedCategoryId === '') selectedCategoryId = null;
  } catch (e) {
    categories = [];
    tasks = {};
    selectedCategoryId = null;
  }
};

/* =========== USER NAME =========== */
function getUsername() {
  return localStorage.getItem(LS.username) || '';
}
function setUsername(name) {
  localStorage.setItem(LS.username, name || '');
  renderGreeting();
}
function renderGreeting() {
  const name = getUsername();
  if (name) {
    greetingEl.textContent = `Welcome, ${name}`;
    greetingSubEl.textContent = `Ready to complete something today?`;
  } else {
    greetingEl.textContent = `Welcome`;
    greetingSubEl.textContent = `Let's make today productive.`;
  }
}



/* =========== Render Categories =========== */
function renderCategories() {
  categoryListEl.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.className = 'category-item' + (cat.id === selectedCategoryId ? ' active' : '');
    li.dataset.id = cat.id;

    const left = document.createElement('div');
    left.className = 'category-left';

    const icon = document.createElement('div');
    icon.className = 'cat-icon';
    icon.textContent = cat.name.charAt(0).toUpperCase();

    const nameWrap = document.createElement('div');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'category-name';
    nameDiv.textContent = cat.name;

    const meta = document.createElement('div');
    meta.className = 'cat-meta';
    const cnt = (tasks[cat.id] || []).length;
    const done = (tasks[cat.id] || []).filter(t=>t.done).length;
    meta.textContent = `${cnt} tasks • ${done} done`;

    nameWrap.appendChild(nameDiv);
    nameWrap.appendChild(meta);

    left.appendChild(icon);
    left.appendChild(nameWrap);

    const right = document.createElement('div');
    right.style.display='flex';
    right.style.gap='8px';
    right.style.alignItems='center';

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.title = 'Delete category';
    delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

    right.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(right);

    // Events
    li.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      selectCategory(cat.id);
    });

    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const confirmDel = confirm(`Delete category "${cat.name}" and all its ${ (tasks[cat.id] || []).length } tasks?`);
      if (!confirmDel) return;
      deleteCategory(cat.id);
    });

    categoryListEl.appendChild(li);
  });

  // If no categories - create defaults
  if (categories.length === 0) {
    const defaultCats = ['Inbox','Work','Personal','Health','Shopping','Chores'];
    defaultCats.forEach(name => addCategory(name, false));
    saveState();
    renderCategories();
  }
}

/* =========== Render Tasks (with filter) =========== */
function renderTasks() {
  taskListEl.innerHTML = '';
  if (!selectedCategoryId) {
    selectedCategoryTitle.textContent = 'Select a category';
    return;
  }

  const cat = categories.find(c=>c.id===selectedCategoryId);
  selectedCategoryTitle.textContent = cat ? cat.name : 'Category';

  let list = (tasks[selectedCategoryId] || []).slice().sort((a,b)=>b.createdAt - a.createdAt);

  if (selectedFilter === 'pending') {
    list = list.filter(t => !t.done);
  } else if (selectedFilter === 'completed') {
    list = list.filter(t => t.done);
  }

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.style.opacity = '0.6';
    empty.style.padding = '18px';
    empty.textContent = 'No tasks here yet.';
    taskListEl.appendChild(empty);
    return;
  }

  list.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task';

    const left = document.createElement('div');
    left.className = 'task-left';

    const chk = document.createElement('div');
    chk.className = 'check' + (task.done ? ' completed' : '');
    chk.title = task.done ? 'Mark as undone' : 'Mark as done';
    chk.dataset.id = task.id;
    chk.innerHTML = task.done ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#052623" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : '';

    const txt = document.createElement('div');
    txt.className = 'task-text' + (task.done ? ' completed' : '');
    txt.textContent = task.text;

    left.appendChild(chk);
    left.appendChild(txt);

    const right = document.createElement('div');
    right.style.display='flex';
    right.style.alignItems='center';
    right.style.gap='8px';

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const d = new Date(task.createdAt);
    meta.textContent = d.toLocaleDateString();

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.title = 'Delete task';
    del.dataset.id = task.id;
    del.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

    right.appendChild(meta);
    right.appendChild(del);

    li.appendChild(left);
    li.appendChild(right);

    // events
    chk.addEventListener('click', () => toggleTaskDone(selectedCategoryId, task.id));
    del.addEventListener('click', () => {
      const ok = confirm('Delete this task?');
      if (ok) deleteTask(selectedCategoryId, task.id);
    });

    taskListEl.appendChild(li);
  });
}

/* =========== CRUD =========== */
function addCategory(name, persist = true) {
  name = (name || '').trim();
  if (!name) return;
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('Category already exists.');
    return;
  }
  const id = uid();
  const cat = { id, name };
  categories.push(cat);
  tasks[id] = tasks[id] || [];
  if (persist) {
    saveState();
    renderCategories();
    selectCategory(id);
  }
  return id;
}

function deleteCategory(catId) {
  categories = categories.filter(c=>c.id!==catId);
  delete tasks[catId];
  if (selectedCategoryId === catId) {
    selectedCategoryId = categories.length ? categories[0].id : null;
  }
  saveState();
  renderCategories();
  renderTasks();
}

function selectCategory(catId) {
  selectedCategoryId = catId;
  saveState();
  renderCategories();
  renderTasks();
}

function addTaskToCategory(catId, text) {
  text = (text || '').trim();
  if (!text) return;
  const t = { id: uid(), text, done: false, createdAt: Date.now() };
  tasks[catId] = tasks[catId] || [];
  tasks[catId].push(t);
  saveState();
  renderCategories();
  renderTasks();
}

function toggleTaskDone(catId, taskId) {
  const list = tasks[catId] || [];
  const t = list.find(x=>x.id === taskId);
  if (!t) return;
  t.done = !t.done;
  saveState();
  renderCategories();
  renderTasks();
}

function deleteTask(catId, taskId) {
  tasks[catId] = (tasks[catId] || []).filter(t => t.id !== taskId);
  saveState();
  renderCategories();
  renderTasks();
}

function clearAllTasks(catId) {
  if (!catId) return;
  const ok = confirm('Clear ALL tasks in this category? This cannot be undone.');
  if (!ok) return;
  tasks[catId] = [];
  saveState();
  renderCategories();
  renderTasks();
}

/* =========== Filters =========== */
function setFilter(name) {
  selectedFilter = name;
  filters.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === name));
  renderTasks();
}

/* =========== Sidebar Toggle =========== */
function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
}

/* =========== Init & Events =========== */
function init() {
  loadState();

  // default categories if empty
  if (!categories || categories.length === 0) {
    const defaults = ['Inbox','Personal','Work','Focus'];
    defaults.forEach(n => addCategory(n, false));
    saveState();
  }

  // ensure selectedCategory exists
  if (!selectedCategoryId || !categories.find(c=>c.id===selectedCategoryId)) {
    selectedCategoryId = categories.length ? categories[0].id : null;
  }

  renderGreeting();
  renderCategories();
  renderTasks();
  // set current filter UI
  setFilter(selectedFilter);

  // EVENTS
  addCategoryBtn.addEventListener('click', () => {
    const name = newCategoryInput.value;
    if (!name.trim()) return;
    const id = addCategory(name);
    newCategoryInput.value = '';
    if (id) selectCategory(id);
  });
  newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addCategoryBtn.click();
  });

  addTaskBtn.addEventListener('click', () => {
    if (!selectedCategoryId) { alert('Please select a category first.'); return; }
    addTaskToCategory(selectedCategoryId, taskInput.value);
    taskInput.value = '';
    taskInput.focus();
  });
  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTaskBtn.click();
  });

  filters.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  clearAllBtn.addEventListener('click', () => {
    if (!selectedCategoryId) return alert('Please select a category first.');
    clearAllTasks(selectedCategoryId);
  });

  // name modal
  const existingName = getUsername();
  if (!existingName) {
    nameModal.classList.remove('hidden');
    setTimeout(()=> nameInput.focus(), 200);
  }

  saveNameBtn.addEventListener('click', () => {
    const nm = nameInput.value.trim();
    if (nm) setUsername(nm);
    nameModal.classList.add('hidden');
  });
  skipNameBtn.addEventListener('click', () => {
    nameModal.classList.add('hidden');
  });
  editNameBtn.addEventListener('click', () => {
    nameInput.value = getUsername() || '';
    nameModal.classList.remove('hidden');
    setTimeout(()=> nameInput.focus(), 120);
  });

  // sidebar toggle
  toggleSidebarBtn.addEventListener('click', () => {
    toggleSidebar();
  });

  // small UX: keyboard shortcut "n" to add category focus, "t" to focus task input
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key.toLowerCase() === 'n') {
      newCategoryInput.focus();
    } else if (e.key.toLowerCase() === 't') {
      taskInput.focus();
    }
  });
}

/* ======= Start ======= */
init();
