# Kurdialect

A calm, friendly vocabulary companion for exploring words across Sorani, Badini, and Hawrami.

## Try it online

Visit [Kurdialect](https://jiggernews.github.io/Kurdialect-learning-app/).

## What you can do

- Search all three dialects instantly and filter the collection by topic.
- Save favorite words to a personal word book stored in your browser.
- Practice by typing translations or choosing from multiple-choice answers; each question can start in any of the three dialects.
- Listen with your device's speech voices. Google Translate's direct speech endpoint does not currently return audio for Kurdish (`ckb`/`ku`), so the app uses the closest installed voice when a Kurdish voice is unavailable.
- Copy all translations for a word.
- Install the app and revisit the vocabulary offline.

## Run locally

The app is built with plain HTML, CSS, and JavaScript. Serve the project folder over HTTP so the vocabulary file and service worker can load:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`. You can also host the files on any static web host.

Pronunciation depends on the speech voices available in the visitor's browser and operating system. Saved words and practice counts remain in that browser's local storage.
