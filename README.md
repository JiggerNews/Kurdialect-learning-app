# Kurdialect

A calm, friendly vocabulary companion for exploring words across Sorani, Badini, and Hawrami.

## Try it online

Visit [Kurdialect](https://jiggernews.github.io/Kurdialect-learning-app/).

## What you can do

- Search all three dialects instantly and filter the collection by topic.
- Save favorite words to a personal word book stored in your browser.
- Practice with short flashcard sessions.
- Listen to browser-provided pronunciation when a compatible speech voice is available.
- Copy all translations for a word.
- Install the app and revisit the vocabulary offline.

## Run locally

The app is built with plain HTML, CSS, and JavaScript. Serve the project folder over HTTP so the vocabulary file and service worker can load:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`. You can also host the files on any static web host.

Pronunciation depends on the speech voices available in the visitor's browser and operating system. Saved words and practice counts remain in that browser's local storage.
