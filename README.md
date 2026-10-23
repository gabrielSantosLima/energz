<div align="center">

<img src="assets/images/logo.png" alt="energz" width="200" />

# energz

A mobile app for managing solar energy production versus household energy consumption.

[![Release](https://img.shields.io/github/v/release/gabrielSantosLima/energz?label=release)](https://github.com/gabrielSantosLima/energz/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) | [Português (Brasil)](README.pt-BR.md) | [Español](README.es.md)

</div>

## Key features

- **Production vs. consumption tracking** — log meter readings and follow your solar balance over time.
- **Automatic billing cycles** — cycles are built from your readings, and you can close the current one in one tap from a bill.
- **Dashboard** — current cycle metrics, trends, and an interactive consumption vs. production chart.
- **Bill scanning** — capture a bill with on-device OpenCV preprocessing and ML Kit OCR, or use the Google Document Scanner.
- **AI bill parsing** — extract total, En Ativa, En Injetado, charges, and more with a configurable DeepInfra model, then review and edit before saving.
- **Bills & Measurements workspace** — list, edit, and delete bills or readings individually or in bulk, newest first.
- **Bill history & forecast** — compare past bills with their cycle final readings and forecast the current bill from the last two bills.
- **Reports** — export cycle reports as PDF or image.
- **Measurement reminders** — daily local notifications so you never miss a reading.
- **Local-first & private** — data lives in SQLite on the device; the AI API key stays in SecureStore, and scanned images/OCR text are not persisted.
- **Personalization** — English and Portuguese UI with light, dark, or system theme.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
