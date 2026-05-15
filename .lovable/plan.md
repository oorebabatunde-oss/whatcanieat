# Add Umami Analytics Tracking

## Summary
Add the Umami analytics tracking script to the project to enable privacy-friendly analytics without requiring a Google account.

## Change
Insert the Umami script tag into `index.html`.

```html
<script defer src="https://cloud.umami.is/script.js" data-website-id="b695d41f-6d17-4e7e-ac5a-015b378efb44"></script>
```

- Placed in the `<head>` alongside other meta tags and scripts.
- Uses `defer` so it does not block page rendering.
- No other files need to change.

## After implementation
The site will begin sending pageview events to Umami at `https://cloud.umami.is`.
