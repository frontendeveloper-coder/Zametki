document.addEventListener('DOMContentLoaded', () => {

  let isPreview = false;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const searchInput = $('#searchInput');
  const btnNew = $('#btn-new');
  const noteList = $('#note-list');
  const previewEl = $('#preview');
  const formEl = $('#note-form');
  const btnPreview = $('#btn-preview');
  const btnPin = $('#btn-pin');
  const btnDelete = $('#btn-delete');
  const headerTitle = document.querySelector('#preview-title');
  const btnSave = document.getElementById('btn-save');


  const titleInput = $('#id_title') || document.querySelector('input[name="title"]') || null;
  const textInput = $('#id_text') || document.querySelector('textarea[name="text"]') || null;

  function getCSRF() {
    return document.cookie.split('; ').find(c => c.startsWith('csrftoken='))?.split('=')[1] || '';
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function renderMarkdown(text = '') {
    if (!text) return '';

    let html = escapeHtml(text);

    // Заголовки
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // Жирный
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Списки (ПРАВИЛЬНО)
    html = html.replace(
      /(?:^|\n)(- .*(?:\n- .*)*)/g,
      block => {
        const items = block
          .trim()
          .split('\n')
          .map(line => `<li>${line.slice(2)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
    );

    // Параграфы
    html = html
      .split(/\n{2,}/)
      .map(p => {
        if (
          p.startsWith('<h') ||
          p.startsWith('<ul>') ||
          p.startsWith('<p>')
        ) {
          return p;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');

    // Теги
    html = html.replace(
      /#([\wа-яё\-]+)/gi,
      '<span class="tag">#$1</span>'
    );

    return html;
  }


  function setActiveItem(id) {
    $$('.item').forEach(it => it.classList.toggle('active', String(it.dataset.id) === String(id)));
    if (id) {
      loadNote(id);
      
    } else {
      if (titleInput) titleInput.value = '';
      if (textInput) textInput.value = '';
      updateHeaderTitle('');
      hidePreview();
    }
  }

  async function loadNote(id) {
    try {
      const r = await fetch(`/api/note/${id}/`);
      if (!r.ok) throw new Error('load failed ' + r.status);
      const j = await r.json();

      titleInput.value = j.title || '';
      if (headerTitle) headerTitle.textContent = j.title || '';

      textInput.value = j.text || '';
      btnPin.textContent = j.pinned ? '⭐ Открепить' : '⭐ Закрепить';
      setStatus('Сохранено', 'saved');
    } catch (e) {
      console.error(e);
      setStatus('Ошибка загрузки', 'error');
    }
  }


  function updateHeaderTitle(t) {
    if (titleInput && titleInput.tagName) {
      // если поле заголовка есть в header — ничего не делаем доп.
    }
  }

  async function createNote() {
    try {
      const r = await fetch('/api/new/', { method: 'POST', headers: { 'X-CSRFToken': getCSRF() } });
      if (!r.ok) throw new Error('new failed');
      const j = await r.json();
      const node = document.createElement('div');
      node.className = 'item';
      node.dataset.id = j.id;
      node.textContent = j.title || 'Без названия';
      node.addEventListener('click', onItemClick);
      noteList.prepend(node);
      setActiveItem(j.id);
    } catch (e) { console.error(e); }
  }

  async function saveActiveNote(id) {
    if (!id) return;
    const payload = { title: titleInput ? titleInput.value : '', text: textInput ? textInput.value : '' };
    try {
      const r = await fetch(`/api/save/${id}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('save failed ' + r.status);
      const el = document.querySelector(`.item[data-id="${id}"]`);
      if (el) el.textContent = payload.title || 'Без названия';
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteActiveNote() {
    const active = document.querySelector('.item.active');
    if (!active) return;
    if (!confirm('Вы уверены, что хотите удалить заметку?')) return;
    const id = active.dataset.id;
    try {
      const r = await fetch(`/api/delete/${id}/`, { method: 'POST', headers: { 'X-CSRFToken': getCSRF() } });
      if (!r.ok) throw new Error('delete failed');
      active.remove();
      setActiveItem(null);
    } catch (e) { console.error(e); }
  }

  async function togglePin() {
    const active = document.querySelector('.item.active');
    if (!active) return;
    try {
      const r = await fetch(`/api/pin/${active.dataset.id}/`, { method: 'POST', headers: { 'X-CSRFToken': getCSRF() } });
      if (!r.ok) throw new Error('pin failed');
      location.reload();
    } catch (e) { console.error(e); }
  }

  function onItemClick(e) {
    setActiveItem(this.dataset.id);
  }
  $$('.item').forEach(it => it.addEventListener('click', onItemClick));
  if (btnNew) btnNew.addEventListener('click', createNote);
  if (btnDelete) btnDelete.addEventListener('click', deleteActiveNote);
  if (btnPin) btnPin.addEventListener('click', togglePin);

  // autosave
  let saveTimer = null;
  $$('.editor input, .editor textarea').forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {
      const active = document.querySelector('.item.active');
      if (!active) return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveActiveNote(active.dataset.id), 700);
    });
  });

  // search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      let first = null;
      $$('.item').forEach(it => {
        const show = it.textContent.toLowerCase().includes(q);
        it.style.display = show ? 'block' : 'none';
        if (show && !first) first = it;
      });
      if (first) first.click();
    });
  }

  // preview helpersJetBrains Darcula
  function showPreviewForCurrent() {
    const title = titleInput ? (titleInput.value || 'Без названия') : 'Без названия';
    const text = textInput ? (textInput.value || '') : '';
    previewEl.innerHTML = `<h1>${escapeHtml(title)}</h1><div class="content">${renderMarkdown(text)}</div>`;
    previewEl.classList.remove('hidden');
    // tags clickable
    previewEl.querySelectorAll('.tag').forEach(t => {
      t.addEventListener('click', () => {
        const tag = t.dataset.tag.toLowerCase();
        $$('.item').forEach(it => {
          it.style.display = it.textContent.toLowerCase().includes('#' + tag) || it.textContent.toLowerCase().includes(tag) ? 'block' : 'none';
        });
      });
    });
  }
  function hidePreview() {
    previewEl.classList.add('hidden');
  }

  // preview toggle (btnPreview находится вне #note-form — поэтому не скрывается)
  if (btnPreview && previewEl && formEl) {
    btnPreview.addEventListener('click', () => {
      isPreview = !isPreview;

      if (isPreview) {
        // PREVIEW: собрать содержимое и показать preview
        const title = (titleInput && titleInput.value) || 'Без названия';
        const text = (textInput && textInput.value) || '';

        // наполняем превью
        previewEl.innerHTML = `
        <h1>${escapeHtml(title)}</h1>
        <div class="content">${renderMarkdown(text)}</div>
      `;

        // скрыть форму/поле заголовка в header, показать статичный заголовок
        formEl.classList.add('hidden');
        if (titleInput) titleInput.classList.add('hidden');      // если поле заголовка в header — прячем
        if (headerTitle) { headerTitle.textContent = title; headerTitle.classList.remove('hidden'); }

        previewEl.classList.remove('hidden');
        btnPreview.textContent = '✏️ Редактирование';
        btnPreview.style.width = '200px', AlignItem = 'left';
        const header = document.querySelector('.editor-header');
        header.style.justifyItems = 'end', marginTop = '-15px';
        previewEl.style.marginTop = '-94px';
        previewEl.style.marginLeft = '10px';
        
      } else {
        // EDIT: вернуть всё назад
        previewEl.classList.add('hidden');
        formEl.classList.remove('hidden');
        if (titleInput) titleInput.classList.remove('hidden');
        if (headerTitle) headerTitle.classList.add('hidden');

        btnPreview.textContent = '👁 Просмотр';
      }
    });
  }


});


