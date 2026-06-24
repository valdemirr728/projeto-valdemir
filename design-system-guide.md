# 📋 Guia de Implementação - Sistema de Design Unificado

## 1. PRIMEIRAMENTE - Atualizar o HTML (server.js)

Adicione esta linha NO INÍCIO do `<head>` antes de qualquer outro CSS:

```html
<link rel="stylesheet" href="/css/design-system.css">
<link rel="stylesheet" href="/css/admin.css">
```

---

## 2. PADRÃO DE COMPONENTES

### ✅ BOTÕES
```html
<!-- ANTES (inconsistente) -->
<button style="padding: 8px 16px; font-size: 12px;">Salvar</button>

<!-- DEPOIS (padronizado) -->
<button class="btn btn-primary">Salvar</button>
<button class="btn btn-secondary">Cancelar</button>
<button class="btn btn-sm">Ação Rápida</button>
```

### ✅ INPUTS
```html
<!-- Todos já escalados automaticamente -->
<input type="text" placeholder="Digite algo">
<select>
  <option>Opção 1</option>
</select>
<textarea></textarea>
```

### ✅ CARDS
```html
<!-- ANTES -->
<div style="padding: 22px; background: white; border: 1px solid #dce8f5;">
  <h3 style="font-size: 24px;">Título</h3>
</div>

<!-- DEPOIS -->
<div class="card">
  <h3>Título</h3>
  <p>Conteúdo</p>
</div>
```

### ✅ GRIDS
```html
<!-- ANTES (fixa em desktop, quebra em mobile) -->
<div style="display: grid; grid-template-columns: repeat(4, 1fr);">

<!-- DEPOIS (responsivo automaticamente) -->
<div class="grid grid-4">
  <!-- 4 colunas em desktop, 2 em tablet, 1 em mobile -->
</div>
```

### ✅ ESPAÇAMENTOS
```html
<!-- ANTES -->
<div style="margin-bottom: 22px; padding: 16px;">

<!-- DEPOIS -->
<div class="mb-4 p-4">
```

---

## 3. VARIÁVEIS CSS DISPONÍVEIS

```css
/* Tipografia */
--fs-xs, --fs-sm, --fs-base, --fs-lg, --fs-xl, --fs-2xl, --fs-3xl, --fs-4xl

/* Espaçamento */
--sp-1, --sp-2, --sp-3, --sp-4, --sp-5, --sp-6, --sp-8

/* Componentes */
--h-input (44px → 40px em mobile)
--h-button (48px → 44px em mobile)
--gap-grid (16px → 12px em mobile)

/* Cores */
--clr-bg-primary, --clr-card, --clr-border, --clr-text-primary
```

---

## 4. CHECKLIST DE AJUSTES NECESSÁRIOS

- [ ] Importar `design-system.css` no HTML
- [ ] Substituir buttons inline por classes
- [ ] Substituir cards/panels por `.card`
- [ ] Usar `.grid grid-N` em layouts
- [ ] Remover `style="margin: 22px"` → usar classes `.mb-4`
- [ ] Remover `style="font-size: 42px"` → usar `--fs-4xl`
- [ ] Padronizar todos os modais
- [ ] Padronizar todos os drawers
- [ ] Testar em: 320px (mobile), 480px, 768px, 1024px+

---

## 5. BREAKPOINTS UNIFICADOS

```
Mobile Pequeno: ≤479px
Tablet:        480-767px
Tablet Grande: 768-1023px
Desktop:       1024px+
```

Tudo escala automaticamente! Sem mais @media queries no código antigo.

---

## 6. EXEMPLO REAL - Dashboard

```html
<!-- ANTES (10 breakpoints diferentes) -->
<div id="pageDashboard">
  <div class="v8Grid" style="grid-template-columns: repeat(4,1fr); gap: 18px;">
    <div class="v8Kpi" style="padding: 22px; font-size: 42px;">123</div>
  </div>
</div>

<!-- DEPOIS (escalável automaticamente) -->
<div id="pageDashboard">
  <div class="grid grid-4" style="--gap-grid: var(--gap-grid);">
    <div class="card">
      <h2>123</h2>
      <p>Métrica</p>
    </div>
  </div>
</div>
```

---

## 7. PRÓXIMAS TAREFAS

1. **Fase 1**: Atualizar `admin.js` para usar classes em vez de inline styles
2. **Fase 2**: Converter `admin.css` para usar variáveis
3. **Fase 3**: Testar em 5 resoluções diferentes
4. **Fase 4**: Ajustar modais e drawers
5. **Fase 5**: Deploy!

