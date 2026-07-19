(function() {
  'use strict';

  if (typeof Auth === 'undefined') return;

  const RESUMES_KEY = 'curriculum_resumes';
  let currentResumeId = null;
  let currentPhoto = null;

  function getResumes() {
    try { return JSON.parse(localStorage.getItem(RESUMES_KEY)) || {}; }
    catch { return {}; }
  }

  function saveResumes(data) {
    localStorage.setItem(RESUMES_KEY, JSON.stringify(data));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function getFormData() {
    const data = {
      personalInfo: {
        name: document.getElementById('fullName')?.value || '',
        title: document.getElementById('professionalTitle')?.value || '',
        summary: document.getElementById('summary')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        website: document.getElementById('website')?.value || '',
        photo: currentPhoto
      },
      template: document.getElementById('templateSelect')?.value || 'desenvolvedor',
      font: document.getElementById('fontSelect')?.value || 'Inter'
    };

    const socialItems = document.querySelectorAll('.social-input-row');
    data.social = [];
    socialItems.forEach(row => {
      const platform = row.querySelector('select')?.value;
      const url = row.querySelector('input')?.value;
      if (url) data.social.push({ platform, url });
    });

    const educationItems = document.querySelectorAll('.education-item');
    data.education = [];
    educationItems.forEach(item => {
      data.education.push({
        institution: item.querySelector('.ed-institution')?.value || '',
        degree: item.querySelector('.ed-degree')?.value || '',
        field: item.querySelector('.ed-field')?.value || '',
        startDate: item.querySelector('.ed-start')?.value || '',
        endDate: item.querySelector('.ed-end')?.value || '',
        description: item.querySelector('.ed-desc')?.value || '',
        location: item.querySelector('.ed-location')?.value || ''
      });
    });

    const experienceItems = document.querySelectorAll('.experience-item');
    data.experience = [];
    experienceItems.forEach(item => {
      data.experience.push({
        company: item.querySelector('.exp-company')?.value || '',
        position: item.querySelector('.exp-position')?.value || '',
        location: item.querySelector('.exp-location')?.value || '',
        startDate: item.querySelector('.exp-start')?.value || '',
        endDate: item.querySelector('.exp-end')?.value || '',
        current: item.querySelector('.exp-current')?.checked || false,
        description: item.querySelector('.exp-desc')?.value || ''
      });
    });

    const skillItems = document.querySelectorAll('.skill-item');
    data.skills = [];
    skillItems.forEach(item => {
      data.skills.push({
        name: item.querySelector('.skill-name-input')?.value || '',
        level: parseInt(item.querySelector('.skill-level')?.value) || 50,
        category: item.querySelector('.skill-category')?.value || 'technical'
      });
    });

    const languageItems = document.querySelectorAll('.language-item');
    data.languages = [];
    languageItems.forEach(item => {
      data.languages.push({
        name: item.querySelector('.lang-name')?.value || '',
        proficiency: item.querySelector('.lang-proficiency')?.value || 'Básico'
      });
    });

    const certItems = document.querySelectorAll('.cert-item');
    data.certifications = [];
    certItems.forEach(item => {
      data.certifications.push({
        name: item.querySelector('.cert-name')?.value || '',
        issuer: item.querySelector('.cert-issuer')?.value || '',
        date: item.querySelector('.cert-date')?.value || '',
        description: item.querySelector('.cert-desc')?.value || ''
      });
    });

    const projectItems = document.querySelectorAll('.project-item');
    data.projects = [];
    projectItems.forEach(item => {
      data.projects.push({
        name: item.querySelector('.proj-name')?.value || '',
        description: item.querySelector('.proj-desc')?.value || '',
        techs: item.querySelector('.proj-techs')?.value || '',
        link: item.querySelector('.proj-link')?.value || ''
      });
    });

    return data;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function renderPreview() {
    const data = getFormData();
    const template = data.template || 'desenvolvedor';
    const font = data.font || 'Inter';
    const preview = document.getElementById('previewContent');
    if (!preview) return;

    const p = data.personalInfo || {};
    const photoHtml = p.photo
      ? `<img src="${p.photo}" alt="Foto">`
      : `<div class="no-photo">👤</div>`;

    const socialHtml = (data.social || []).map(s => {
      let name = s.platform;
      try {
        let u = s.url;
        if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
        const parsed = new URL(u);
        const path = parsed.pathname.replace(/\/+$/, '');
        const parts = path.split('/').filter(Boolean);
        if (parts.length) name = parts[parts.length - 1];
      } catch {}
      return `<div style="margin:2px 0;font-size:0.82rem"><strong>${escapeHtml(s.platform)}:</strong> ${escapeHtml(name)}</div>`;
    }).join('');

    const educationHtml = (data.education || []).filter(e => e.institution || e.degree).map(e => `
      <div class="entry">
        <div class="entry-title">${escapeHtml(e.degree)}${e.field ? ' em ' + escapeHtml(e.field) : ''}</div>
        <div class="entry-subtitle">${escapeHtml(e.institution)}${e.location ? ', ' + escapeHtml(e.location) : ''}</div>
        <div class="entry-date">${formatDate(e.startDate)}${e.endDate ? ' - ' + formatDate(e.endDate) : ''}</div>
        ${e.description ? '<div class="entry-desc">' + escapeHtml(e.description) + '</div>' : ''}
      </div>
    `).join('');

    const experienceHtml = (data.experience || []).filter(e => e.company || e.position).map(e => `
      <div class="entry">
        <div class="entry-title">${escapeHtml(e.position)}</div>
        <div class="entry-subtitle">${escapeHtml(e.company)}${e.location ? ', ' + escapeHtml(e.location) : ''}</div>
        <div class="entry-date">${formatDate(e.startDate)}${e.current ? ' - Presente' : e.endDate ? ' - ' + formatDate(e.endDate) : ''}</div>
        ${e.description ? '<div class="entry-desc">' + escapeHtml(e.description) + '</div>' : ''}
      </div>
    `).join('');

    const skills = data.skills || [];
    const techSkills = skills.filter(s => s.category === 'technical' || s.category === 'tool');
    const softSkills = skills.filter(s => s.category === 'soft');
    const techs = skills.filter(s => s.category === 'language' || s.category === 'other');

    const skillBarsHtml = techSkills.map(s => `
      <div class="skill-item">
        <div class="skill-name">${escapeHtml(s.name)}</div>
        <div class="skill-bar"><div class="skill-fill" style="width:${s.level}%"></div></div>
      </div>
    `).join('');

    const allSkills = [...techSkills, ...softSkills, ...techs];
    const skillChipsHtml = allSkills.map(s =>
      `<span class="skill-chip">${escapeHtml(s.name)}</span>`
    ).join('');

    const skillListHtml = allSkills.map(s =>
      `<li>${escapeHtml(s.name)}</li>`
    ).join('');

    const skillTagsHtml = allSkills.map(s =>
      `<span class="skill-tag">${escapeHtml(s.name)}</span>`
    ).join('');

    const languagesHtml = (data.languages || []).filter(l => l.name).map(l => `
      <div class="entry">
        <div class="entry-title" style="font-size:0.9rem">${escapeHtml(l.name)}</div>
        <div class="entry-subtitle" style="font-size:0.8rem">${escapeHtml(l.proficiency)}</div>
      </div>
    `).join('');

    const certsHtml = (data.certifications || []).filter(c => c.name).map(c => `
      <div class="entry">
        <div class="entry-title">${escapeHtml(c.name)}</div>
        <div class="entry-subtitle">${escapeHtml(c.issuer)}${c.date ? ' - ' + formatDate(c.date) : ''}</div>
        ${c.description ? '<div class="entry-desc">' + escapeHtml(c.description) + '</div>' : ''}
      </div>
    `).join('');

    const projectsHtml = (data.projects || []).filter(p => p.name).map(p => `
      <div class="entry">
        <div class="entry-title">${escapeHtml(p.name)}</div>
        ${p.techs ? '<div class="entry-subtitle">' + escapeHtml(p.techs) + '</div>' : ''}
        ${p.description ? '<div class="entry-desc">' + escapeHtml(p.description) + '</div>' : ''}
      </div>
    `).join('');

    const contactHtml = `
      ${p.email ? `<div class="contact-item">✉ ${escapeHtml(p.email)}</div>` : ''}
      ${p.phone ? `<div class="contact-item">📞 ${escapeHtml(p.phone)}</div>` : ''}
      ${p.address ? `<div class="contact-item">📍 ${escapeHtml(p.address)}</div>` : ''}
      ${p.website ? `<div class="contact-item">🌐 ${escapeHtml(p.website)}</div>` : ''}
    `;

    const contactBarHtml = `
      ${p.email ? `<span>✉ ${escapeHtml(p.email)}</span>` : ''}
      ${p.phone ? `<span>📞 ${escapeHtml(p.phone)}</span>` : ''}
      ${p.address ? `<span>📍 ${escapeHtml(p.address)}</span>` : ''}
      ${p.website ? `<span>🌐 ${escapeHtml(p.website)}</span>` : ''}
    `;

    const contactListHtml = `
      ${p.email ? `<li>✉ ${escapeHtml(p.email)}</li>` : ''}
      ${p.phone ? `<li>📞 ${escapeHtml(p.phone)}</li>` : ''}
      ${p.address ? `<li>📍 ${escapeHtml(p.address)}</li>` : ''}
      ${p.website ? `<li>🌐 ${escapeHtml(p.website)}</li>` : ''}
    `;

    const mainCerts = certsHtml ? `<h3>Certificações</h3>${certsHtml}` : '';
    const mainProjects = projectsHtml ? `<h3>Projetos</h3>${projectsHtml}` : '';
    const sidebarSocial = socialHtml ? `<h3>Redes Sociais</h3><div style="margin-top:6px">${socialHtml}</div>` : '';

    function sumHtml(html, empty) { return html || empty || ''; }

    let html = '';

    if (template === 'desenvolvedor') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Desenvolvedor de Software'}</div>
          </div>
        </div>
        <div class="resume-body">
          <div class="resume-main">
            ${p.summary ? `<h3>Sobre</h3><p style="font-size:0.84rem;line-height:1.6;color:#475569;margin-bottom:12px">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainProjects}
            ${mainCerts}
          </div>
          <div class="resume-sidebar">
            ${contactHtml}
            ${sidebarSocial}
            ${allSkills.length ? `<h3>Skills</h3><div style="margin-bottom:12px">${skillTagsHtml}</div>` : ''}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
          </div>
        </div>
      `;
    } else if (template === 'designer') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Designer'}</div>
          </div>
          <div class="contact-bar" style="margin-top:6px">${contactBarHtml}</div>
        </div>
        <div class="resume-body">
          <div class="resume-sidebar">
            ${sidebarSocial}
            ${allSkills.length ? `<h3>Habilidades</h3>${skillBarsHtml}` : ''}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
          </div>
          <div class="resume-main">
            ${p.summary ? `<h3>Perfil</h3><p style="font-size:0.84rem;line-height:1.6;color:#475569;margin-bottom:12px">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainProjects}
            ${mainCerts}
          </div>
        </div>
      `;
    } else if (template === 'advocacia') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Advogado'}</div>
          </div>
        </div>
        <div class="resume-body">
          <div class="resume-sidebar">
            ${contactHtml}
            ${sidebarSocial}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
          </div>
          <div class="resume-main">
            ${p.summary ? `<h3>Perfil Profissional</h3><p style="font-size:0.84rem;line-height:1.6;color:#475569;margin-bottom:12px;font-style:italic">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainCerts}
          </div>
        </div>
      `;
    } else if (template === 'medicina') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Médico'}</div>
          </div>
        </div>
        <div class="resume-body" style="grid-template-columns:1fr">
          ${p.summary ? `<div style="margin-bottom:16px;padding:12px 16px;background:#f0fdfa;border-left:4px solid #0d9488;border-radius:4px;font-size:0.85rem;line-height:1.6;color:#475569">${escapeHtml(p.summary)}</div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <div>
              <h3>Experiência</h3>
              ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            </div>
            <div>
              <h3>Formação</h3>
              ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:24px;margin-top:16px">
            <div style="flex:1;min-width:200px">
              <h3>Certificações</h3>
              ${certsHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma certificação adicionada</p>'}
            </div>
            <div style="flex:1;min-width:200px">
              <h3>Idiomas</h3>
              ${languagesHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhum idioma adicionado</p>'}
            </div>
          </div>
          ${allSkills.length ? `<h3>Áreas de Atuação</h3><div class="skill-chips">${skillChipsHtml}</div>` : ''}
          ${sidebarSocial ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0">${sidebarSocial}</div>` : ''}
          <div class="contact-bar" style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px">${contactBarHtml}</div>
        </div>
      `;
    } else if (template === 'engenharia') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Engenheiro'}</div>
          </div>
        </div>
        <div class="resume-body">
          <div class="resume-main">
            ${p.summary ? `<h3>Resumo Técnico</h3><p style="font-size:0.84rem;line-height:1.6;color:#475569;margin-bottom:12px">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainCerts}
          </div>
          <div class="resume-sidebar">
            ${contactHtml}
            ${sidebarSocial}
            ${allSkills.length ? `<h3>Competências</h3><div style="margin-bottom:12px">${skillTagsHtml}</div>` : ''}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
            ${mainProjects ? `<h3>Projetos</h3>${projectsHtml}` : ''}
          </div>
        </div>
      `;
    } else if (template === 'marketing') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Profissional de Marketing'}</div>
          </div>
          <div class="contact-bar" style="margin-top:6px">${contactBarHtml}</div>
        </div>
        <div class="resume-body">
          <div class="resume-main">
            ${p.summary ? `<h3>Sobre</h3><p style="font-size:0.84rem;line-height:1.6;color:#475569;margin-bottom:12px">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainCerts}
            ${mainProjects}
          </div>
          <div class="resume-sidebar">
            ${contactHtml.replace(/<div class="contact-item">/g, '<div class="contact-item" style="color:#9a3412">')}
            ${sidebarSocial}
            ${allSkills.length ? `<h3>Habilidades</h3>${skillBarsHtml}` : ''}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
          </div>
        </div>
      `;
    } else if (template === 'professor') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Professor'}</div>
          </div>
        </div>
        <div class="resume-body" style="grid-template-columns:1fr">
          ${p.summary ? `<div style="margin-bottom:16px;padding:16px;background:#f5f3ff;border-radius:6px;font-size:0.85rem;line-height:1.6;color:#475569">${escapeHtml(p.summary)}</div>` : ''}
          <h3>Formação Acadêmica</h3>
          ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
          <h3>Experiência Docente</h3>
          ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
          <div style="display:flex;flex-wrap:wrap;gap:24px;margin-top:16px">
            <div style="flex:1;min-width:200px">
              <h3>Certificações</h3>
              ${certsHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma certificação adicionada</p>'}
            </div>
            <div style="flex:1;min-width:200px">
              <h3>Idiomas</h3>
              ${languagesHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhum idioma adicionado</p>'}
            </div>
          </div>
          ${sidebarSocial ? `<div style="margin-top:12px">${sidebarSocial}</div>` : ''}
          ${allSkills.length ? `<h3>Áreas de Conhecimento</h3><div class="skill-chips">${skillChipsHtml}</div>` : ''}
          <div class="contact-bar" style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:12px">${contactBarHtml}</div>
        </div>
      `;
    } else if (template === 'administrativo') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Auxiliar Administrativo'}</div>
          </div>
        </div>
        <div class="resume-body">
          <div class="resume-main">
            ${p.summary ? `<h3>Resumo</h3><p style="font-size:0.84rem;line-height:1.6;color:#475569;margin-bottom:12px">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainCerts}
          </div>
          <div class="resume-sidebar">
            ${contactHtml}
            ${sidebarSocial}
            ${allSkills.length ? `<h3>Competências</h3><div style="margin-bottom:12px">${skillTagsHtml}</div>` : ''}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
          </div>
        </div>
      `;
    } else if (template === 'jovem-aprendiz') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Jovem Aprendiz'}</div>
          </div>
        </div>
        <div class="resume-body" style="grid-template-columns:1fr">
          ${p.summary ? `<div style="margin-bottom:16px;padding:12px 16px;background:#ecfeff;border-left:4px solid #22d3ee;border-radius:4px;font-size:0.85rem;line-height:1.6;color:#475569">${escapeHtml(p.summary)}</div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div>
              <h3>Formação</h3>
              ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            </div>
            <div>
              <h3>Idiomas</h3>
              ${languagesHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhum idioma adicionado</p>'}
            </div>
          </div>
          ${allSkills.length ? `<h3>Habilidades</h3><div class="skill-chips" style="margin-bottom:12px">${skillChipsHtml}</div>` : ''}
          ${experienceHtml ? `<h3>Experiência</h3>${experienceHtml}` : ''}
          ${mainCerts}
          ${sidebarSocial ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0">${sidebarSocial}</div>` : ''}
          <div class="contact-bar" style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px;font-size:0.82rem">${contactBarHtml}</div>
        </div>
      `;
    } else if (template === 'executivo') {
      html = `
        <div class="resume-header">
          <div class="photo-frame">${photoHtml}</div>
          <div>
            <h1>${escapeHtml(p.name) || 'Nome Completo'}</h1>
            <div class="title">${escapeHtml(p.title) || 'Executivo'}</div>
          </div>
        </div>
        <div class="resume-body">
          <div class="resume-sidebar">
            ${contactHtml}
            ${sidebarSocial}
            ${allSkills.length ? `<h3>Competências</h3>${skillBarsHtml}` : ''}
            ${languagesHtml ? `<h3>Idiomas</h3>${languagesHtml}` : ''}
          </div>
          <div class="resume-main">
            ${p.summary ? `<h3>Perfil Executivo</h3><p style="font-size:0.85rem;line-height:1.7;margin-bottom:16px;color:#475569">${escapeHtml(p.summary)}</p>` : ''}
            <h3>Experiência</h3>
            ${experienceHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma experiência adicionada</p>'}
            <h3>Formação</h3>
            ${educationHtml || '<p style="color:#94a3b8;font-size:0.85rem">Nenhuma formação adicionada</p>'}
            ${mainCerts}
            ${mainProjects}
          </div>
        </div>
      `;
    }

    preview.innerHTML = html;
    preview.style.fontFamily = font + ', sans-serif';
    preview.className = 'preview-content template-' + template;
  }

  function saveResume() {
    const user = Auth.getCurrentUser();
    if (!user) { showToast('Sessão expirada.', 'error'); return; }

    const name = document.getElementById('fullName')?.value || 'Sem título';
    if (!name || name === 'Sem título') {
      showToast('Preencha pelo menos o nome.', 'error');
      return;
    }

    const data = getFormData();
    data.updatedAt = new Date().toISOString();

    const resumes = getResumes();
    const userResumes = resumes[user.email] || [];

    if (currentResumeId) {
      const idx = userResumes.findIndex(r => r.id === currentResumeId);
      if (idx >= 0) {
        data.id = currentResumeId;
        data.createdAt = userResumes[idx].createdAt;
        userResumes[idx] = data;
      } else {
        data.id = currentResumeId;
        data.createdAt = data.updatedAt;
        userResumes.push(data);
      }
    } else {
      data.id = generateId();
      data.createdAt = data.updatedAt;
      userResumes.push(data);
      currentResumeId = data.id;
    }

    resumes[user.email] = userResumes;
    saveResumes(resumes);
    showToast('Currículo salvo com sucesso!', 'success');
  }

  function showToast(msg, type) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
  }

  function addEducation(data) {
    const container = document.getElementById('educationContainer');
    const div = document.createElement('div');
    div.className = 'repeatable-item education-item';
    div.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Instituição</label><input class="ed-institution" value="${escapeHtml(data?.institution || '')}"></div>
        <div class="form-group"><label>Localização</label><input class="ed-location" value="${escapeHtml(data?.location || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Grau/Curso</label><input class="ed-degree" value="${escapeHtml(data?.degree || '')}"></div>
        <div class="form-group"><label>Área de Estudo</label><input class="ed-field" value="${escapeHtml(data?.field || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Data Início</label><input type="date" class="ed-start" value="${escapeHtml(data?.startDate || '')}"></div>
        <div class="form-group"><label>Data Término</label><input type="date" class="ed-end" value="${escapeHtml(data?.endDate || '')}"></div>
      </div>
      <div class="form-group"><label>Descrição</label><textarea class="ed-desc" rows="2">${escapeHtml(data?.description || '')}</textarea></div>
    `;
    container.appendChild(div);
  }

  function addExperience(data) {
    const container = document.getElementById('experienceContainer');
    const div = document.createElement('div');
    div.className = 'repeatable-item experience-item';
    div.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Empresa</label><input class="exp-company" value="${escapeHtml(data?.company || '')}"></div>
        <div class="form-group"><label>Cargo</label><input class="exp-position" value="${escapeHtml(data?.position || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Localização</label><input class="exp-location" value="${escapeHtml(data?.location || '')}"></div>
        <div class="form-group"><label>Data Início</label><input type="date" class="exp-start" value="${escapeHtml(data?.startDate || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Data Término</label><input type="date" class="exp-end" value="${escapeHtml(data?.endDate || '')}"></div>
        <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:10px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" class="exp-current" ${data?.current ? 'checked' : ''}> Trabalho atual
          </label>
        </div>
      </div>
      <div class="form-group"><label>Descrição</label><textarea class="exp-desc" rows="3">${escapeHtml(data?.description || '')}</textarea></div>
    `;
    container.appendChild(div);
  }

  function addSkill(data) {
    const container = document.getElementById('skillsContainer');
    const div = document.createElement('div');
    div.className = 'repeatable-item skill-item';
    div.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
      <div class="form-row-3">
        <div class="form-group"><label>Habilidade</label><input class="skill-name-input" value="${escapeHtml(data?.name || '')}"></div>
        <div class="form-group"><label>Nível (0-100)</label><input type="range" min="0" max="100" class="skill-level" value="${data?.level || 50}" oninput="this.nextElementSibling.textContent=this.value"><span style="font-size:0.85rem;margin-left:4px">${data?.level || 50}%</span></div>
        <div class="form-group"><label>Categoria</label><select class="skill-category"><option value="technical" ${(data?.category||'technical')==='technical'?'selected':''}>Técnica</option><option value="soft" ${data?.category==='soft'?'selected':''}>Comportamental</option><option value="tool" ${data?.category==='tool'?'selected':''}>Ferramenta</option><option value="language" ${data?.category==='language'?'selected':''}>Idioma</option><option value="other" ${data?.category==='other'?'selected':''}>Outra</option></select></div>
      </div>
    `;
    container.appendChild(div);
  }

  function addLanguage(data) {
    const container = document.getElementById('languagesContainer');
    const div = document.createElement('div');
    div.className = 'repeatable-item language-item';
    div.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Idioma</label><input class="lang-name" value="${escapeHtml(data?.name || '')}"></div>
        <div class="form-group"><label>Proficiência</label><select class="lang-proficiency"><option value="Básico" ${(data?.proficiency||'')==='Básico'?'selected':''}>Básico</option><option value="Intermediário" ${data?.proficiency==='Intermediário'?'selected':''}>Intermediário</option><option value="Avançado" ${data?.proficiency==='Avançado'?'selected':''}>Avançado</option><option value="Fluente" ${data?.proficiency==='Fluente'?'selected':''}>Fluente</option><option value="Nativo" ${data?.proficiency==='Nativo'?'selected':''}>Nativo</option></select></div>
      </div>
    `;
    container.appendChild(div);
  }

  function addCertification(data) {
    const container = document.getElementById('certsContainer');
    const div = document.createElement('div');
    div.className = 'repeatable-item cert-item';
    div.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Certificação</label><input class="cert-name" value="${escapeHtml(data?.name || '')}"></div>
        <div class="form-group"><label>Instituição</label><input class="cert-issuer" value="${escapeHtml(data?.issuer || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Data</label><input type="date" class="cert-date" value="${escapeHtml(data?.date || '')}"></div>
        <div class="form-group"></div>
      </div>
      <div class="form-group"><label>Descrição</label><textarea class="cert-desc" rows="2">${escapeHtml(data?.description || '')}</textarea></div>
    `;
    container.appendChild(div);
  }

  function addProject(data) {
    const container = document.getElementById('projectsContainer');
    const div = document.createElement('div');
    div.className = 'repeatable-item project-item';
    div.innerHTML = `
      <button class="remove-btn" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Projeto</label><input class="proj-name" value="${escapeHtml(data?.name || '')}"></div>
        <div class="form-group"><label>Link</label><input class="proj-link" placeholder="https://..." value="${escapeHtml(data?.link || '')}"></div>
      </div>
      <div class="form-group"><label>Tecnologias</label><input class="proj-techs" placeholder="React, Node.js, MongoDB" value="${escapeHtml(data?.techs || '')}"></div>
      <div class="form-group"><label>Descrição</label><textarea class="proj-desc" rows="2">${escapeHtml(data?.description || '')}</textarea></div>
    `;
    container.appendChild(div);
  }

  function addSocial(data) {
    const container = document.getElementById('socialContainer');
    const div = document.createElement('div');
    div.className = 'social-input-row';
    div.innerHTML = `
      <select>
        <option value="LinkedIn" ${(data?.platform||'')==='LinkedIn'?'selected':''}>LinkedIn</option>
        <option value="GitHub" ${data?.platform==='GitHub'?'selected':''}>GitHub</option>
        <option value="Twitter" ${data?.platform==='Twitter'?'selected':''}>Twitter/X</option>
        <option value="Instagram" ${data?.platform==='Instagram'?'selected':''}>Instagram</option>
        <option value="Facebook" ${data?.platform==='Facebook'?'selected':''}>Facebook</option>
        <option value="YouTube" ${data?.platform==='YouTube'?'selected':''}>YouTube</option>
        <option value="Portfolio" ${data?.platform==='Portfolio'?'selected':''}>Portfólio</option>
        <option value="Outro" ${data?.platform==='Outro'?'selected':''}>Outro</option>
      </select>
      <input placeholder="URL completa (https://...)" value="${escapeHtml(data?.url || '')}">
      <button class="remove-social" onclick="this.parentElement.remove(); renderPreview();" title="Remover">&times;</button>
    `;
    container.appendChild(div);
  }

  function loadExistingResume(id) {
    const resumes = getResumes();
    const user = Auth.getCurrentUser();
    if (!user) return;

    const userResumes = resumes[user.email] || [];
    const resume = userResumes.find(r => r.id === id);
    if (!resume) return;

    currentResumeId = id;
    currentPhoto = resume.personalInfo?.photo || null;

    const p = resume.personalInfo || {};
    document.getElementById('fullName').value = p.name || '';
    document.getElementById('professionalTitle').value = p.title || '';
    document.getElementById('summary').value = p.summary || '';
    document.getElementById('email').value = p.email || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('address').value = p.address || '';
    document.getElementById('website').value = p.website || '';
    document.getElementById('templateSelect').value = resume.template || 'desenvolvedor';
    document.getElementById('fontSelect').value = resume.font || 'Inter';

    if (p.photo) {
      document.getElementById('photoPreview').innerHTML = `<img src="${p.photo}" alt="Foto">`;
    }

    (resume.social || []).forEach(s => addSocial(s));
    function normalizeDate(d) { return d && d.match(/^\d{4}-\d{2}$/) ? d + '-01' : d; }
    (resume.education || []).forEach(e => { e.startDate = normalizeDate(e.startDate); e.endDate = normalizeDate(e.endDate); addEducation(e); });
    (resume.experience || []).forEach(e => { e.startDate = normalizeDate(e.startDate); e.endDate = normalizeDate(e.endDate); addExperience(e); });
    (resume.skills || []).forEach(s => addSkill(s));
    (resume.languages || []).forEach(l => addLanguage(l));
    (resume.certifications || []).forEach(c => { c.date = normalizeDate(c.date); addCertification(c); });
    (resume.projects || []).forEach(p => addProject(p));

    renderPreview();
  }

  function handlePhotoUpload(input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('A foto deve ter no máximo 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      currentPhoto = e.target.result;
      document.getElementById('photoPreview').innerHTML = `<img src="${currentPhoto}" alt="Foto">`;
      renderPreview();
    };
    reader.readAsDataURL(file);
  }

  function initBuilder() {
    if (!Auth.checkAuth('index.html')) return;

    const user = Auth.getCurrentUser();
    if (!user) return;

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

    const params = new URLSearchParams(window.location.search);
    const resumeId = params.get('id');
    if (resumeId) {
      loadExistingResume(resumeId);
    }

    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(el => {
      el.addEventListener('input', renderPreview);
      el.addEventListener('change', renderPreview);
    });

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveResume);

    const pdfBtn = document.getElementById('exportPdfBtn');
    if (pdfBtn) pdfBtn.addEventListener('click', () => ResumeExport.downloadPDF(document.getElementById('previewContent')));

    const imgBtn = document.getElementById('exportImgBtn');
    if (imgBtn) imgBtn.addEventListener('click', () => ResumeExport.downloadImage(document.getElementById('previewContent')));

    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) templateSelect.addEventListener('change', renderPreview);

    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) fontSelect.addEventListener('change', renderPreview);

    const photoInput = document.getElementById('photoInput');
    if (photoInput) photoInput.addEventListener('change', () => handlePhotoUpload(photoInput));

    window.addSocial = () => { addSocial(); renderPreview(); };
    window.addEducation = () => { addEducation(); renderPreview(); };
    window.addExperience = () => { addExperience(); renderPreview(); };
    window.addSkill = () => { addSkill(); renderPreview(); };
    window.addLanguage = () => { addLanguage(); renderPreview(); };
    window.addCertification = () => { addCertification(); renderPreview(); };
    window.addProject = () => { addProject(); renderPreview(); };
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('fullName')) {
      initBuilder();
    }
  });
})();
