<div align="center">

<img src="assets/images/logo.png" alt="energz" width="200" />

# energz

Um app mobile para gerenciar a produção de energia solar frente ao consumo de energia doméstico.

[![Release](https://img.shields.io/github/v/release/gabrielSantosLima/energz?label=release)](https://github.com/gabrielSantosLima/energz/releases)
[![Licença: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) | [Português (Brasil)](README.pt-BR.md) | [Español](README.es.md)

</div>

## Principais recursos

- **Acompanhamento de produção e consumo** — registre leituras do medidor e acompanhe o saldo solar ao longo do tempo.
- **Ciclos de faturamento automáticos** — os ciclos são montados a partir das leituras e o ciclo atual pode ser encerrado com um toque a partir de uma conta.
- **Dashboard** — métricas do ciclo atual, tendências e gráfico interativo de consumo vs. produção.
- **Escaneamento de contas** — capture uma conta com pré-processamento OpenCV no dispositivo e OCR do ML Kit, ou use o Google Document Scanner.
- **Parsing de contas com IA** — extraia total, En Ativa, En Injetado, itens e mais com um modelo DeepInfra configurável, revisando e editando antes de salvar.
- **Área Contas e Medições** — liste, edite e exclua contas ou medições individualmente ou em lote, das mais recentes para as mais antigas.
- **Histórico e previsão de contas** — compare contas passadas com a medição final do ciclo e preveja a conta atual a partir das duas últimas contas.
- **Relatórios** — exporte relatórios de ciclos em PDF ou imagem.
- **Lembretes de medição** — notificações locais diárias para não esquecer uma leitura.
- **Local-first e privado** — os dados ficam no SQLite do dispositivo; a chave de API da IA fica no SecureStore e imagens/texto do OCR não são persistidos.
- **Personalização** — interface em inglês e português, com tema claro, escuro ou do sistema.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.
