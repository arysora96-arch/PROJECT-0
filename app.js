// ==========================================
// 1. 비밀번호 인증 (1123 & 0000)
// ==========================================
const TEAM_PASSWORD = "1123";

function checkPin() {
  const input = document.getElementById('pin-input');
  const entered = (input.value || '').trim();
  
  if (entered === "1123" || entered === "0000") {
    localStorage.setItem('project0_auth', 'passed');
    unlockApp();
  } else {
    alert('비밀번호가 올바르지 않습니다.');
    input.value = '';
    input.focus();
  }
}

function handlePinKey(event) {
  if (event.key === 'Enter') checkPin();
}

function unlockApp() {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  switchTab('tasks');
  loadTasks();
  loadMeetings();
  loadIdeas();
  loadResources();
}

function logout() {
  if (!confirm('화면을 잠그고 로그아웃할까요?')) return;
  localStorage.removeItem('project0_auth');
  location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('project0_auth') === 'passed') {
    unlockApp();
  } else {
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  }
});

// ==========================================
// 2. Supabase 설정
// ==========================================
const SUPABASE_URL = "https://ykhsjjaspagnplzrabyy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_N-orkQ3J2ew4kxCLMmiYSQ_0ioDhbi5";
window.supabase = window.supabase.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : supabase;

const mDateInput = document.getElementById('m-date');
if (mDateInput) mDateInput.valueAsDate = new Date();

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

// 로컬 캐시 (즉각 반응용)
function getMetaCache(key) {
  try { return JSON.parse(localStorage.getItem('meta_' + key)) || {}; }
  catch(e) { return {}; }
}
function setMetaCache(key, id, field, value) {
  try {
    const cache = getMetaCache(key);
    if (!cache[id]) cache[id] = {};
    cache[id][field] = value;
    localStorage.setItem('meta_' + key, JSON.stringify(cache));
  } catch(e) {}
}

// ==========================================
// 3. 상태 관리 (정렬 & 필터)
// ==========================================
const sortStates = { tasks: 'desc', meetings: 'desc', ideas: 'desc', resources: 'desc' };
const filterStates = { ideas: 'all', resources: 'all' };

function toggleSort(tab) {
  sortStates[tab] = sortStates[tab] === 'desc' ? 'asc' : 'desc';
  const label = document.getElementById(`sort-label-${tab}`);
  if (label) label.innerText = sortStates[tab] === 'desc' ? '최신순 ⬇' : '날짜순 ⬆';
  if (tab === 'tasks') loadTasks();
  if (tab === 'meetings') loadMeetings();
  if (tab === 'ideas') loadIdeas();
  if (tab === 'resources') loadResources();
}

function setFilter(tab, color, btnEl) {
  filterStates[tab] = color;
  btnEl.parentElement.querySelectorAll('.dot-all-btn, .dot-filter-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  if (tab === 'ideas') loadIdeas();
  if (tab === 'resources') loadResources();
}

function setFilterDot(tab, color, dotEl) {
  filterStates[tab] = color;
  dotEl.parentElement.querySelectorAll('.dot-all-btn, .dot-filter-btn').forEach(b => b.classList.remove('active'));
  dotEl.classList.add('active');
  if (tab === 'ideas') loadIdeas();
  if (tab === 'resources') loadResources();
}

function getColorHex(code) {
  switch(code) {
    case 'pink': return 'var(--bm-pink)';
    case 'rose': return 'var(--bm-rose)';
    case 'yellow': return 'var(--bm-yellow)';
    case 'mint': return 'var(--bm-mint)';
    case 'lavender': return 'var(--bm-lavender)';
    default: return 'var(--bm-none)';
  }
}

function selectNewIdeaColor(color, el) {
  document.getElementById('idea-color').value = color;
  document.querySelectorAll('#idea-color-picker .color-dot').forEach(d => d.style.transform = 'scale(1)');
  el.style.transform = 'scale(1.35)';
}

function selectNewResColor(color, el) {
  document.getElementById('res-color').value = color;
  document.querySelectorAll('#res-color-picker .color-dot').forEach(d => d.style.transform = 'scale(1)');
  el.style.transform = 'scale(1.35)';
}

function selectEditColor(type, id, color, el) {
  const input = document.getElementById(`edit-${type}-color-${id}`);
  if (input) input.value = color;
  el.parentElement.querySelectorAll('.color-dot').forEach(d => d.style.transform = 'scale(1)');
  el.style.transform = 'scale(1.35)';
}

window.switchTab = function(type) {
  ['tasks', 'meetings', 'ideas', 'resources'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) { el.classList.remove('active'); el.style.display = 'none'; }
  });
  ['btn-t', 'btn-m', 'btn-i', 'btn-r'].forEach(b => {
    const el = document.getElementById(b);
    if (el) el.classList.remove('active');
  });

  const targetTab = document.getElementById('tab-' + type);
  if (targetTab) { targetTab.classList.add('active'); targetTab.style.display = 'block'; }
  const btnMap = { 'tasks': 'btn-t', 'meetings': 'btn-m', 'ideas': 'btn-i', 'resources': 'btn-r' };
  const targetBtn = document.getElementById(btnMap[type]);
  if (targetBtn) targetBtn.classList.add('active');
};

// ==========================================
// 4. 진행목록 (tasks)
// ==========================================
let editingTaskId = null;

async function loadTasks() {
  const list = document.getElementById('tasks-list');
  if (!list) return;

  const isDesc = sortStates.tasks === 'desc';
  const { data: rawTasks, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: !isDesc });
  if (error || !rawTasks || rawTasks.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:16px; color:var(--rose-muted); font-size:0.92rem;">등록된 작업이 없습니다.</div>';
    return;
  }

  const tCache = getMetaCache('tasks');
  const tasks = rawTasks.map(task => {
    const cached = tCache[task.id] || {};
    return {
      ...task,
      author: task.author || cached.author || '',
      is_starred: task.is_starred !== undefined ? task.is_starred : (cached.is_starred === true)
    };
  });

  list.innerHTML = tasks.map(task => {
    const authorText = task.author ? `작성자: ${escapeHtml(task.author)}` : '';
    if (editingTaskId === task.id) {
      return `
        <div style="padding: 10px; margin-bottom: 5px; background: var(--primary-soft); border-radius: 8px; border: 1.2px solid var(--primary); display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <input type="text" id="edit-task-title-${task.id}" value="${escapeHtml(task.title || '')}" style="flex: 2; min-width: 150px; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size: 0.88rem; color: var(--rose-deep);">
            <input type="text" id="edit-task-author-${task.id}" value="${escapeHtml(task.author)}" placeholder="작성자" style="flex: 1; min-width: 80px; padding: 6px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size: 0.88rem; color: var(--rose-deep);">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 6px;">
            <button onclick="cancelEditTask()" style="padding: 4px 10px; font-size: 0.8rem; border: 1px solid var(--border-strong); background: white; border-radius: 6px; cursor: pointer; color: var(--rose-medium);">취소</button>
            <button onclick="saveEditTask(${task.id})" class="rose-btn" style="padding: 4px 12px; font-size: 0.8rem; border-radius: 6px; width:auto;">저장</button>
          </div>
        </div>
      `;
    }

    const isDone = task.is_completed === true;
    const isStarred = task.is_starred === true;
    const dateTimeStr = formatDateTime(task.created_at);

    return `
      <div style="position: relative; padding: 6px 10px 4px; margin-bottom: 4px; background: white; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 3px;">
        <div style="display: flex; align-items: flex-start; gap: 7px; width: 100%;">
          <input type="checkbox" class="custom-check" ${isDone ? 'checked' : ''} onchange="toggleTask(${task.id}, this.checked)">
          <div class="styled-content-box" style="flex: 1; min-width: 0; text-decoration: ${isDone ? 'line-through' : 'none'}; color: ${isDone ? 'var(--rose-muted)' : 'var(--rose-deep)'}; font-weight: ${isDone ? '400' : '700'};">${escapeHtml(task.title || '')}</div>
        </div>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; padding-left: 24px;">
          ${authorText ? `<span style="font-size: 0.73rem; color: var(--rose-muted); font-weight: 600; line-height: 1;">${authorText}</span>` : ''}
          <span style="font-size: 0.72rem; color: var(--rose-muted); line-height: 1;">${dateTimeStr}</span>
          <button class="star-btn ${isStarred ? 'active' : ''}" onclick="toggleTaskStar(${task.id}, ${!isStarred})" title="중요 표시">★</button>
          <button onclick="startEditTask(${task.id})" style="background: none; border: none; color: var(--rose-medium); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">수정</button>
          <button onclick="deleteTask(${task.id})" style="background: none; border: none; color: var(--rose-muted); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">삭제</button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleTaskStar(id, nextVal) {
  setMetaCache('tasks', id, 'is_starred', nextVal);
  await supabase.from('tasks').update({ is_starred: nextVal }).eq('id', id);
  loadTasks();
}
function startEditTask(id) { editingTaskId = id; loadTasks(); }
function cancelEditTask() { editingTaskId = null; loadTasks(); }

async function saveEditTask(id) {
  const newTitle = document.getElementById(`edit-task-title-${id}`).value.trim();
  const authorInput = document.getElementById(`edit-task-author-${id}`);
  const newAuthor = authorInput ? authorInput.value.trim() : '';
  if (!newTitle) { alert('작업 내용을 입력해주세요.'); return; }
  
  setMetaCache('tasks', id, 'author', newAuthor);
  let { error } = await supabase.from('tasks').update({ title: newTitle, author: newAuthor }).eq('id', id);
  if (error) await supabase.from('tasks').update({ title: newTitle }).eq('id', id);
  editingTaskId = null;
  loadTasks();
}

async function addTask() {
  const input = document.getElementById('task-input');
  const authorInput = document.getElementById('task-author');
  const taskTitle = input.value.trim();
  const author = authorInput ? authorInput.value.trim() : '';
  if (!taskTitle) return;

  let { data, error } = await supabase.from('tasks').insert([{ title: taskTitle, author: author, is_completed: false }]).select();
  if (error) {
    const retry = await supabase.from('tasks').insert([{ title: taskTitle, is_completed: false }]).select();
    data = retry.data;
  }
  const newId = (data && data) ? data.id : (data ? data.id : null);
  if (newId) setMetaCache('tasks', newId, 'author', author);

  input.value = '';
  if (authorInput) authorInput.value = '';
  loadTasks();
}
function handleTaskKey(event) { if (event.key === 'Enter') addTask(); }

async function toggleTask(id, status) {
  await supabase.from('tasks').update({ is_completed: status }).eq('id', id);
  loadTasks();
}
async function deleteTask(id) {
  if (!confirm('이 작업을 삭제할까요?')) return;
  await supabase.from('tasks').delete().eq('id', id);
  loadTasks();
}

// ==========================================
// 5. 회의록 (meetings)
// ==========================================
let editingMeetingId = null;

async function loadMeetings() {
  const list = document.getElementById('meetings-list');
  if (!list) return;

  const isDesc = sortStates.meetings === 'desc';
  const { data: rawMeetings, error } = await supabase.from('meetings').select('*');
  if (error || !rawMeetings || rawMeetings.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:16px; color:var(--rose-muted); font-size:0.92rem;">등록된 회의록이 없습니다.</div>';
    return;
  }

  const mCache = getMetaCache('meetings');
  let meetings = rawMeetings.map(m => {
    const cached = mCache[m.id] || {};
    return {
      ...m,
      author: m.author || cached.author || '',
      is_starred: m.is_starred !== undefined ? m.is_starred : (cached.is_starred === true)
    };
  });

  meetings.sort((a, b) => {
    const timeA = new Date(a.created_at || a.meeting_date).getTime();
    const timeB = new Date(b.created_at || b.meeting_date).getTime();
    return isDesc ? (timeB - timeA) : (timeA - timeB);
  });

  list.innerHTML = meetings.map(m => {
    const authorText = m.author ? `작성자: ${escapeHtml(m.author)}` : '';
    const isStarred = m.is_starred === true;
    const dateTimeStr = formatDateTime(m.created_at || m.meeting_date);

    if (editingMeetingId === m.id) {
      return `
        <div style="padding: 10px; margin-bottom: 6px; background: var(--primary-soft); border-radius: 8px; border: 1.2px solid var(--primary);">
          <div style="font-weight: 800; color: var(--rose-deep); margin-bottom: 5px; font-size: 0.85rem;">회의록 수정</div>
          <div style="display: flex; gap: 6px; margin-bottom: 5px; flex-wrap: wrap;">
            <input type="date" id="edit-m-date-${m.id}" value="${m.meeting_date || ''}" style="flex: 1; padding: 5px 7px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
            <input type="text" id="edit-m-author-${m.id}" value="${escapeHtml(m.author)}" placeholder="작성자" style="flex: 1; padding: 5px 7px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
          </div>
          <textarea id="edit-m-content-${m.id}" rows="2" style="width: 100%; box-sizing: border-box; padding: 6px 8px; margin-bottom: 6px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.88rem; color: var(--rose-deep);">${escapeHtml(m.content || '')}</textarea>
          <div style="display: flex; justify-content: flex-end; gap: 5px;">
            <button onclick="cancelEditMeeting()" style="padding: 4px 10px; border: 1px solid var(--border-strong); background: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: var(--rose-medium);">취소</button>
            <button onclick="saveEditMeeting(${m.id})" class="rose-btn" style="padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; width: auto;">저장</button>
          </div>
        </div>
      `;
    }

    return `
      <div style="position: relative; padding: 6px 10px 4px; margin-bottom: 4px; background: white; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-bottom: 2px;">
          <button class="star-btn ${isStarred ? 'active' : ''}" onclick="toggleMeetingStar(${m.id}, ${!isStarred})" title="중요 표시">★</button>
          <button onclick="startEditMeeting(${m.id})" style="background: none; border: none; color: var(--rose-medium); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">수정</button>
          <button onclick="deleteMeeting(${m.id})" style="background: none; border: none; color: var(--rose-muted); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">삭제</button>
        </div>
        <div class="styled-content-box" style="margin-bottom: 3px;">${escapeHtml(m.content || '')}</div>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
          ${authorText ? `<span style="font-size: 0.73rem; color: var(--rose-muted); font-weight: 600; line-height: 1;">${authorText}</span>` : ''}
          <span style="font-size: 0.72rem; color: var(--rose-muted); line-height: 1;">${dateTimeStr || m.meeting_date || ''}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleMeetingStar(id, nextVal) {
  setMetaCache('meetings', id, 'is_starred', nextVal);
  await supabase.from('meetings').update({ is_starred: nextVal }).eq('id', id);
  loadMeetings();
}
function startEditMeeting(id) { editingMeetingId = id; loadMeetings(); }
function cancelEditMeeting() { editingMeetingId = null; loadMeetings(); }

async function saveEditMeeting(id) {
  const date = document.getElementById(`edit-m-date-${id}`).value;
  const author = document.getElementById(`edit-m-author-${id}`).value.trim();
  const content = document.getElementById(`edit-m-content-${id}`).value.trim();
  if (!content) { alert('회의 내용을 입력해주세요.'); return; }
  
  setMetaCache('meetings', id, 'author', author);
  let { error } = await supabase.from('meetings').update({ meeting_date: date, content: content, author: author }).eq('id', id);
  if (error) await supabase.from('meetings').update({ meeting_date: date, content: content }).eq('id', id);
  editingMeetingId = null;
  loadMeetings();
}

async function addMeeting() {
  const date = document.getElementById('m-date').value;
  const author = document.getElementById('m-author').value.trim();
  const content = document.getElementById('m-content').value.trim();
  if (!content) { alert('회의 내용을 입력해주세요.'); return; }
  
  let { data, error } = await supabase.from('meetings').insert([{ meeting_date: date, content: content, author: author }]).select();
  if (error) {
    const retry = await supabase.from('meetings').insert([{ meeting_date: date, content: content }]).select();
    data = retry.data;
  }
  const newId = (data && data) ? data.id : (data ? data.id : null);
  if (newId) setMetaCache('meetings', newId, 'author', author);

  document.getElementById('m-content').value = "";
  loadMeetings();
}
async function deleteMeeting(id) {
  if (!confirm("이 회의록을 삭제할까요?")) return;
  await supabase.from('meetings').delete().eq('id', id);
  loadMeetings();
}

// ==========================================
// 6. 아이디어 (ideas)
// ==========================================
let editingIdeaId = null;

async function loadIdeas() {
  const container = document.getElementById('ideas-list');
  if (!container) return;

  const isDesc = sortStates.ideas === 'desc';
  const { data: rawIdeas, error } = await supabase.from('ideas').select('*').order('created_at', { ascending: !isDesc });
  if (error) return;

  const iCache = getMetaCache('ideas');
  let ideas = (rawIdeas || []).map(item => {
    const cached = iCache[item.id] || {};
    return {
      ...item,
      author: item.author || cached.author || '',
      bookmark_color: item.bookmark_color || cached.bookmark_color || 'none'
    };
  });

  if (filterStates.ideas !== 'all') {
    ideas = ideas.filter(i => (i.bookmark_color || 'none') === filterStates.ideas);
  }

  if (ideas.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--rose-muted); font-size:0.92rem;">선택된 조건의 아이디어가 없습니다.</div>';
    return;
  }

  container.innerHTML = ideas.map(item => {
    const color = item.bookmark_color || 'none';
    const colorHex = getColorHex(color);
    const authorText = item.author ? `작성자: ${escapeHtml(item.author)}` : '';

    if (editingIdeaId === item.id) {
      return `
        <div style="padding: 10px; margin-bottom: 6px; background: var(--primary-soft); border-radius: 8px; border: 1.2px solid var(--primary); display: flex; flex-direction: column;">
          <div style="font-weight: 800; color: var(--rose-deep); margin-bottom: 5px; font-size: 0.85rem;">아이디어 수정</div>
          <div style="display: flex; gap: 6px; margin-bottom: 5px; flex-wrap: wrap;">
            <input type="text" id="edit-idea-title-${item.id}" value="${escapeHtml(item.title || '')}" placeholder="아이디어 제목" style="flex: 1.6; min-width: 140px; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
            <input type="text" id="edit-idea-author-${item.id}" value="${escapeHtml(item.author)}" placeholder="작성자" style="flex: 1; min-width: 90px; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
          </div>
          <textarea id="edit-idea-desc-${item.id}" rows="2" style="width: 100%; box-sizing: border-box; padding: 5px 8px; margin-bottom: 5px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">${escapeHtml(item.description || '')}</textarea>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 0.72rem; color: var(--rose-muted); font-weight: 700;">책갈피:</span>
              <input type="hidden" id="edit-idea-color-${item.id}" value="${color}">
              <div class="color-picker-mini" id="edit-idea-picker-${item.id}">
                <div class="color-dot" style="background: var(--bm-none); transform: ${color === 'none' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('idea', ${item.id}, 'none', this)" title="기본"></div>
                <div class="color-dot" style="background: var(--bm-pink); transform: ${color === 'pink' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('idea', ${item.id}, 'pink', this)"></div>
                <div class="color-dot" style="background: var(--bm-rose); transform: ${color === 'rose' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('idea', ${item.id}, 'rose', this)"></div>
                <div class="color-dot" style="background: var(--bm-yellow); transform: ${color === 'yellow' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('idea', ${item.id}, 'yellow', this)"></div>
                <div class="color-dot" style="background: var(--bm-mint); transform: ${color === 'mint' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('idea', ${item.id}, 'mint', this)"></div>
                <div class="color-dot" style="background: var(--bm-lavender); transform: ${color === 'lavender' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('idea', ${item.id}, 'lavender', this)"></div>
              </div>
            </div>
            <div style="display: flex; gap: 5px;">
              <button onclick="cancelEditIdea()" style="padding: 4px 10px; border: 1px solid var(--border-strong); background: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: var(--rose-medium);">취소</button>
              <button onclick="saveEditIdea(${item.id})" class="rose-btn" style="padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; width: auto;">저장</button>
            </div>
          </div>
        </div>
      `;
    }

    const dateTimeStr = formatDateTime(item.created_at);

    return `
      <div class="card-item" style="padding: 6px 10px 6px 14px; margin-bottom: 4px; display: flex; flex-direction: column;">
        <div class="card-bookmark-strip" style="background-color: ${colorHex};"></div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <span style="font-weight: 400; color: var(--rose-deep); font-size: 0.94rem; padding-left: 8px;">${escapeHtml(item.title || '')}</span>
          <div style="display: flex; align-items: center; gap: 5px;">
            <button onclick="startEditIdea(${item.id})" style="background: none; border: none; color: var(--rose-medium); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">수정</button>
            <button onclick="deleteIdea(${item.id})" style="background: none; border: none; color: var(--rose-muted); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">삭제</button>
          </div>
        </div>
        <div class="styled-content-box" style="margin-bottom: 4px;">${escapeHtml(item.description || '')}</div>
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 2px;">
          ${authorText ? `<span style="font-size: 0.73rem; color: var(--rose-muted); font-weight: 600; line-height: 1;">${authorText}</span>` : ''}
          <span style="font-size: 0.72rem; color: var(--rose-muted); line-height: 1;">${dateTimeStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

function startEditIdea(id) { editingIdeaId = id; loadIdeas(); }
function cancelEditIdea() { editingIdeaId = null; loadIdeas(); }

async function saveEditIdea(id) {
  const title = document.getElementById(`edit-idea-title-${id}`).value.trim();
  const author = document.getElementById(`edit-idea-author-${id}`).value.trim();
  const desc = document.getElementById(`edit-idea-desc-${id}`).value.trim();
  const color = document.getElementById(`edit-idea-color-${id}`).value;
  if (!title) { alert('아이디어 제목을 입력해주세요.'); return; }
  
  setMetaCache('ideas', id, 'author', author);
  setMetaCache('ideas', id, 'bookmark_color', color);
  let { error } = await supabase.from('ideas').update({ title: title, description: desc, author: author, bookmark_color: color }).eq('id', id);
  if (error) await supabase.from('ideas').update({ title: title, description: desc }).eq('id', id);
  editingIdeaId = null;
  loadIdeas();
}

async function addIdea() {
  const titleInput = document.getElementById('idea-title');
  const authorInput = document.getElementById('idea-author');
  const descInput = document.getElementById('idea-desc');
  const colorInput = document.getElementById('idea-color');
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const desc = descInput.value.trim();
  const color = colorInput.value || 'none';
  if (!title) { alert('아이디어 제목을 입력해주세요.'); return; }

  let { data, error } = await supabase.from('ideas').insert([{ title: title, description: desc, author: author, bookmark_color: color }]).select();
  if (error) {
    const retry = await supabase.from('ideas').insert([{ title: title, description: desc }]).select();
    data = retry.data;
  }
  const newId = (data && data) ? data.id : (data ? data.id : null);
  if (newId) {
    setMetaCache('ideas', newId, 'author', author);
    setMetaCache('ideas', newId, 'bookmark_color', color);
  }

  titleInput.value = '';
  authorInput.value = '';
  descInput.value = '';
  colorInput.value = 'none';
  document.querySelectorAll('#idea-color-picker .color-dot').forEach((d, idx) => d.style.transform = idx === 0 ? 'scale(1.35)' : 'scale(1)');
  loadIdeas();
}
async function deleteIdea(id) {
  if (!confirm('이 아이디어를 삭제할까요?')) return;
  await supabase.from('ideas').delete().eq('id', id);
  loadIdeas();
}

// ==========================================
// 7. 자료 링크 (resources)
// ==========================================
let editingResourceId = null;

async function loadResources() {
  const container = document.getElementById('resources-list');
  if (!container) return;

  const isDesc = sortStates.resources === 'desc';
  const { data: rawResources, error } = await supabase.from('resources').select('*').order('created_at', { ascending: !isDesc });
  if (error) return;

  const rCache = getMetaCache('resources');
  let resources = (rawResources || []).map(item => {
    const cached = rCache[item.id] || {};
    return {
      ...item,
      author: item.author || cached.author || '',
      description: item.description || cached.description || '',
      bookmark_color: item.bookmark_color || cached.bookmark_color || 'none',
      saved_color: item.saved_color || cached.saved_color || 'pink'
    };
  });

  if (filterStates.resources !== 'all') {
    resources = resources.filter(i => (i.bookmark_color || 'none') === filterStates.resources);
  }

  if (resources.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--rose-muted); font-size:0.92rem;">선택된 조건의 링크가 없습니다.</div>';
    return;
  }

  container.innerHTML = resources.map(item => {
    const authorText = item.author ? `작성자: ${escapeHtml(item.author)}` : '';
    const currentColor = item.bookmark_color || 'none';
    const savedColor = item.saved_color || 'pink';
    const isBookmarked = currentColor !== 'none';
    const activeColor = isBookmarked ? currentColor : savedColor;
    const toggleDotColorHex = isBookmarked ? getColorHex(currentColor) : '#dcd6d8';

    if (editingResourceId === item.id) {
      return `
        <div style="padding: 10px; margin-bottom: 6px; background: var(--primary-soft); border-radius: 8px; border: 1.2px solid var(--primary); display: flex; flex-direction: column;">
          <div style="font-weight: 800; color: var(--rose-deep); margin-bottom: 5px; font-size: 0.85rem;">자료 수정</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 5px;">
            <input type="text" id="edit-res-title-${item.id}" value="${escapeHtml(item.title || '')}" placeholder="자료 이름" style="flex: 1.2; min-width: 130px; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
            <input type="text" id="edit-res-author-${item.id}" value="${escapeHtml(item.author)}" placeholder="작성자" style="flex: 0.8; min-width: 80px; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
            <input type="url" id="edit-res-url-${item.id}" value="${escapeHtml(item.url || '')}" placeholder="URL 링크" style="flex: 1.5; min-width: 150px; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.85rem; color: var(--rose-deep);">
          </div>
          <textarea id="edit-res-desc-${item.id}" rows="2" placeholder="자료 세부내용" style="width: 100%; box-sizing: border-box; padding: 5px 8px; margin-bottom: 5px; border: 1px solid var(--border-strong); border-radius: 6px; font-size:0.88rem; color: var(--rose-deep);">${escapeHtml(item.description || '')}</textarea>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-size: 0.72rem; color: var(--rose-muted); font-weight: 700;">책갈피 색상:</span>
              <input type="hidden" id="edit-res-color-${item.id}" value="${activeColor}">
              <div class="color-picker-mini" id="edit-res-picker-${item.id}">
                <div class="color-dot" style="background: var(--bm-pink); transform: ${activeColor === 'pink' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('res', ${item.id}, 'pink', this)"></div>
                <div class="color-dot" style="background: var(--bm-rose); transform: ${activeColor === 'rose' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('res', ${item.id}, 'rose', this)"></div>
                <div class="color-dot" style="background: var(--bm-yellow); transform: ${activeColor === 'yellow' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('res', ${item.id}, 'yellow', this)"></div>
                <div class="color-dot" style="background: var(--bm-mint); transform: ${activeColor === 'mint' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('res', ${item.id}, 'mint', this)"></div>
                <div class="color-dot" style="background: var(--bm-lavender); transform: ${activeColor === 'lavender' ? 'scale(1.35)' : 'scale(1)'};" onclick="selectEditColor('res', ${item.id}, 'lavender', this)"></div>
              </div>
            </div>
            <div style="display: flex; gap: 5px;">
              <button onclick="cancelEditResource()" style="padding: 4px 10px; border: 1px solid var(--border-strong); background: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: var(--rose-medium);">취소</button>
              <button onclick="saveEditResource(${item.id})" class="rose-btn" style="padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; width: auto;">저장</button>
            </div>
          </div>
        </div>
      `;
    }

    const dateTimeStr = formatDateTime(item.created_at);

    return `
      <div class="card-item" style="padding: 8px 10px 6px 10px; margin-bottom: 4px; display: flex; flex-direction: column;">
        <div class="resource-content-card">
          <div class="resource-card-title">
            <span>📄</span>
            <span>${escapeHtml(item.title || '자료 이름 없음')}</span>
          </div>
          <div class="resource-card-desc">${escapeHtml(item.description || '기록된 세부 메모가 없습니다.')}</div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-top: 1px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 7px; min-width: 0;">
            <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer" style="color: var(--rose-link); text-decoration: underline; word-break: break-all; font-weight: 600; font-size: 0.78rem;">
              ${escapeHtml(item.url || '')}
            </a>
            <div class="bookmark-toggle-btn" 
                 style="background: ${toggleDotColorHex}; opacity: ${isBookmarked ? '1' : '0.45'};" 
                 onclick="toggleResourceBookmark(${item.id}, '${currentColor}', '${savedColor}')" 
                 title="${isBookmarked ? '북마크 끄기' : '북마크 켜기'}"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 7px; margin-left: auto;">
            ${authorText ? `<span style="font-size: 0.73rem; color: var(--rose-muted); font-weight: 600; line-height: 1;">${authorText}</span>` : ''}
            <span style="font-size: 0.72rem; color: var(--rose-muted); line-height: 1;">${dateTimeStr}</span>
            <button onclick="startEditResource(${item.id})" style="background: none; border: none; color: var(--rose-medium); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">수정</button>
            <button onclick="deleteResource(${item.id})" style="background: none; border: none; color: var(--rose-muted); cursor: pointer; font-size: 0.78rem; font-weight: 700; padding: 0 1px;">삭제</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleResourceBookmark(id, currentColor, savedColor) {
  const nextColor = (currentColor === 'none') ? (savedColor || 'pink') : 'none';
  if (nextColor !== 'none') setMetaCache('resources', id, 'saved_color', nextColor);
  setMetaCache('resources', id, 'bookmark_color', nextColor);
  await supabase.from('resources').update({ bookmark_color: nextColor }).eq('id', id);
  loadResources();
}
function startEditResource(id) { editingResourceId = id; loadResources(); }
function cancelEditResource() { editingResourceId = null; loadResources(); }

async function saveEditResource(id) {
  const title = document.getElementById(`edit-res-title-${id}`).value.trim();
  const author = document.getElementById(`edit-res-author-${id}`).value.trim();
  const desc = document.getElementById(`edit-res-desc-${id}`).value.trim();
  const color = document.getElementById(`edit-res-color-${id}`).value || 'pink';
  let url = document.getElementById(`edit-res-url-${id}`).value.trim();
  if (!title || !url) { alert('자료 이름과 링크 URL을 모두 입력해주세요.'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

  setMetaCache('resources', id, 'author', author);
  setMetaCache('resources', id, 'description', desc);
  setMetaCache('resources', id, 'saved_color', color);
  setMetaCache('resources', id, 'bookmark_color', color);

  let { error } = await supabase.from('resources').update({ 
    title: title, url: url, description: desc, author: author, bookmark_color: color 
  }).eq('id', id);
  if (error) await supabase.from('resources').update({ title: title, url: url, description: desc }).eq('id', id);
  editingResourceId = null;
  loadResources();
}

async function addResource() {
  const titleInput = document.getElementById('res-title');
  const authorInput = document.getElementById('res-author');
  const descInput = document.getElementById('res-desc');
  const urlInput = document.getElementById('res-url');
  const colorInput = document.getElementById('res-color');
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const desc = descInput.value.trim();
  const color = colorInput.value || 'pink';
  let url = urlInput.value.trim();
  if (!title || !url) { alert('자료 이름과 링크 URL을 모두 입력해주세요.'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

  let { data, error } = await supabase.from('resources').insert([{ 
    title: title, url: url, description: desc, author: author, bookmark_color: color 
  }]).select();

  if (error) {
    const retry = await supabase.from('resources').insert([{ title: title, url: url, description: desc }]).select();
    data = retry.data;
  }
  const newId = (data && data) ? data.id : (data ? data.id : null);
  if (newId) {
    setMetaCache('resources', newId, 'author', author);
    setMetaCache('resources', newId, 'description', desc);
    setMetaCache('resources', newId, 'bookmark_color', color);
    setMetaCache('resources', newId, 'saved_color', color);
  }

  titleInput.value = '';
  authorInput.value = '';
  descInput.value = '';
  urlInput.value = '';
  loadResources();
}
async function deleteResource(id) {
  if (!confirm('이 링크를 삭제할까요?')) return;
  await supabase.from('resources').delete().eq('id', id);
  loadResources();
}