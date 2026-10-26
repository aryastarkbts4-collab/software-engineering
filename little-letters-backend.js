'use strict';
// Little Letters cloud integration: Supabase Auth + user-owned drafts.
// The publishable key is intended for browsers. Database RLS enforces ownership.
(function () {
  const gate = document.getElementById('entryGate');
  const memberForm = document.getElementById('memberForm');
  const notice = memberForm.querySelector('.entry-notice');
  const existingSubmit = memberForm.querySelector('button[type="submit"]');
  const headerActions = document.querySelector('.header-actions');
  const workspace = document.getElementById('workspace');
  const url = 'https://avwmbsaejofaksfmrpqv.supabase.co';
  const publishableKey = 'sb_publishable_O3RAJs0EN_dnytIm4ntGtQ_4MN0YVqm';

  if (!window.supabase || !window.supabase.createClient) {
    notice.textContent = 'Unable to load Supabase. Check your connection, or continue as guest (local drafts only).';
    return;
  }
  const client = window.supabase.createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  let currentUser = null;
  let currentDraftId = null;
  let signingUp = false;
  let busy = false;

  const passwordLabel = document.createElement('label');
  passwordLabel.htmlFor = 'memberPassword';
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.id = 'memberPassword';
  passwordInput.type = 'password';
  passwordInput.autocomplete = 'current-password';
  passwordInput.minLength = 6;
  passwordInput.required = true;
  passwordInput.placeholder = 'At least 6 characters';
  memberForm.insertBefore(passwordLabel, existingSubmit);
  memberForm.insertBefore(passwordInput, existingSubmit);

  const switchButton = document.createElement('button');
  switchButton.type = 'button';
  switchButton.className = 'll-auth-switch';
  switchButton.textContent = 'New here? Create an account';
  memberForm.insertBefore(switchButton, notice);

  const authStatus = document.createElement('p');
  authStatus.id = 'llAuthStatus';
  authStatus.setAttribute('role', 'status');
  memberForm.insertBefore(authStatus, notice);
  document.getElementById('memberName').required = false;

  function setMessage(message, error) {
    authStatus.textContent = message || '';
    authStatus.style.color = error ? '#a24747' : '#42735b';
  }
  function renderAuthMode() {
    const name = document.getElementById('memberName');
    name.required = signingUp;
    name.parentElement.querySelector('label[for="memberName"]').textContent =
      signingUp ? 'Your name' : 'Your name (optional)';
    passwordInput.autocomplete = signingUp ? 'new-password' : 'current-password';
    existingSubmit.textContent = signingUp ? 'Create my Little Letters account ♡' : 'Log in to Little Letters ♡';
    switchButton.textContent = signingUp ? 'Already registered? Log in' : 'New here? Create an account';
    notice.textContent = 'Real email/password authentication by Supabase. Your letters are private to your account. You may need to confirm your email after signing up.';
    setMessage('');
  }
  switchButton.addEventListener('click', function () {
    signingUp = !signingUp;
    renderAuthMode();
  });
  renderAuthMode();

  const signOutButton = document.createElement('button');
  signOutButton.type = 'button';
  signOutButton.className = 'button secondary hidden';
  signOutButton.textContent = 'Log out';
  headerActions.appendChild(signOutButton);
  const accountLabel = document.createElement('span');
  accountLabel.className = 'll-account-label hidden';
  headerActions.insertBefore(accountLabel, signOutButton);

  const cloudCard = document.createElement('section');
  cloudCard.className = 'll-cloud-card hidden';
  cloudCard.innerHTML = '<div><strong>My cloud letters</strong><p>Save and open private letters from your Supabase account.</p></div><div class="ll-cloud-actions"><button type="button" id="llBrowse" class="button secondary">My saved letters</button><button type="button" id="llSaveCopy" class="button secondary">Save as new</button><button type="button" id="llNew" class="button secondary">New blank letter</button></div><div id="llCloudList" class="ll-cloud-list hidden" aria-live="polite"></div>';
  workspace.querySelector('.editor-heading').insertAdjacentElement('afterend', cloudCard);
  const list = document.getElementById('llCloudList');

  const styles = document.createElement('style');
  styles.textContent = '.ll-auth-switch{margin-top:12px;border:0;background:none;color:#966b72;text-decoration:underline;cursor:pointer}.ll-account-label{font-size:11px;color:#866d65;max-width:180px;overflow:hidden;text-overflow:ellipsis}.ll-cloud-card{display:flex;align-items:center;gap:13px;justify-content:space-between;flex-wrap:wrap;padding:15px 18px;margin-bottom:16px;background:#fffaf4;border:1px solid #e7d8ca;border-radius:14px}.ll-cloud-card p{font-size:12px;color:#8f796d;margin:5px 0 0}.ll-cloud-actions{display:flex;flex-wrap:wrap;gap:7px}.ll-cloud-list{flex-basis:100%;width:100%;display:grid;gap:8px;padding-top:10px}.ll-cloud-row{border-top:1px solid #eadcd0;padding-top:10px;display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.ll-cloud-row small{display:block;color:#9b8176}.ll-cloud-row button{margin-left:6px}@media(max-width:900px){.ll-cloud-card{display:block}.ll-cloud-actions{margin-top:12px}}';
  document.head.appendChild(styles);

  function renderAccount() {
    const signedIn = !!currentUser;
    accountLabel.classList.toggle('hidden', !signedIn);
    signOutButton.classList.toggle('hidden', !signedIn);
    cloudCard.classList.toggle('hidden', !signedIn);
    if (signedIn) accountLabel.textContent = currentUser.email || 'Signed in';
    if (!signedIn) {
      list.classList.add('hidden');
      list.replaceChildren();
      currentDraftId = null;
    }
    // Keep the entry screen closed during active sessions.
    if (signedIn) gate.classList.add('hidden');
  }

  window.showLittleLettersEntry = function () {
    gate.classList.toggle('hidden', !!currentUser);
  };

  memberForm.addEventListener('submit', async function (event) {
    // Capture before the old local-demo listener. Never treat typed email as proof of identity.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (busy || !memberForm.reportValidity()) return;
    busy = true;
    existingSubmit.disabled = true;
    setMessage('Connecting securely...');
    const email = document.getElementById('memberEmail').value.trim();
    const password = passwordInput.value;
    const name = document.getElementById('memberName').value.trim();
    try {
      let result;
      if (signingUp) {
        result = await client.auth.signUp({
          email: email, password: password,
          options: { data: { display_name: name }, emailRedirectTo: location.origin + location.pathname }
        });
      } else {
        result = await client.auth.signInWithPassword({ email: email, password: password });
      }
      if (result.error) throw result.error;
      passwordInput.value = '';
      if (!result.data.session) {
        setMessage('Account created. Check your email for the verification link, then log in.');
      } else {
        currentUser = result.data.user;
        renderAccount();
        gate.classList.add('hidden');
        toast('Welcome to Little Letters ♡');
      }
    } catch (error) {
      setMessage(error.message || 'Sign in failed. Please try again.', true);
    } finally {
      busy = false;
      existingSubmit.disabled = false;
    }
  }, true);

  function resetLocalLetter() {
    state = { ...defaults, recipient:'', signature:'', message:'', photos:[], selected:null, spotify:'' };
    currentDraftId = null;
    persist();
    render();
  }
  signOutButton.addEventListener('click', async function () {
    signOutButton.disabled = true;
    const result = await client.auth.signOut();
    signOutButton.disabled = false;
    if (result.error) { toast(result.error.message); return; }
    currentUser = null;
    resetLocalLetter();
    renderAccount();
    gate.classList.remove('hidden');
    toast('Signed out');
  });

  async function saveCloud(copy) {
    persist();
    if (!currentUser) {
      toast('Saved in this browser only. Sign in for cloud backup.');
      return;
    }
    if (busy) return;
    const payload = {
      id: copy || !currentDraftId ? crypto.randomUUID() : currentDraftId,
      user_id: currentUser.id,
      recipient: state.recipient || '',
      content: { ...state, selected: null },
      updated_at: new Date().toISOString()
    };
    if (JSON.stringify(payload).length > 4500000) {
      toast('Photos are too large for cloud saving. Please use smaller images.');
      return;
    }
    busy = true;
    const btn = document.getElementById('saveDraft');
    btn.disabled = true;
    try {
      const { data, error } = await client.from('little_letters_drafts')
        .upsert(payload, { onConflict: 'id' }).select('id').single();
      if (error) throw error;
      currentDraftId = data.id;
      toast('Letter saved securely to Supabase ♡');
      if (!list.classList.contains('hidden')) await refreshList();
    } catch (error) {
      toast('Cloud save failed: ' + (error.message || 'Check your connection'));
    } finally {
      busy = false;
      btn.disabled = false;
    }
  }
  document.getElementById('saveDraft').onclick = function () { saveCloud(false); };
  document.getElementById('llSaveCopy').addEventListener('click', function () { saveCloud(true); });
  document.getElementById('llNew').addEventListener('click', function () {
    if (!confirm('Start a blank letter? Save your current letter first if you want to keep it.')) return;
    resetLocalLetter();
    toast('Blank letter ready ♡');
  });

  async function loadDraft(id) {
    if (!currentUser) return;
    const { data, error } = await client.from('little_letters_drafts')
      .select('id,content').eq('id', id).eq('user_id', currentUser.id).single();
    if (error || !data) { toast('Could not load letter'); return; }
    const saved = data.content || {};
    state = { ...defaults, ...saved, photos: Array.isArray(saved.photos) ? saved.photos : [], selected: null };
    currentDraftId = data.id;
    render();
    persist();
    list.classList.add('hidden');
    toast('Cloud letter loaded ♡');
  }

  async function removeDraft(id) {
    if (!currentUser || !confirm('Delete this saved letter from the cloud?')) return;
    const { error } = await client.from('little_letters_drafts')
      .delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) { toast('Could not delete: ' + error.message); return; }
    if (currentDraftId === id) currentDraftId = null;
    await refreshList();
    toast('Cloud letter deleted');
  }

  async function refreshList() {
    if (!currentUser) return;
    list.classList.remove('hidden');
    list.replaceChildren();
    const loading = document.createElement('p');
    loading.textContent = 'Loading your saved letters...';
    list.appendChild(loading);
    const { data, error } = await client.from('little_letters_drafts')
      .select('id,recipient,updated_at').eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false }).limit(40);
    list.replaceChildren();
    if (error) {
      const warning = document.createElement('p');
      warning.textContent = 'Unable to fetch saved letters: ' + error.message;
      list.appendChild(warning);
      return;
    }
    if (!data.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No saved cloud letters yet. Write one and click Save draft.';
      list.appendChild(empty);
      return;
    }
    data.forEach(function (row) {
      const item = document.createElement('div'); item.className = 'll-cloud-row';
      const label = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = 'For ' + (row.recipient || 'someone special');
      const date = document.createElement('small');
      date.textContent = new Date(row.updated_at).toLocaleString();
      label.append(strong, date);
      const actions = document.createElement('div');
      const open = document.createElement('button');
      open.type = 'button'; open.className = 'button secondary'; open.textContent = 'Open';
      open.onclick = function () { loadDraft(row.id); };
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'button text-button'; del.textContent = 'Delete';
      del.onclick = function () { removeDraft(row.id); };
      actions.append(open, del);
      item.append(label, actions); list.appendChild(item);
    });
  }
  document.getElementById('llBrowse').addEventListener('click', function () {
    if (!list.classList.contains('hidden')) list.classList.add('hidden');
    else refreshList();
  });

  client.auth.onAuthStateChange(function (event, session) {
    const nextUser = session && session.user || null;
    if (currentUser && (!nextUser || nextUser.id !== currentUser.id)) resetLocalLetter();
    currentUser = nextUser;
    renderAccount();
  });
  client.auth.getUser().then(function (result) {
    const verifiedUser = result.data && result.data.user || null;
    if (currentUser && (!verifiedUser || verifiedUser.id !== currentUser.id)) resetLocalLetter();
    currentUser = verifiedUser;
    renderAccount();
    if (currentUser && document.getElementById('intro').classList.contains('done')) {
      gate.classList.add('hidden');
    }
  }).catch(function () {
    // An offline visitor can still use the guest-mode editor.
    renderAccount();
  });
})();
