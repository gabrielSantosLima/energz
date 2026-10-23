<div align="center">

<img src="assets/images/logo.png" alt="energz" width="200" />

# energz

Una app móvil para gestionar la producción de energía solar frente al consumo de energía del hogar.

[![Release](https://img.shields.io/github/v/release/gabrielSantosLima/energz?label=release)](https://github.com/gabrielSantosLima/energz/releases)
[![Licencia: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) | [Português (Brasil)](README.pt-BR.md) | [Español](README.es.md)

</div>

## Funciones principales

- **Seguimiento de producción y consumo** — registra lecturas del medidor y sigue el balance solar a lo largo del tiempo.
- **Ciclos de facturación automáticos** — los ciclos se construyen a partir de las lecturas y el ciclo actual se puede cerrar con un toque desde una factura.
- **Dashboard** — métricas del ciclo actual, tendencias y gráfico interactivo de consumo vs. producción.
- **Escaneo de facturas** — captura una factura con preprocesamiento OpenCV en el dispositivo y OCR de ML Kit, o usa Google Document Scanner.
- **Análisis de facturas con IA** — extrae total, En Ativa, En Injetado, cargos y más con un modelo DeepInfra configurable, revisando y editando antes de guardar.
- **Espacio Facturas y Mediciones** — lista, edita y elimina facturas o mediciones individualmente o en lote, de la más reciente a la más antigua.
- **Historial y previsión de facturas** — compara facturas pasadas con la medición final del ciclo y prevé la factura actual a partir de las dos últimas.
- **Informes** — exporta informes de ciclos en PDF o imagen.
- **Recordatorios de medición** — notificaciones locales diarias para no olvidar una lectura.
- **Local-first y privado** — los datos viven en SQLite en el dispositivo; la clave de API de la IA se guarda en SecureStore y las imágenes/texto OCR no se persisten.
- **Personalización** — interfaz en inglés y portugués, con tema claro, oscuro o del sistema.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
