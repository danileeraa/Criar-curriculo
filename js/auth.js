(function() {
  'use strict';

  const STORAGE_KEY = 'curriculum_users';
  const SESSION_KEY = 'curriculum_session';

  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  window.Auth = {
    async register(email, password, name) {
      const users = getUsers();
      const key = email.toLowerCase().trim();

      if (users[key]) {
        return { success: false, error: 'Este email já está cadastrado.' };
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);

      users[key] = {
        name: name.trim(),
        email: key,
        password: hash,
        salt: salt,
        created: new Date().toISOString()
      };

      saveUsers(users);
      return { success: true };
    },

    async login(email, password) {
      const users = getUsers();
      const key = email.toLowerCase().trim();
      const user = users[key];

      if (!user) {
        return { success: false, error: 'Email ou senha inválidos.' };
      }

      const hash = await hashPassword(password, user.salt);
      if (hash !== user.password) {
        return { success: false, error: 'Email ou senha inválidos.' };
      }

      const token = generateToken();
      const session = {
        token,
        email: key,
        name: user.name,
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: { name: user.name, email: key } };
    },

    logout() {
      sessionStorage.removeItem(SESSION_KEY);
    },

    getSession() {
      try {
        const data = sessionStorage.getItem(SESSION_KEY);
        if (!data) return null;
        const session = JSON.parse(data);
        if (session.expires < Date.now()) {
          sessionStorage.removeItem(SESSION_KEY);
          return null;
        }
        return session;
      } catch { return null; }
    },

    isAuthenticated() {
      return !!this.getSession();
    },

    getCurrentUser() {
      const session = this.getSession();
      if (!session) return null;
      return { name: session.name, email: session.email };
    },

    checkAuth(redirectTo = 'index.html') {
      if (!this.isAuthenticated()) {
        window.location.href = redirectTo;
        return false;
      }
      return true;
    },

    redirectIfAuthenticated(destination = 'dashboard.html') {
      if (this.isAuthenticated()) {
        window.location.href = destination;
      }
    },

    async changePassword(email, currentPassword, newPassword) {
      const users = getUsers();
      const key = email.toLowerCase().trim();
      const user = users[key];

      if (!user) return { success: false, error: 'Usuário não encontrado.' };

      const hash = await hashPassword(currentPassword, user.salt);
      if (hash !== user.password) {
        return { success: false, error: 'Senha atual incorreta.' };
      }

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);
      user.password = newHash;
      user.salt = newSalt;
      saveUsers(users);

      return { success: true };
    }
  };
})();
