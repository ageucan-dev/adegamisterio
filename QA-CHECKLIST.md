# QA Checklist — Copão na Mão

Este arquivo é a trava de qualidade do projeto. Antes de considerar qualquer alteração concluída, os fluxos abaixo precisam continuar funcionando.

## Regra principal

Nenhuma limpeza, consolidação ou refatoração deve ser considerada finalizada se quebrar clique, rolagem, seleção, carrinho, login ou finalização.

## Teste obrigatório depois de cada alteração

### 1. Hero e navegação

- [ ] Abrir o site no topo.
- [ ] Clicar em **Montar meu copo**.
- [ ] A página deve descer para **Produtos**.
- [ ] O card ativo deve aparecer com o botão **Montar copo** visível.
- [ ] Clicar em **Ver carrinho**.
- [ ] A página deve descer para o carrinho.

### 2. Card de produto

- [ ] O carrossel deve mostrar Ethernity Mix.
- [ ] O botão **Montar copo** do Ethernity Mix deve abrir a personalização.
- [ ] O botão **Montar copo** do Gold Mix deve abrir a personalização.
- [ ] Os dots do carrossel devem trocar o produto corretamente.

### 3. Personalização — Ethernity Mix

- [ ] Ao abrir, nenhuma opção deve aparecer marcada automaticamente.
- [ ] Nenhum resumo laranja deve aparecer antes da seleção manual.
- [ ] Ao selecionar tamanho, deve aparecer o resumo apenas do tamanho.
- [ ] Ao selecionar base, deve aparecer o resumo apenas da base.
- [ ] Ao selecionar intensidade, deve aparecer o resumo apenas da intensidade.
- [ ] Ao selecionar energético, deve aparecer o resumo apenas do energético.
- [ ] Ao selecionar gelo, deve aparecer o resumo apenas do gelo.
- [ ] Os blocos podem recolher, mas devem reabrir ao clicar no título.

### 4. Personalização — Gold Mix

- [ ] Ao abrir Gold Mix, a base única pode aparecer como Gold Mix.
- [ ] Tamanho, intensidade, energético e gelo não devem aparecer como selecionados antes do toque do cliente.
- [ ] Trocar de produto não deve manter escolhas antigas presas.

### 5. Carrinho

- [ ] Adicionar ao carrinho deve funcionar.
- [ ] Botão `+` deve aumentar quantidade.
- [ ] Botão `-` deve diminuir quantidade sem ir abaixo de 1.
- [ ] Remover item deve funcionar.
- [ ] Limpar carrinho deve funcionar.
- [ ] Desconto progressivo deve aparecer quando houver mais de 1 copo.

### 6. Barra inferior

- [ ] Ícone do carrinho deve levar para o carrinho.
- [ ] Botão **Finalizar** deve levar para finalização ou dados de entrega quando necessário.
- [ ] O total da barra inferior deve atualizar junto com o carrinho.

### 7. Cadastro/login

- [ ] Modal de acesso deve abrir em aba anônima.
- [ ] Botão Google deve abrir popup.
- [ ] Usuário aprovado deve liberar o site.
- [ ] Usuário novo deve ver cadastro.
- [ ] Campos do cadastro não devem travar a tela no mobile.

### 8. Mobile/iPhone

- [ ] Não deve haver zoom preso depois de preencher campos.
- [ ] Não deve haver rolagem horizontal.
- [ ] A barra inferior não deve cobrir botões importantes.
- [ ] A hero não deve voltar com mancha rosa/roxa.

## Arquivos sensíveis

Alterações nesses arquivos exigem teste completo:

- `index.html`
- `app.js`
- `product-builder-state.js`
- `selection-summary.js`
- `post-auth-ux-loader.js`
- `product-card.css`
- `option-card-spacing.css`
- `customer-access-gate.js`
- `mobile-viewport-fix.css`
- `mobile-viewport-fix.js`

## Fluxo de trabalho daqui para frente

1. Fazer uma alteração pequena.
2. Atualizar cache `?v=` quando alterar CSS/JS carregado no HTML.
3. Testar os fluxos críticos acima.
4. Só depois seguir para a próxima alteração.

## Status atual

Última correção aplicada antes deste checklist:

- Resumo laranja não deve aparecer antes da seleção manual.
- Botão **Montar meu copo** deve descer até Produtos com o botão **Montar copo** visível.
- Versões atuais relevantes:
  - `selection-summary.js?v=6`
  - `post-auth-ux-loader.js?v=11`
