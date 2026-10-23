console.log("IT'S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/vsinha99', title: 'GitHub' },
];

const BASE_PATH = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? '/'
  : '/dsc106-lab-1/';

function addNavigation() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const list = document.createElement('ul');
  for (const page of pages) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    const url = page.url.startsWith('http') ? page.url : BASE_PATH + page.url;
    link.href = url;
    link.textContent = page.title;
    if (page.title === 'GitHub') {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append(' ↗');
    }
    link.classList.toggle('current', link.host === location.host && link.pathname === location.pathname);
    if (link.classList.contains('current')) link.setAttribute('aria-current', 'page');
    item.append(link);
    list.append(item);
  }
  nav.replaceChildren(list);
}

function setColorScheme(colorScheme) {
  const root = document.documentElement;
  root.style.setProperty('color-scheme', colorScheme);
  if (colorScheme === 'dark' || colorScheme === 'light') {
    root.dataset.theme = colorScheme;
  } else {
    delete root.dataset.theme;
  }
}

function addThemeSelector() {
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;

  const label = document.createElement('label');
  label.className = 'color-scheme';
  const labelText = document.createElement('span');
  labelText.textContent = 'Theme:';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Color theme');
  for (const [value, text] of [['light dark', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.append(option);
  }
  label.append(labelText, select);
  headerInner.append(label);

  const saved = localStorage.getItem('colorScheme');
  select.value = saved || 'light dark';
  setColorScheme(select.value);
  select.addEventListener('input', (event) => {
    const value = event.target.value;
    setColorScheme(value);
    localStorage.setItem('colorScheme', value);
  });
}

function improveContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent(data.get('subject') || 'Website message');
    const body = encodeURIComponent(`From: ${data.get('email') || ''}\n\n${data.get('message') || ''}`);
    location.href = `mailto:varuns0906@gmail.com?subject=${subject}&body=${body}`;
  });
}

addNavigation();
addThemeSelector();
improveContactForm();
