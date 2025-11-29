
/* Estrelas canvas (pensando em tirar tá lagando o site) */
(function initStarfield() {
  const canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const starsCount = Math.floor((w * h) / 8000);
  const stars = [];

  function rand(min, max) { return Math.random() * (max - min) + min }

  for (let i = 0; i < starsCount; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: rand(0.2, 1),
      r: rand(0.3, 1.4),
      dx: rand(-0.02, 0.02),
      dy: rand(-0.05, 0.05)
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.6 * s.z})`;
      ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
      ctx.fill();
      s.x += s.dx * (1 + 2 * (s.z - 0.2));
      s.y += s.dy * (1 + 2 * (s.z - 0.2));
      if (s.x < 0) s.x = w;
      if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h;
      if (s.y > h) s.y = 0;
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { w = canvas.width = innerWidth; h = canvas.height = innerHeight; });
  draw();
})();

/* SCROLL */
(function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add('visible');
        obs.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* NAV link ativo */
(function initNavActive() {
  const page = document.body.datasetPage || document.body.getAttribute('data-page') || '';
  document.querySelectorAll('.main-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes(page)) a.classList.add('active');
  });
})();

(function initLazy() {

})();

/* SORTEIO */
(function initSorteio() {
  const form = document.getElementById('sorteioForm');
  if (!form) return;

  const STORAGE_KEY = 'marvel_sorteio_v2';

  function somenteDigitos(s) { return (s || '').toString().replace(/\D/g, '') }

  // CPF validação 
  function validaCPF(cpf) {
    cpf = somenteDigitos(cpf);
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    const digits = cpf.split('').map(Number);
    const calc = (arr, factor) => {
      let total = 0;
      for (let i = 0; i < arr.length; i++) {
        total += arr[i] * (factor - i);
      }
      let res = (total * 10) % 11;
      return res === 10 ? 0 : res;
    };
    const d1 = calc(digits.slice(0, 9), 10);
    const d2 = calc(digits.slice(0, 10), 11);
    return d1 === digits[9] && d2 === digits[10];
  }

  function validaTel(tel) {
    const d = somenteDigitos(tel);
    return d.length === 10 || d.length === 11;
  }

  function carregar() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch (e) { return [] } }
  function salvar(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) }

  const cpfInput = document.getElementById('cpf');
  const telInput = document.getElementById('telefone');
  if (cpfInput) {
    cpfInput.addEventListener('input', function () {
      let v = somenteDigitos(this.value).slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      this.value = v;
    });
  }
  if (telInput) {
    telInput.addEventListener('input', function () {
      let v = somenteDigitos(this.value).slice(0, 11);
      if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      this.value = v.trim();
    });
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = (document.getElementById('nome') || {}).value?.trim();
    const endereco = (document.getElementById('endereco') || {}).value?.trim();
    const cpf = (document.getElementById('cpf') || {}).value?.trim();
    const idade = parseInt((document.getElementById('idade') || {}).value, 10);
    const telefone = (document.getElementById('telefone') || {}).value?.trim();
    const revista = (document.getElementById('revista') || {}).value || '';

    if (!nome || nome.length < 3) { alert('Nome inválido'); return }
    if (!endereco || endereco.length < 5) { alert('Endereço inválido'); return }
    if (!validaCPF(cpf)) { alert('CPF inválido'); return }
    if (!Number.isInteger(idade) || idade < 12) { alert('Idade inválida (mínimo 12)'); return }
    if (!validaTel(telefone)) { alert('Telefone inválido'); return }
    if (!revista) { alert('Escolha uma revista'); return }

    // persistir 
    const inscritos = carregar();
    const digCpf = somenteDigitos(cpf);
    if (inscritos.some(i => i.cpf === digCpf)) { alert('CPF já cadastrado'); return }

    inscritos.push({
      nome, endereco, cpf: digCpf, idade, telefone: somenteDigitos(telefone), revista, date: new Date().toISOString()
    });
    salvar(inscritos);
    alert('Cadastro realizado com sucesso!');
    form.reset();
    atualizarLista();
  });

  // sortear
  const btnSortear = document.getElementById('btnSortear');
  const winnerBox = document.getElementById('vencedor');
  function atualizarLista() {
    const ul = document.getElementById('listaInscritos');
    if (!ul) return;
    const inscritos = carregar();
    ul.innerHTML = inscritos.length ? inscritos.map((s, i) => `<li>${i + 1}. ${s.nome} — ${s.idade} anos — ${s.revista}</li>`).join('') : '<li>Nenhum inscrito ainda.</li>';
  }
  if (btnSortear) {
    btnSortear.addEventListener('click', () => {
      const inscritos = carregar();
      if (!inscritos.length) { alert('Sem inscritos'); return }
      const idx = Math.floor(Math.random() * inscritos.length);
      const w = inscritos[idx];
      winnerBox.innerHTML = `<strong>Vencedor:</strong> ${w.nome} — ${w.revista}`;
    });
  }
  const btnLimpar = document.getElementById('btnLimpar');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      atualizarLista();
      if (winnerBox) winnerBox.innerHTML = '';
    });
  }
  setTimeout(atualizarLista, 500);
})();

// Botão voltar ao topo
const btnTopo = document.getElementById('btnTopo');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    btnTopo.classList.add('mostrar');
  } else {
    btnTopo.classList.remove('mostrar');
  }
});

btnTopo.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});