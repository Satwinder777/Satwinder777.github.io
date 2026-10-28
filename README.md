# Satwinder777.github.io

Static GitHub Pages portfolio. The homepage loads precompiled Tailwind utilities from `tailwind.generated.css`; this avoids compiling utility styles in each visitor's browser.

## Update homepage utility styles

When changing Tailwind classes in `index.html` or the homepage scripts, run:

```sh
npm install
npm run build:css
```

Commit the generated `tailwind.generated.css` with the source change. The site itself remains a static GitHub Pages deployment.

## Firestore indexes

`firestore.indexes.json` contains the feedback-board composite index and the existing feedback index. Deploy index changes with `firebase deploy --only firestore:indexes --project satwinder-portfolio` using an authenticated Firebase CLI session.
