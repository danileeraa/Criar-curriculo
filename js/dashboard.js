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
    resumes[session.email] = userResumes.filter(r => r.id !== id);
    saveResumes(resumes);
  }

  let deleteTargetId = null;

  function renderResumeCard(resume) {
    const created = new Date(resume.createdAt || Date.now());
    const dateStr = created.toLocaleDateString('pt-BR');
    const name = resume.personalInfo?.name || 'Sem título';
    const title = resume.personalInfo?.title || '';
    const tpl = resume.template || 'desenvolvedor';
    const tplColors = { desenvolvedor:'bg-emerald-500', designer:'bg-pink-500', advocacia:'bg-amber-600', medicina:'bg-teal-500', engenharia:'bg-blue-500', marketing:'bg-orange-500', professor:'bg-indigo-500', administrativo:'bg-slate-500', 'jovem-aprendiz':'bg-cyan-500', executivo:'bg-yellow-500' };
    const dot = tplColors[tpl] || 'bg-blue-500';

    return `
      <div class="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-100">
        <div class="flex items-start gap-4 flex-1 min-w-0">
          <div class="w-12 h-16 bg-slate-50 border border-slate-200 shadow-sm rounded-lg shrink-0 overflow-hidden flex flex-col justify-between p-1.5">
            <div class="space-y-0.5">
              <div class="h-1 w-6 rounded-full ${dot}"></div>
              <div class="h-0.5 w-8 bg-slate-200"></div>
              <div class="h-0.5 w-7 bg-slate-200"></div>
              <div class="h-0.5 w-6 bg-slate-200"></div>
            </div>
            <div class="h-0.5 w-4 bg-slate-200"></div>
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-bold text-slate-800 text-base truncate">${escapeHtml(name)}</h3>
              <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"><svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Salvo</span>
            </div>
            <div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1">
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full ${dot}"></span> ${dateStr}</span>
              ${title ? `<span class="flex items-center gap-1"><svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> ${escapeHtml(title)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center flex-wrap gap-2 self-start md:self-auto">
          <button onclick="location.href='builder.html?id=${resume.id}'" class="py-1.5 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors cursor-pointer">Editar</button>
          <button onclick="Dashboard.confirmDelete('${resume.id}')" class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent rounded-xl transition-colors cursor-pointer" title="Excluir">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>`;
  }

  function escapeHtml(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  function loadDashboard() {
    if (!Auth.checkAuth('index.html')) return;
    const user = Auth.getCurrentUser();
    if (!user) return;

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

    const resumes = getResumes();
    const userResumes = resumes[user.email] || [];
    const grid = document.getElementById('resumeGrid');
    const countEl = document.getElementById('resumeCount');
    const emptyState = document.getElementById('emptyState');

    const templateCounts = {};
    userResumes.forEach(r => {
      const t = r.template || 'desenvolvedor';
      templateCounts[t] = (templateCounts[t] || 0) + 1;
    });
    let favTemplate = '-';
    let maxCount = 0;
    for (const [tpl, count] of Object.entries(templateCounts)) {
      if (count > maxCount) { maxCount = count; favTemplate = tpl.charAt(0).toUpperCase() + tpl.slice(1).replace(/-/g, ' '); }
    }

    document.getElementById('kpiTotal').textContent = userResumes.length;
    document.getElementById('kpiDrafts').textContent = userResumes.length;
    document.getElementById('kpiExports').textContent = '0';
    document.getElementById('kpiFavorite').textContent = favTemplate;

    if (userResumes.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      grid.innerHTML = '';
      if (countEl) countEl.textContent = '0 documentos';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (countEl) countEl.textContent = userResumes.length + ' documento' + (userResumes.length !== 1 ? 's' : '');
    grid.innerHTML = userResumes
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map(r => renderResumeCard(r))
      .join('');
  }

  function parseResumeText(text) {
    const data = { name: '', title: '', email: '', phone: '', address: '', website: '', summary: '',
      social: [], education: [], experience: [], skills: [], languages: [], certifications: [], projects: [] };
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let i = 0;

    function peek() { return lines[i] || ''; }
    function next() { return lines[i++] || ''; }

    const labelPattern = /^(Nome|Email|Telefone|Endereço|Site|LinkedIn|GitHub|Instagram|Twitter|Facebook|YouTube|TikTok|Cargo|Profissão|Título)\s*[:]\s*(.+)/i;

    while (i < lines.length) {
      const line = next();
      const labelMatch = line.match(labelPattern);
      if (labelMatch) {
        const key = labelMatch[1].toLowerCase();
        const val = labelMatch[2];
        if (key === 'nome') data.name = val;
        else if (key === 'email') data.email = val;
        else if (key === 'telefone' || key === 'tel') data.phone = val;
        else if (key === 'endereço' || key === 'endereco') data.address = val;
        else if (key === 'site') data.website = val;
        else if (key === 'cargo' || key === 'profissão' || key === 'profissao' || key === 'título' || key === 'titulo') data.title = val;
        else if (['linkedin','github','instagram','twitter','facebook','youtube','tiktok'].includes(key)) {
          data.social.push({ platform: key.charAt(0).toUpperCase() + key.slice(1), url: val });
        }
        continue;
      }

      const secMatch = line.match(/^(Experiência|Experiencia|Formação|Formacao|Educação|Educacao|Habilidades|Competências|Competencias|Idiomas|Certificações|Certificacoes|Projetos|Resumo|Objetivo|Perfil)\s*:?$/i);
      if (secMatch) {
        const sec = secMatch[1].toLowerCase();
        if (sec === 'resumo' || sec === 'objetivo' || sec === 'perfil') {
          data.summary = (data.summary + ' ' + collectSection()).trim();
        } else if (sec.startsWith('experiên') || sec.startsWith('experien')) {
          parseExperience();
        } else if (sec.startsWith('forma') || sec.startsWith('educa')) {
          parseEducation();
        } else if (sec.startsWith('habil') || sec.startsWith('compet')) {
          parseSkills();
        } else if (sec.startsWith('idioma')) {
          parseLanguages();
        } else if (sec.startsWith('certif')) {
          parseCertifications();
        } else if (sec.startsWith('projet')) {
          parseProjects();
        }
        continue;
      }

      data.summary = (data.summary + ' ' + line).trim();
    }

    function collectSection() {
      const lines = [];
      while (i < lines.length && !peek().match(/^(Experiência|Experiencia|Formação|Formacao|Educação|Educacao|Habilidades|Competências|Competencias|Idiomas|Certificações|Certificacoes|Projetos|Resumo|Objetivo|Perfil)\s*:?$/i) && !peek().match(labelPattern)) {
        lines.push(next());
      }
      return lines.join(' ');
    }

    function parseExperience() {
      while (i < lines.length) {
        const l = peek();
        if (l.match(/^(Formação|Formacao|Educação|Educacao|Habilidades|Competências|Competencias|Idiomas|Certificações|Certificacoes|Projetos)\s*:?$/i)) break;
        if (l.match(labelPattern)) break;
        const parts = l.split(/[–\-–|/]/);
        const company = parts[0].trim();
        const position = parts.length > 1 ? parts[1].trim() : '';
        const dates = l.match(/(\d{4})\s*[–\-–]\s*(\d{4}|presente|atual|o\s*momento)/i);
        const entry = { company, position, location: '', startDate: dates ? dates[1] : '', endDate: dates ? (dates[2].match(/\d{4}/) ? dates[2] : '') : '', current: dates ? !dates[2].match(/\d{4}/) : false, description: '' };
        const desc = [];
        while (i + 1 < lines.length && !peek().match(/^[A-ZÀ-Ú][a-zà-ú]+[\s:]/) && !peek().match(/^\d{4}/) && !peek().match(/^(Experiência|Experiencia|Formação|Formacao)\s*:?$/i)) {
          desc.push(next());
        }
        entry.description = desc.join(' ');
        data.experience.push(entry);
        next();
      }
    }

    function parseEducation() {
      while (i < lines.length) {
        const l = peek();
        if (l.match(/^(Experiência|Experiencia|Habilidades|Competências|Competencias|Idiomas|Certificações|Certificacoes|Projetos)\s*:?$/i)) break;
        if (l.match(labelPattern)) break;
        const parts = l.split(/[–\-–|/]/);
        const institution = parts[0].trim();
        const degree = parts.length > 1 ? parts[1].trim() : '';
        const dates = l.match(/(\d{4})\s*[–\-–]\s*(\d{4}|presente|atual|o\s*momento)/i);
        data.education.push({ institution, degree, field: parts.length > 2 ? parts[2].trim() : '', startDate: dates ? dates[1] : '', endDate: dates ? (dates[2].match(/\d{4}/) ? dates[2] : '') : '', description: '', location: '' });
        next();
      }
    }

    function parseSkills() {
      while (i < lines.length) {
        const l = peek();
        if (l.match(/^(Experiência|Experiencia|Formação|Formacao|Educação|Educacao|Idiomas|Certificações|Certificacoes|Projetos)\s*:?$/i)) break;
        if (l.match(labelPattern)) break;
        l.split(/[,;•·\-]/).forEach(s => {
          const skill = s.trim().replace(/^\d+\s*[-.]?\s*/, '');
          if (skill) data.skills.push({ name: skill, level: 50, category: 'technical' });
        });
        next();
      }
    }

    function parseLanguages() {
      while (i < lines.length) {
        const l = peek();
        if (l.match(/^(Experiência|Experiencia|Formação|Formacao|Educação|Educacao|Habilidades|Competências|Competencias|Certificações|Certificacoes|Projetos)\s*:?$/i)) break;
        if (l.match(labelPattern)) break;
        const parts = l.split(/[–\-–:]/);
        data.languages.push({ name: parts[0].trim(), proficiency: parts.length > 1 ? parts[1].trim() : 'Intermediário' });
        next();
      }
    }

    function parseCertifications() {
      while (i < lines.length) {
        const l = peek();
        if (l.match(/^(Experiência|Experiencia|Formação|Formacao|Educação|Educacao|Habilidades|Competências|Competencias|Idiomas|Projetos)\s*:?$/i)) break;
        if (l.match(labelPattern)) break;
        data.certifications.push({ name: l, issuer: '', date: '', description: '' });
        next();
      }
    }

    function parseProjects() {
      while (i < lines.length) {
        const l = peek();
        if (l.match(/^(Experiência|Experiencia|Formação|Formacao|Educação|Educacao|Habilidades|Competências|Competencias|Idiomas|Certificações|Certificacoes)\s*:?$/i)) break;
        if (l.match(labelPattern)) break;
        data.projects.push({ name: l, techs: '', description: '', link: '' });
        next();
      }
    }

    return data;
  }

  // Import resume data (JSON/text - no AI)
  let importType = 'json';

  window.setImportType = function(type) {
    importType = type;
    document.querySelectorAll('.import-type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === type);
      b.classList.toggle('bg-white', b.dataset.type === type);
      b.classList.toggle('text-slate-800', b.dataset.type === type);
      b.classList.toggle('shadow-xs', b.dataset.type === type);
      b.classList.toggle('text-slate-400', b.dataset.type !== type);
      b.classList.toggle('hover:text-slate-600', b.dataset.type !== type);
    });
    document.getElementById('importLabel').textContent = type === 'json' ? 'Cole o conteúdo JSON' : 'Cole o texto do currículo';
    document.getElementById('importContent').placeholder = type === 'json'
      ? '{"name":"João","professionalTitle":"...", ...}'
      : 'Nome: João Silva\nCargo: Engenheiro\nExperiência: …';
    document.getElementById('importFileInput').accept = type === 'json' ? '.json' : '.txt';
  };

  window.handleImportFile = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    if (isPDF || isImage) {
      showMessage('Arquivo não suportado para importação. Use arquivo .json exportado do sistema.', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('importContent').value = ev.target.result;
      if (file.name.endsWith('.json')) setImportType('json');
    };
    reader.onerror = () => {
      showMessage('Erro ao ler o arquivo.', 'error');
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  function showMessage(text, type) {
    const el = document.getElementById(type === 'error' ? 'importError' : 'importSuccess');
    const textEl = document.getElementById(type === 'error' ? 'importErrorText' : 'importSuccessText');
    document.getElementById('importError').classList.add('hidden');
    document.getElementById('importSuccess').classList.add('hidden');
    if (el) { textEl.textContent = text; el.classList.remove('hidden'); }
  }

  document.getElementById('importForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const content = document.getElementById('importContent').value.trim();
    const errorEl = document.getElementById('importError');
    const errorText = document.getElementById('importErrorText');
    const successEl = document.getElementById('importSuccess');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    if (!content) {
      errorText.textContent = 'Cole o conteúdo ou faça upload de um arquivo.';
      errorEl.classList.remove('hidden');
      return;
    }

    let parsedData;
    if (importType === 'json') {
      try { parsedData = JSON.parse(content); }
      catch { errorText.textContent = 'JSON inválido. Verifique a sintaxe.'; errorEl.classList.remove('hidden'); return; }
    } else {
      parsedData = parseResumeText(content);
    }

    const user = Auth.getCurrentUser();
    if (!user) { errorText.textContent = 'Faça login primeiro.'; errorEl.classList.remove('hidden'); return; }

    const tpl = document.getElementById('importTemplate')?.value || 'desenvolvedor';
    const resumes = getResumes();
    const userResumes = resumes[user.email] || [];

    const newResume = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      template: tpl,
      font: 'Inter',
      personalInfo: {
        name: parsedData.name || '',
        title: parsedData.professionalTitle || parsedData.title || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        address: parsedData.location || parsedData.address || '',
        website: parsedData.website || '',
        summary: parsedData.summary || '',
        photo: parsedData.photo || ''
      },
      social: (parsedData.socials || parsedData.social || []).map(s => ({ platform: s.platform || 'Outro', url: s.url || '' })),
      education: (parsedData.education || []).map(e => ({
        institution: e.institution || '', degree: e.degree || '', field: e.fieldOfStudy || e.field || '',
        startDate: e.startDate || '', endDate: e.endDate || '', description: e.description || ''
      })),
      experience: (parsedData.experience || []).map(e => ({
        company: e.company || '', position: e.position || '',
        startDate: e.startDate || '', endDate: e.endDate || '', current: !!e.current,
        location: e.location || '', description: e.description || ''
      })),
      skills: (parsedData.skills || []).map(s => ({
        name: s.name || '', level: s.level || 50, category: s.category || 'technical'
      })),
      languages: (parsedData.languages || []).map(l => ({
        name: l.name || '', proficiency: l.proficiency || 'Intermediário'
      })),
      certifications: (parsedData.certifications || []).map(c => ({
        name: c.name || '', issuer: c.issuer || '', date: c.date || '', description: c.description || ''
      })),
      projects: (parsedData.projects || []).map(p => ({
        name: p.title || p.name || '', techs: p.subtitle || p.techs || '', description: p.description || ''
      }))
    };

    userResumes.push(newResume);
    resumes[user.email] = userResumes;
    saveResumes(resumes);

    successEl.classList.remove('hidden');
    document.getElementById('importContent').value = '';
    loadDashboard();

    setTimeout(() => { window.location.href = 'builder.html?id=' + newResume.id; }, 1200);
  });

  // Export/Import full backup
  window.exportData = function() {
    const data = localStorage.getItem('curriculo_app');
    if (!data) { alert('Nenhum dado para exportar.'); return; }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'curriculo-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };

  window.importBackup = function() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.users) throw new Error('inválido');
          if (localStorage.getItem('curriculo_app') && !confirm('Substituir todos os dados locais?')) return;
          localStorage.setItem('curriculo_app', JSON.stringify(data));
          alert('Backup importado!');
          location.reload();
        } catch { alert('Arquivo inválido.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  window.closeDeleteModal = function() {
    document.getElementById('deleteModal').classList.add('hidden');
    document.getElementById('deleteModal').classList.remove('flex');
  };

  window.Dashboard = {
    load: loadDashboard,
    confirmDelete(id) {
      deleteTargetId = id;
      const modal = document.getElementById('deleteModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    },
    confirmDeleteAction() {
      if (deleteTargetId) {
        deleteResume(deleteTargetId);
        loadDashboard();
        window.closeDeleteModal();
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    Dashboard.load();
    document.getElementById('deleteModal')?.addEventListener('click', function(e) {
      if (e.target === this) window.closeDeleteModal();
    });
  });
})();
