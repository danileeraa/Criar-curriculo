(function() {
  'use strict';

  const RESUMES_KEY = 'curriculum_resumes';

  function getResumes() {
    try { return JSON.parse(localStorage.getItem(RESUMES_KEY)) || {}; }
    catch { return {}; }
  }

  function saveResumes(data) {
    localStorage.setItem(RESUMES_KEY, JSON.stringify(data));
  }

  function deleteResume(id) {
    const resumes = getResumes();
    const session = Auth.getSession();
    if (!session) return;
    const userResumes = resumes[session.email] || [];
    const filtered = userResumes.filter(r => r.id !== id);
    resumes[session.email] = filtered;
    saveResumes(resumes);
  }

  function getTemplateLabel(template) {
    const labels = {
      desenvolvedor: 'Desenvolvedor',
      designer: 'Designer',
      advocacia: 'Advocacia',
      medicina: 'Medicina',
      engenharia: 'Engenharia',
      marketing: 'Marketing',
      professor: 'Professor',
      administrativo: 'Administrativo',
      'jovem-aprendiz': 'Jovem Aprendiz',
      executivo: 'Executivo'
    };
    return labels[template] || template;
  }

  function getTemplateIcon(template) {
    const icons = {
      desenvolvedor: '💻',
      designer: '🎨',
      advocacia: '⚖️',
      medicina: '🏥',
      engenharia: '🔧',
      marketing: '📊',
      professor: '📚',
      administrativo: '📋',
      'jovem-aprendiz': '🌱',
      executivo: '⭐'
    };
    return icons[template] || '📄';
  }

  function renderResumeCard(resume, index) {
    const created = new Date(resume.createdAt || Date.now());
    const dateStr = created.toLocaleDateString('pt-BR');
    const initials = (resume.personalInfo?.name || 'Currículo').charAt(0).toUpperCase();
    const templateClass = `template-${resume.template || 'desenvolvedor'}`;

    return `
      <div class="resume-card" data-id="${resume.id}">
        <div class="resume-card-preview ${templateClass}">
          ${getTemplateIcon(resume.template || 'desenvolvedor')}
        </div>
        <div class="resume-card-body">
          <h3 title="${resume.personalInfo?.name || 'Sem título'}">${resume.personalInfo?.name || 'Sem título'}</h3>
          <div class="resume-meta">
            ${dateStr}
            ${resume.personalInfo?.title ? '&middot; ' + resume.personalInfo.title : ''}
          </div>
          <div class="resume-card-actions">
            <button class="btn btn-sm btn-primary" onclick="location.href='builder.html?id=${resume.id}'">Abrir</button>
            <button class="btn btn-sm btn-secondary" onclick="location.href='builder.html?id=${resume.id}'">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="Dashboard.confirmDelete('${resume.id}')">Excluir</button>
          </div>
        </div>
      </div>
    `;
  }

  function loadDashboard() {
    if (!Auth.checkAuth('index.html')) return;

    const user = Auth.getCurrentUser();
    if (!user) return;

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

    const resumes = getResumes();
    const userResumes = resumes[user.email] || [];
    const grid = document.getElementById('resumeGrid');

    if (userResumes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <h3>Nenhum currículo criado ainda</h3>
          <p>Crie seu primeiro currículo profissional em poucos minutos.</p>
          <button class="btn btn-primary btn-lg" onclick="location.href='builder.html'">Criar Currículo</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = userResumes
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map(r => renderResumeCard(r))
      .join('');
  }

  function exportData() {
    const data = localStorage.getItem('curriculo_app');
    if (!data) { alert('Nenhum dado para exportar.'); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curriculo-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.users && !data.resumes) throw new Error('Arquivo inválido');
          const existing = localStorage.getItem('curriculo_app');
          if (existing && !confirm('Isso substituirá todos os dados locais. Continuar?')) return;
          localStorage.setItem('curriculo_app', JSON.stringify(data));
          alert('Dados importados com sucesso!');
          location.reload();
        } catch {
          alert('Arquivo inválido. Selecione um backup válido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  window.Dashboard = {
    load: loadDashboard,

    confirmDelete(id) {
      const modal = document.getElementById('deleteModal');
      if (!modal) {
        if (confirm('Tem certeza que deseja excluir este currículo?')) {
          deleteResume(id);
          loadDashboard();
          const t = document.createElement('div');
          t.className = 'toast success';
          t.textContent = 'Currículo excluído.';
          document.body.appendChild(t);
          requestAnimationFrame(() => t.classList.add('show'));
          setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
        }
        return;
      }
      modal.classList.add('active');
      modal.dataset.resumeId = id;
    },

    confirmDeleteAction() {
      const modal = document.getElementById('deleteModal');
      const id = modal.dataset.resumeId;
      if (id) {
        deleteResume(id);
        loadDashboard();
        modal.classList.remove('active');
        const t = document.createElement('div');
        t.className = 'toast success';
        t.textContent = 'Currículo excluído.';
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    Dashboard.load();
    const modal = document.getElementById('deleteModal');
    if (modal) {
      document.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) modal.classList.remove('active');
      });
    }
  });
})();
