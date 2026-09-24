# SK EXAMS COUNTDOWN

Real-time exam countdown website with premium look.

## Features
- Live countdown (Days, Hours, Minutes, Seconds)
- Multiple exams support via `exams.json`
- Dark / Light theme toggle
- Fullscreen mode
- Animated particle background
- Mobile friendly
- Telegram branding

## How to add / edit exams

Open `exams.json` and edit:

```json
[
  {
    "id": "neet-2027",
    "name": "NEET 2027",
    "fullName": "NEET UG 2027 Countdown",
    "date": "2027-05-02T00:00:00+05:30",
    "important": true
  },
  {
    "id": "jee-main-2027",
    "name": "JEE Main 2027",
    "fullName": "JEE Main 2027 Countdown",
    "date": "2027-04-15T00:00:00+05:30",
    "important": false
  }
]
```

- `id` → unique (no spaces)
- `name` → short name shown in list
- `fullName` → big title on countdown page
- `date` → ISO format with timezone (+05:30 for India)

After editing → commit & push to GitHub → Cloudflare Pages auto deploys.

## Deploy on Cloudflare Pages

1. Create a GitHub repository and upload all files
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create project
3. Connect your GitHub repo
4. Build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `/` (or leave empty)
5. Deploy

Your site will be live at `https://your-project.pages.dev`

## Local Testing

Just open `index.html` in browser, or run:

```bash
npx serve .
```
