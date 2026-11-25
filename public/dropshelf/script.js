'use strict';
/* njvan.net copy of dropshelf-site/script.js: its own header and mobile menu are dropped (the page sits inside
   njvan.net's header), and the release dialog says it is coming soon. Port changes from the original by hand.
   RELEASE CONFIGURATION: these values are deliberately provisional.
   Set a verified HTTPS App Store URL and confirmed labels before launch.
   Set detailsConfirmed to true only after checking all three values.
   No network requests, analytics, cookies, storage or file access are used. */
const SITE_CONFIG = Object.freeze({
  appStoreUrl: '',
  price: 'Free to download',
  minimumMacOS: 'macOS 15 or later',
  detailsConfirmed: false
});

document.documentElement.classList.add('js');
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
$$('[data-price]').forEach(el => { el.textContent = SITE_CONFIG.price; });
$$('[data-macos]').forEach(el => { el.textContent = SITE_CONFIG.minimumMacOS; });
const dialog = $('#preview-dialog');
const content = $('#dialog-content');
let opener;
function openDialog(markup, trigger) {
  opener = trigger || document.activeElement;
  content.innerHTML = markup;
  if (!dialog.open) dialog.showModal();
  $('.dialog-close').focus();
}
function closeDialog() { dialog.close(); }
$('.dialog-close').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog();
});
dialog.addEventListener('close', () => { if (opener && opener.isConnected) opener.focus(); });
function storeURL() {
  try {
    const url = new URL(SITE_CONFIG.appStoreUrl);
    return url.protocol === 'https:' && url.hostname === 'apps.apple.com' ? url.href : '';
  } catch { return ''; }
}
const verifiedDestination = SITE_CONFIG.detailsConfirmed && storeURL();
if (verifiedDestination) {
  $$('[data-download]').forEach(link => { link.href = verifiedDestination; });
  $('.release-note').textContent = `${SITE_CONFIG.price} · Requires ${SITE_CONFIG.minimumMacOS}`;
  $('.download-action p').textContent = `${SITE_CONFIG.price} · Requires ${SITE_CONFIG.minimumMacOS}`;
  $('.release-details').textContent = 'See the App Store listing for current availability and compatibility.';
  $$('#support details')[2].querySelector('p').textContent = 'Use any Get DropShelf button to visit the verified App Store listing. Check the listing for current pricing and compatibility.';
} else {
  $$('[data-download]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    openDialog('<img src="assets/app-icon.png" width="72" height="72" alt=""><h2 class="dialog-title" id="dialog-title">DropShelf is coming soon.</h2><p class="dialog-copy">DropShelf is coming soon to the Mac App Store. This page will link to the listing when it is live.</p><ul class="release-list"><li>Price: <strong>free to download</strong>, with DropShelf Pro as a one-time in-app purchase</li><li>Requires: <strong>macOS 15 or later</strong>, Apple silicon or Intel</li><li>App Store: coming soon</li></ul><button class="button" id="back-to-page">Back to the page</button>', event.currentTarget);
    $('#back-to-page').addEventListener('click', closeDialog);
  }));
}
const modes = {
  link: { badge: '↗', label: 'Keep the original right where it is.', explanation: 'Link keeps your original in place. This is a visual demo; no files are accessed.' },
  copy: { badge: '+', label: 'A separate copy. The original stays put.', explanation: 'Copy creates an independent file in managed storage and keeps the original. Visual demo only; no files are copied.' },
  move: { badge: '→', label: 'Give your file a home in DropShelf.', explanation: 'Move transfers a file into managed storage. The app verifies the transfer before sending the original to the Trash. Visual demo only; no files are moved.' }
};
$$('[data-mode]').forEach(button => button.addEventListener('click', () => {
  $$('[data-mode]').forEach(el => { const active = el === button; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
  const mode = modes[button.dataset.mode];
  $('#operation-badge').textContent = mode.badge;
  $('#art-label').textContent = mode.label;
  $('#mode-description').textContent = mode.explanation;
}));
const shots = [
  { key: 'library', title: 'A place for the whole project.', short: 'Library', image: 'assets/library.png', alt: 'Actual DropShelf library screenshot with sample files, shelf navigation and search.', copy: 'Bring files, folders and links together in visual shelves. Browse the library when you need the bigger picture.' },
  { key: 'shelf', title: 'Keep the next thing within reach.', short: 'Floating shelf', image: 'assets/floating-shelf.png', alt: 'Actual compact DropShelf floating panel with sample files.', copy: 'A compact floating shelf keeps the files you’re working with close at hand. Switch shelves as you switch tasks.' },
  { key: 'menu', title: 'Only a menu-bar click away.', short: 'Menu bar', image: 'assets/menu-bar.png', alt: 'Actual DropShelf menu showing Quick Shelf, other shelves, the floating shelf shortcut and settings.', copy: 'Open a shelf, bring back the floating panel or jump into the library from your Mac’s menu bar.' }
];
let tourStep = 0;
let dialogType = 'tour';
function renderPreview() {
  const shot = shots[tourStep];
  content.innerHTML = `<h2 class="dialog-title" id="dialog-title">${shot.title}</h2><p class="dialog-copy">${shot.copy}</p><img class="dialog-image" src="${shot.image}" alt="${shot.alt}"><p class="visual-caption">Actual development-build screenshot with sample files; final appearance may vary.</p>`;
  if (dialogType === 'tour') {
    content.insertAdjacentHTML('beforeend', `<div class="tour-nav"><button class="button button-secondary" id="tour-back" ${tourStep === 0 ? 'disabled' : ''}>Previous</button><p>Step ${tourStep + 1} of ${shots.length}</p><button class="button" id="tour-next">${tourStep === shots.length - 1 ? 'Finish tour' : 'Next'}</button></div>`);
    $('#tour-back').addEventListener('click', () => { tourStep--; renderPreview(); $('#tour-next').focus(); });
    $('#tour-next').addEventListener('click', () => { if (tourStep === shots.length - 1) closeDialog(); else { tourStep++; renderPreview(); $('#tour-next').focus(); } });
  } else {
    content.insertAdjacentHTML('beforeend', `<div class="gallery-tabs" aria-label="Choose screenshot">${shots.map((s, i) => `<button data-shot="${i}" aria-pressed="${i === tourStep}">${s.short}</button>`).join('')}</div>`);
    $$('[data-shot]', content).forEach(button => button.addEventListener('click', () => { tourStep = Number(button.dataset.shot); renderPreview(); $(`[data-shot="${tourStep}"]`, content).focus(); }));
  }
}
function showPreview(index, type, trigger) {
  tourStep = index; dialogType = type;
  openDialog('', trigger); renderPreview();
}
$$('[data-tour]').forEach(button => { button.hidden = false; button.addEventListener('click', event => showPreview(0, 'tour', event.currentTarget)); });
$$('[data-gallery]').forEach(button => { button.hidden = false; button.addEventListener('click', event => showPreview(0, 'gallery', event.currentTarget)); });
$$('[data-image]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showPreview(shots.findIndex(s => s.key === link.dataset.image), 'gallery', event.currentTarget); }));
