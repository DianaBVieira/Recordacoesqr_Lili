# 🕊️ Memorial Virtual Interativo

Este é um sistema web responsivo e dinâmico desenvolvido para atuar como um memorial digital interativo e de gerenciamento de conteúdo (CMS). O projeto foi concebido para preservar memórias, árvore genealógica e cronologias históricas, oferecendo uma experiência interativa em tempo real para familiares e visitantes através da integração com serviços em nuvem.

---

## 🚀 Demonstração (Link de Acesso)
O deploy do projeto foi realizado utilizando o GitHub Pages. O site pode ser acessado publicamente através do link abaixo:
👉 **[CLIQUE AQUI PARA ACESSAR O MEMORIAL EM PRODUÇÃO](https://seu-usuario.github.io/nome-do-repositorio/)**  
*(Substitua este link fictício pela URL real fornecida na aba Settings -> Pages do seu repositório)*

---

## 🛠️ Tecnologias Utilizadas

O desenvolvimento priorizou performance e portabilidade, utilizando arquitetura baseada em JavaScript Vanilla e integração Serverless:

- **Frontend Core:** HTML5 estrutural, CSS3 responsivo para estilização avançada e animações de interface.
- **Linguagem de Programação:** JavaScript (ECMAScript 2022) em arquitetura assíncrona orientada a eventos.
- **Backend-as-a-Service (BaaS):** Firebase SDK v12.15.0 (módulos `firebase-app` e `firebase-database`).
- **Banco de Dados:** Firebase Realtime Database (armazenamento NoSQL em tempo real estruturado em formato JSON).
- **Hospedagem e Infraestrutura:** GitHub Pages (Integração contínua e entrega de arquivos estáticos).

---

## 🌟 Funcionalidades e Arquitetura do Sistema

### 1. Motor do Altar Virtual (Velas em Tempo Real)
- **Persistência Global:** Migração completa da arquitetura legada baseada em `localStorage` para persistência reativa em nuvem através de listeners contínuos (`dbOnValue`).
- **Distribuição Geométrica Dinâmica:** Algoritmo que calcula de forma analítica e homogênea o posicionamento elíptico das velas ao redor da chama mestre. Utiliza cálculos de trigonometria (distribuição angular baseada em passos de $\pi$), aplicando deslocamentos tridimensionais controlados (`scale` proporcional à distância e `zIndex` baseado em perspectiva de profundidade) para criar uma estética realista.

### 2. Mural de Mensagens e Homenagens com Moderação
- **Pipeline de Envio Segura:** Os visitantes preenchem dados de identificação e parentesco que são inseridos no nó `/banco_mensagens` com a flag `aprovada: false`.
- **Painel Administrativo:** Interface restrita via chave estática (Client-Side Auth) para auditoria e moderação de novos registros de homenagens.
- **Atualização Sem Recarregamento:** O algoritmo intercepta alterações no banco de dados e atualiza o DOM instantaneamente, movendo mensagens aprovadas para o mural público sem causar impactos na navegação do usuário.

### 3. Painel Administrativo de Conteúdo (CMS Integrado)
- **Modo Edição Avançado:** Permite a customização de biografias, cronologias, árvore genealógica por categorias de parentesco e inclusão de vídeos indexados via ID do YouTube.
- **Processamento de Mídia Off-Grid:** Upload de imagens da galeria e fotos de perfil convertidas via API `FileReader` do JavaScript para strings no formato **Base64** de alta densidade, permitindo o armazenamento de recursos visuais diretamente nos nós do banco NoSQL de forma ágil.

---

## 🔒 Regras de Segurança e Infraestrutura (Firebase Rules)

Para garantir a integridade dos dados expostos na internet pública (GitHub Pages), o banco de dados opera sob um ecossistema restrito de privilégios estruturado através do console do Firebase Realtime Database:

```json
{
  "rules": {
    ".read": true,
    "velas": {
      ".write": true
    },
    "banco_mensagens": {
      ".write": true
    },
    "banco_cms_memorial": {
      ".write": "auth != null"
    },
    "banco_cms_fotos": {
      ".write": "auth != null"
    }
  }
}
