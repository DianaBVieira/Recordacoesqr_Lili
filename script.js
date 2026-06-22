let isAdminLogado = false;

// Caches de Mídia Voláteis
let imagensBase64Cache = {
    fotoPrincipal: "",
    fotoBiografia: ""
};
let fotoFamiliarTemporaria = "";

const fotosPadraoGaleria = [
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=600",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600",
    "https://images.unsplash.com/photo-1509099836639-18ba1795216d?q=80&w=600"
];

const dadosPadraoCMS = {
    nome: "Nome do Homenageado",
    apelido: '"Apelido da Pessoa"',
    datas: "00/00/1950 • 00/00/2026",
    cidadeNatal: "Lajinha de Pancas, Espírito Santo",
    ultimaResidencia: "Vitória, Espírito Santo",
    sepMunicipio: "Vitória, Espírito Santo",
    sepLocal: "Cemitério Municipal Boa Vista",
    sepEndereco: "Avenida Adolfo Casoli, 318, Maruípe, Vitória - ES",
    sepIdentificacao: "Gaveta 217",
    biografia: "Aqui entra a história cronológica e emocionante da pessoa homenageada...",
    videoYoutubeId: "dQw4w9WgXcQ",
    familia: [
        { id: 1, nome: "Nome do Pai", grau: "Pai", nivel: "pais", foto: "" },
        { id: 2, nome: "Nome da Mãe", grau: "Mãe", nivel: "pais", foto: "" },
        { id: 3, nome: "Nome do Cônjuge", grau: "Esposo/a", nivel: "conjuge", foto: "" },
        { id: 4, nome: "Nome do Filho", grau: "Filho/a", nivel: "filhos", foto: "" },
        { id: 5, nome: "Nome do Genro", grau: "Genro", nivel: "genros", foto: "" },
        { id: 6, nome: "Nome do Neto", grau: "Neto/a", nivel: "netos", foto: "" }
    ],
    galeria: [...fotosPadraoGaleria]
};

function alternarSecaoCms(idSecao) {
    const secoes = document.querySelectorAll('#site-principal .section-content');
    secoes.forEach(secao => secao.classList.remove('secao-ativa'));

    const secaoAlvo = document.getElementById(idSecao);
    if (secaoAlvo) {
        secaoAlvo.classList.add('secao-ativa');
        if(idSecao === 'biografia') {
            const bioArea = document.getElementById('txt-biografia');
            if(bioArea) ajustarAlturaTextoAuto(bioArea);
        }
    }

    const linksMenu = document.querySelectorAll('.menu a');
    linksMenu.forEach(link => {
        link.classList.remove('link-ativo');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${idSecao}'`)) {
            link.classList.add('link-ativo');
        }
    });
    window.scrollTo(0, 0);
}

function ajustarAlturaTextoAuto(elemento) {
    if(!elemento) return;
    elemento.style.height = 'auto';
    elemento.style.height = elemento.scrollHeight + 'px';
}

function carregarConteudoCms() {
    // Sincronização em tempo real do Conteúdo CMS pelo Firebase
    const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
    window.dbOnValue(cmsRef, (snapshot) => {
        let dados = snapshot.val() || dadosPadraoCMS;

        document.getElementById('inp-nome').value = dados.nome || "";
        document.getElementById('inp-apelido').value = dados.apelido || "";
        document.getElementById('inp-datas').value = dados.datas || "";
        document.getElementById('inp-cidade-natal').value = dados.cidadeNatal || "";
        document.getElementById('inp-ultima-residencia').value = dados.ultimaResidencia || "";
        document.getElementById('inp-sep-municipio').value = dados.sepMunicipio || "";
        document.getElementById('inp-sep-local').value = dados.sepLocal || "";
        document.getElementById('inp-sep-endereco').value = dados.sepEndereco || "";
        document.getElementById('inp-sep-identificacao').value = dados.sepIdentificacao || "";
        
        const bioTextarea = document.getElementById('txt-biografia');
        if(bioTextarea) {
            bioTextarea.value = dados.biografia || "";
            ajustarAlturaTextoAuto(bioTextarea);
        }

        document.getElementById('input-id-youtube').value = dados.videoYoutubeId || "";

        sincronizarTextosIntro();
        atualizarIframeVideo(dados.videoYoutubeId);
        renderizarArvoreGenealogica(dados.familia || []);
        renderizarGaleriaFotos(dados.galeria || []);
    });

    // Sincronização em tempo real das Fotos principais pelo Firebase
    const fotosRef = window.dbRef(window.database, 'banco_cms_fotos');
    window.dbOnValue(fotosRef, (snapshot) => {
        let fotosSalvas = snapshot.val();
        if(fotosSalvas) {
            imagensBase64Cache = fotosSalvas;
            if(fotosSalvas.fotoPrincipal) {
                document.getElementById('img-intro').src = fotosSalvas.fotoPrincipal;
                document.getElementById('img-perfil').src = fotosSalvas.fotoPrincipal;
            }
            if(fotosSalvas.fotoBiografia) document.getElementById('img-bio').src = fotosSalvas.fotoBiografia;
        }
    });
}

function renderizarArvoreGenealogica(listaFamiliares) {
    const niveis = ['pais', 'conjuge', 'filhos', 'genros', 'netos'];
    niveis.forEach(n => {
        const c = document.getElementById(`container-nivel-${n}`);
        if(c) c.innerHTML = "";
    });

    // Converte objeto do Firebase em array se necessário
    const lista = Array.isArray(listaFamiliares) ? listaFamiliares : Object.values(listaFamiliares || {});

    lista.forEach(parente => {
        const container = document.getElementById(`container-nivel-${parente.nivel}`);
        if(!container) return;

        const card = document.createElement('div');
        card.className = 'parente-item';
        let srcFoto = parente.foto || 'https://via.placeholder.com/75?text=Família';
        let btnDeletar = isAdminLogado ? `<button class="btn-deletar-familiar" onclick="removerFamiliarDaArvore('${parente.id}')">X</button>` : '';

        card.innerHTML = `
            ${btnDeletar}
            <img src="${srcFoto}" alt="Familiar" class="foto-parente">
            <div class="parente-nome">${parente.nome} <span class="parente-grau">(${parente.grau})</span></div>
        `;
        container.appendChild(card);
    });
}

function renderizarGaleriaFotos(listaFotos) {
    const container = document.getElementById('galeria-fotos-container');
    if(!container) return;
    container.innerHTML = "";

    const lista = Array.isArray(listaFotos) ? listaFotos : Object.values(listaFotos || {});
    if (lista.length === 0) return;
    
    const listaTriplicada = [...lista, ...lista, ...lista];

    listaTriplicada.forEach((fotoUrl, indexVisivel) => {
        const indexOriginal = indexVisivel % lista.length;
        const box = document.createElement('div');
        box.className = 'galeria-item-box';
        
        let btnDeletar = (isAdminLogado && indexVisivel < lista.length) 
            // Para deletar usando chaves do Firebase de forma simples
            ? `<button class="btn-deletar-foto-galeria" onclick="removerFotoGaleria(${indexOriginal})"><i class="fas fa-trash"></i> Excluir</button>` 
            : '';
        
        box.innerHTML = `
            ${btnDeletar}
            <img src="${fotoUrl}" alt="Foto Memorial">
        `;
        container.appendChild(box);
    });
}

function adicionarFotoGaleria(input) {
    if (input.files && input.files[0]) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
            // Busca dados atuais primeiro para atualizar o array
            window.dbOnValue(cmsRef, (snapshot) => {
                let dados = snapshot.val() || dadosPadraoCMS;
                if(!dados.galeria) dados.galeria = [];
                dados.galeria.push(e.target.result);
                
                window.dbSet(window.dbRef(window.database, 'banco_cms_memorial'), dados)
                    .then(() => {
                        document.getElementById('upload-nova-foto-galeria').value = "";
                        alert("Foto adicionada com sucesso!");
                    });
            }, { onlyOnce: true });
        };
        leitor.readAsDataURL(input.files[0]);
    }
}

function removerFotoGaleria(index) {
    if(confirm("Deseja realmente remover esta foto da galeria?")) {
        const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
        window.dbOnValue(cmsRef, (snapshot) => {
            let dados = snapshot.val() || dadosPadraoCMS;
            if(dados.galeria) {
                dados.galeria.splice(index, 1);
                window.dbSet(window.dbRef(window.database, 'banco_cms_memorial'), dados);
            }
        }, { onlyOnce: true });
    }
}

function sincronizarTextosIntro() {
    document.getElementById('txt-nome-intro').innerText = document.getElementById('inp-nome').value;
    document.getElementById('txt-apelido-intro').innerText = document.getElementById('inp-apelido').value;
    document.getElementById('txt-datas-intro').innerText = document.getElementById('inp-datas').value;
}

function atualizarFotoUpload(input, idImgDestino, chaveCache) {
    if (input.files && input.files[0]) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            const base64String = e.target.result;
            document.getElementById(idImgDestino).src = base64String;
            if(chaveCache === 'fotoPrincipal') {
                document.getElementById('img-intro').src = base64String;
                document.getElementById('img-perfil').src = base64String;
            }
            imagensBase64Cache[chaveCache] = base64String;
        };
        leitor.readAsDataURL(input.files[0]);
    }
}

function processarFotoFamiliarTemporaria(input) {
    if (input.files && input.files[0]) {
        const leitor = new FileReader();
        leitor.onload = function(e) { fotoFamiliarTemporaria = e.target.result; };
        leitor.readAsDataURL(input.files[0]);
    }
}

function adicionarFamiliarAoLegado() {
    const nome = document.getElementById('add-fam-nome').value.trim();
    const nivel = document.getElementById('add-fam-nivel').value;
    const grau = document.getElementById('add-fam-grau').value.trim();

    if(!nome || !grau) { alert("Preencha o Nome e o Parentesco."); return; }

    const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
    window.dbOnValue(cmsRef, (snapshot) => {
        let dados = snapshot.val() || dadosPadraoCMS;
        if(!dados.familia) dados.familia = [];
        
        dados.familia.push({ id: String(Date.now()), nome: nome, grau: grau, nivel: nivel, foto: fotoFamiliarTemporaria || "" });
        
        window.dbSet(window.dbRef(window.database, 'banco_cms_memorial'), dados).then(() => {
            document.getElementById('add-fam-nome').value = "";
            document.getElementById('add-fam-grau').value = "";
            document.getElementById('add-fam-foto').value = "";
            fotoFamiliarTemporaria = "";
            alert("Familiar adicionado!");
        });
    }, { onlyOnce: true });
}

function removerFamiliarDaArvore(id) {
    if(confirm("Deseja remover da árvore?")) {
        const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
        window.dbOnValue(cmsRef, (snapshot) => {
            let dados = snapshot.val() || dadosPadraoCMS;
            if(dados.familia) {
                dados.familia = dados.familia.filter(item => String(item.id) !== String(id));
                window.dbSet(window.dbRef(window.database, 'banco_cms_memorial'), dados);
            }
        }, { onlyOnce: true });
    }
}

function salvarAlteracoesGlobais() {
    const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
    window.dbOnValue(cmsRef, (snapshot) => {
        let dados = snapshot.val() || dadosPadraoCMS;

        dados.nome = document.getElementById('inp-nome').value;
        dados.apelido = document.getElementById('inp-apelido').value;
        dados.datas = document.getElementById('inp-datas').value;
        dados.cidadeNatal = document.getElementById('inp-cidade-natal').value;
        dados.ultimaResidencia = document.getElementById('inp-ultima-residencia').value;
        dados.sepMunicipio = document.getElementById('inp-sep-municipio').value;
        dados.sepLocal = document.getElementById('inp-sep-local').value;
        dados.sepEndereco = document.getElementById('inp-sep-endereco').value;
        dados.sepIdentificacao = document.getElementById('inp-sep-identificacao').value;
        dados.biografia = document.getElementById('txt-biografia').value;
        dados.videoYoutubeId = document.getElementById('input-id-youtube').value.trim();

        window.dbSet(window.dbRef(window.database, 'banco_cms_memorial'), dados);
        window.dbSet(window.dbRef(window.database, 'banco_cms_fotos'), imagensBase64Cache);

        alert("Todas as alterações salvas com sucesso no Firebase!");
    }, { onlyOnce: true });
}

function atualizarIframeVideo(idVideo) {
    const iframe = document.getElementById('video-iframe-youtube');
    if(iframe && idVideo) { iframe.src = `https://www.youtube.com/embed/${idVideo}`; }
}

function alternarModoVisualCMS(ativar) {
    const principal = document.getElementById('site-principal');
    const barraEditor = document.getElementById('barra-editor-adm');
    const painelFamiliar = document.getElementById('painel-adicionar-familiar');
    const painelGaleria = document.getElementById('painel-gerenciar-galeria');
    const videoInput = document.getElementById('container-link-video');
    const botoesFoto = document.querySelectorAll('.btn-trocar-foto-cms');
    const labelsAdmin = document.querySelectorAll('.lbl-cms-admin');

    if(ativar) {
        principal.classList.add('modo-admin-ativo');
        barraEditor.classList.remove('hidden');
        painelFamiliar.classList.remove('hidden');
        painelGaleria.classList.remove('hidden');
        videoInput.classList.remove('hidden');
        botoesFoto.forEach(b => b.classList.remove('hidden'));
        labelsAdmin.forEach(l => l.classList.remove('hidden'));
    } else {
        principal.classList.remove('modo-admin-ativo');
        barraEditor.classList.add('hidden');
        painelFamiliar.classList.add('hidden');
        painelGaleria.classList.add('hidden');
        videoInput.classList.add('hidden');
        botoesFoto.forEach(b => b.classList.add('hidden'));
        labelsAdmin.forEach(l => l.classList.add('hidden'));
    }

    const cmsRef = window.dbRef(window.database, 'banco_cms_memorial');
    window.dbOnValue(cmsRef, (snapshot) => {
        let dados = snapshot.val() || dadosPadraoCMS;
        renderizarArvoreGenealogica(dados.familia || []);
        renderizarGaleriaFotos(dados.galeria || []);
    }, { onlyOnce: true });
}

function entrarNoSite() {
    const musica = document.getElementById('musica-fundo');
    const telaIntro = document.getElementById('tela-abertura');
    const sitePrincipal = document.getElementById('site-principal');

    if (musica) { musica.play().catch(e => console.log("Áudio aguardando ação.")); }
    
    if (telaIntro && sitePrincipal) {
        telaIntro.style.opacity = '0';
        setTimeout(() => {
            telaIntro.classList.add('hidden');
            sitePrincipal.classList.remove('hidden');
            
            carregarConteudoCms();
            carregarVelas();
            atualizarListasMensagens();
            checarStatusAdmPersistente();
            
            alternarSecaoCms('inicio');
        }, 500);
    }
}

// ==========================================================================
// MOTOR DO ALTAR EM TEMPO REAL (FIREBASE)
// ==========================================================================
let indexVelaGlobal = 0;

function solicitarNovaVela() {
    const nomeInput = document.getElementById('nome-vela');
    if (!nomeInput) return;
    
    const nome = nomeInput.value.trim();
    if (!nome) { alert("Por favor, digite seu nome para acender a vela."); return; }
    
    // Salva diretamente no Firebase Realtime Database
    const novaVelaRef = window.dbPush(window.dbRef(window.database, 'velas'));
    window.dbSet(novaVelaRef, { nome: nome, timestamp: Date.now() })
        .then(() => {
            nomeInput.value = "";
        });
}

function renderizarVelaPosicionadaOrganica(nome, index) {
    const camadaDinamica = document.getElementById('camada-velas-dinamicas');
    if (!camadaDinamica) return;

    const novaVelaBox = document.createElement('div');
    novaVelaBox.className = 'vela-box';
    
    let camadaAnel = 0;
    let indexNoAnel = index;
    const capacidadePorAnel = [6, 10, 14, 18, 22, 26];
    
    for (let i = 0; i < capacidadePorAnel.length; i++) {
        if (indexNoAnel >= capacidadePorAnel[i]) {
            indexNoAnel -= capacidadePorAnel[i];
            camadaAnel++;
        } else {
            break;
        }
    }

    const totalPosicoesNoAnel = capacidadePorAnel[camadaAnel] || 20;
    const anguloPasso = Math.PI / (totalPosicoesNoAnel + 1);
    const anguloAtual = anguloPasso * (indexNoAnel + 1);

    const raioXBase = 48 + (camadaAnel * 38); 
    const raioYBase = 8 + (camadaAnel * 14); 

    const deslocamentoX = Math.cos(anguloAtual) * raioXBase;
    const slotsY = -Math.sin(anguloAtual) * raioYBase;

    const alturaOrigemY = 325; 
    const yCalculado = alturaOrigemY + slotsY;

    const ruidoX = (Math.sin(index * 4.5) * 5);
    const ruidoY = (Math.cos(index * 3.2) * 3);

    const xFinal = `calc(50% + ${deslocamentoX + ruidoX}px - 13px)`;
    const yFinal = `${yCalculado + ruidoY}px`;

    const escalaProporcao = Math.max(0.68, 1 - (camadaAnel * 0.05));
    const zIndexCamada = Math.floor(yCalculado);

    novaVelaBox.style.left = xFinal;
    novaVelaBox.style.top = yFinal;
    novaVelaBox.style.zIndex = zIndexCamada;
    novaVelaBox.style.transform = `scale(${escalaProporcao})`;

    novaVelaBox.innerHTML = `
        <div class="vela-realista">
            <div class="chama-realista"></div>
        </div>
        <p class="rotulo-vela">${nome}</p>
    `;
    
    camadaDinamica.appendChild(novaVelaBox);
}

function carregarVelas() {
    const camadaDinamica = document.getElementById('camada-velas-dinamicas');
    
    // Escuta em tempo real todas as velas vindas do Firebase
    const velasRef = window.dbRef(window.database, 'velas');
    window.dbOnValue(velasRef, (snapshot) => {
        if (camadaDinamica) camadaDinamica.innerHTML = "";
        indexVelaGlobal = 0;

        // Velas fixas iniciais
        const padroes = [
            "Diana", "Pedro", "Maria", "João", "Carlos", "Ana de Souza", "Família Silva", "Clara",
            "Marcos", "Julia", "Roberto", "Sônia", "Lucas", "Beatriz", "Gabriel", "Fernanda"
        ];
        
        padroes.forEach(n => {
            renderizarVelaPosicionadaOrganica(n, indexVelaGlobal);
            indexVelaGlobal++;
        });
        
        // Renderiza as velas reais salvas no Firebase
        let dados = snapshot.val();
        if (dados) {
            Object.values(dados).forEach(vela => {
                renderizarVelaPosicionadaOrganica(vela.nome, indexVelaGlobal);
                indexVelaGlobal++;
            });
        }
    });
}

// ==========================================================================
// MENSAGENS E MODERAÇÃO EM TEMPO REAL (FIREBASE)
// ==========================================================================
function atualizarListasMensagens() {
    const muralPublico = document.getElementById('mural-mensagens');
    const listaPendentes = document.getElementById('lista-pendentes');
    
    const msgRef = window.dbRef(window.database, 'banco_mensagens');
    window.dbOnValue(msgRef, (snapshot) => {
        if (muralPublico) muralPublico.innerHTML = "";
        if (listaPendentes) listaPendentes.innerHTML = "";

        let dados = snapshot.val();
        if (!dados) {
            // Mensagem padrão caso o banco esteja vazio
            if (muralPublico) {
                muralPublico.innerHTML = `
                    <div class="mural-card">
                        <img src="https://via.placeholder.com/60" class="foto-msg" alt="Foto">
                        <div>
                            <h4>Maria Silva <span style="font-weight:normal; color:#888; font-size:0.85rem;">(Sobrinha)</span></h4>
                            <p style="margin-top:5px; font-style:italic; color:#555;">"Uma mensagem linda e carinhosa aparecerá estruturada aqui."</p>
                        </div>
                    </div>`;
            }
            return;
        }

        // Passa por cada mensagem vinda do Firebase
        Object.keys(dados).forEach(idChave => {
            const msg = dados[idChave];
            if (msg.aprovada) {
                if (muralPublico) {
                    muralPublico.innerHTML += `
                        <div class="mural-card">
                            <img src="https://via.placeholder.com/60" class="foto-msg" alt="Foto">
                            <div>
                                <h4>${msg.nome} <span style="font-weight:normal; color:#888; font-size:0.85rem;">(${msg.parentesco})</span></h4>
                                <p style="margin-top:5px; font-style:italic; color:#555;">"${msg.texto}"</p>
                            </div>
                        </div>`;
                }
            } else if (!msg.aprovada && isAdminLogado && listaPendentes) {
                listaPendentes.innerHTML += `
                    <div class="mural-card" style="border-color: #dfb76c;">
                        <img src="https://via.placeholder.com/60" class="foto-msg" alt="Foto">
                        <div>
                            <h4>${msg.nome} <span style="font-weight:normal; color:#888; font-size:0.85rem;">(${msg.parentesco})</span></h4>
                            <p style="margin-top:3px; color:#444;">"${msg.texto}"</p>
                        </div>
                        <div class="botoes-moderacao">
                            <button class="btn-aprovar" onclick="moderarMensagem('${idChave}', true)"><i class="fas fa-check"></i>固定 Aprovar</button>
                            <button class="btn-reprovar" onclick="moderarMensagem('${idChave}', false)"><i class="fas fa-trash"></i> Excluir</button>
                        </div>
                    </div>`;
            }
        });
    });
}

function moderarMensagem(idChave, aprovar) {
    const itemRef = window.dbRef(window.database, `banco_mensagens/${idChave}`);
    if (aprovar) {
        // Atualiza apenas o campo aprovada para true
        window.dbSet(window.dbRef(window.database, `banco_mensagens/${idChave}/aprovada`), true);
    } else {
        // Remove do Firebase
        window.dbRemove(itemRef);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('form-mensagem');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const nome = document.getElementById('msg-nome').value.trim();
            const parentesco = document.getElementById('msg-parentesco').value.trim();
            const texto = document.getElementById('msg-texto').value.trim();
            
            const novaMsgRef = window.dbPush(window.dbRef(window.database, 'banco_mensagens'));
            window.dbSet(novaMsgRef, {
                nome: nome,
                parentesco: parentesco,
                texto: texto,
                aprovada: false,
                timestamp: Date.now()
            }).then(() => {
                alert("Homenagem recebida para moderação!");
                form.reset();
            });
        });
    }
});

// LOGIN / LOGOUT ADM
function toggleFormLogin() { document.getElementById('box-login-adm').classList.toggle('hidden'); }

function realizarLoginAdm() {
    const user = document.getElementById('adm-user').value;
    const pass = document.getElementById('adm-pass').value;

    if (user === "adm123" && pass === "adm123") {
        isAdminLogado = true;
        localStorage.setItem('sessao_adm_ativa', 'true');
        document.getElementById('btn-adm-gatilho').classList.add('hidden');
        document.getElementById('box-login-adm').classList.add('hidden');
        document.getElementById('btn-adm-sair').classList.remove('hidden');
        document.getElementById('painel-moderacao').classList.remove('hidden');
        
        alternarModoVisualCMS(true);
    } else { alert("Usuário ou senha incorretos."); }
}

function realizarLogoutAdm() {
    isAdminLogado = false;
    localStorage.removeItem('sessao_adm_ativa');
    document.getElementById('btn-adm-gatilho').classList.remove('hidden');
    document.getElementById('btn-adm-sair').classList.add('hidden');
    document.getElementById('painel-moderacao').classList.add('hidden');
    
    alternarModoVisualCMS(false);
}

function checarStatusAdmPersistente() {
    if (localStorage.getItem('sessao_adm_ativa') === 'true') {
        isAdminLogado = true;
        document.getElementById('btn-adm-gatilho').classList.add('hidden');
        document.getElementById('btn-adm-sair').classList.remove('hidden');
        document.getElementById('painel-moderacao').classList.remove('hidden');
        alternarModoVisualCMS(true);
    }
}