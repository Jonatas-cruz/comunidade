(function(window){
  'use strict';

  const STORAGE_KEYS = {
    users: 'app_users_v1',
    session: 'app_session_v1'
  };

  function readUsers(){
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.users);
      return raw ? JSON.parse(raw) : [];
    } catch(e){
      console.warn('Falha ao ler usuários', e);
      return [];
    }
  }

  function writeUsers(users){
    try {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    } catch(e){
      console.warn('Falha ao salvar usuários', e);
    }
  }

  function hash(str){
    // Hash simples (não seguro) para demonstração em front-end somente
    let h = 0;
    for (let i=0; i<str.length; i++) {
      h = ((h<<5)-h) + str.charCodeAt(i);
      h |= 0;
    }
    return 'h'+Math.abs(h);
  }

  function createUser({name, email, password}){
    const users = readUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error('E-mail já cadastrado');
    }
    const user = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
      name: name.trim(),
      email: email.trim(),
      passwordHash: hash(password),
      createdAt: Date.now()
    };
    users.push(user);
    writeUsers(users);
    setSession({ userId: user.id });
    return user;
  }

  function authenticate(email, password){
    const users = readUsers();
    const ph = hash(password);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === ph);
    if (!user) throw new Error('Credenciais inválidas');
    setSession({ userId: user.id });
    return user;
  }

  function setSession(session){
    try {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    } catch(e){
      console.warn('Falha ao salvar sessão', e);
    }
  }

  function getSession(){
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.session);
      return raw ? JSON.parse(raw) : null;
    } catch(e){
      console.warn('Falha ao ler sessão', e);
      return null;
    }
  }

  function getCurrentUser(){
    const session = getSession();
    if (!session || !session.userId) return null;
    const users = readUsers();
    return users.find(u => u.id === session.userId) || null;
  }

  function logout(){
    try {
      localStorage.removeItem(STORAGE_KEYS.session);
    } catch(e){
      console.warn('Falha ao limpar sessão', e);
    }
  }

  function updateNavbarAuth(){
    const user = getCurrentUser();
    const navContainer = document.querySelector('.navbar .navbar-nav.ms-auto');
    if (!navContainer) return;

    // Remove item existente se houver
    let authItem = navContainer.querySelector('[data-auth-item]');
    if (authItem) authItem.remove();

    const li = document.createElement('li');
    li.className = 'nav-item dropdown';
    li.setAttribute('data-auth-item','1');

    if (user){
      li.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fa-regular fa-user"></i> ${user.name.split(' ')[0]}
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="conta.html">Minha Conta</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" data-action="logout">Sair</a></li>
        </ul>
      `;
    } else {
      li.innerHTML = `
        <a class="nav-link" href="conta.html">
          <i class="fa-regular fa-user"></i> Entrar / Cadastrar
        </a>
      `;
    }
    navContainer.appendChild(li);

    li.addEventListener('click', (e)=>{
      const target = e.target.closest('[data-action="logout"]');
      if (target){
        e.preventDefault();
        logout();
        updateNavbarAuth();
        // volta para home após logout
        if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) {
          location.href = 'index.html';
        }
      }
    });
  }

  function initAuth(){
    updateNavbarAuth();
    // Expor API mínima
    window.AppAuth = {
      createUser,
      authenticate,
      getCurrentUser,
      logout,
      updateNavbarAuth
    };
  }

  window.addEventListener('DOMContentLoaded', initAuth);

})(window);
