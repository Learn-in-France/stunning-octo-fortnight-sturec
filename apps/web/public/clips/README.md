# Podcast video assets

This folder serves the 8 podcast audiograms used by `/podcast/*`.

**These MP4s are gitignored** (157 MB total — too large for git history).

## How to populate this folder

### Local development

```bash
cp /path/to/audiograms/*AUDIOGRAM.mp4 apps/web/public/clips/
```

### Railway production

The clips are not in git, so the Railway build won't include them. Options:

1. **Railway volume** (recommended): mount a persistent volume at `/app/apps/web/public/clips`,
   upload the MP4s once via Railway CLI:
   ```bash
   railway run --service web -- bash -c "mkdir -p public/clips && curl -o public/clips/01.mp4 https://your-source/01.mp4"
   ```
2. **Object storage** (Cloudflare R2 / GCS): upload the MP4s once, then change
   `CLIP_BASE` in `apps/web/src/app/(public)/podcast/episodes.ts` to the public bucket URL.
   This is the right long-term move — CDN-fronted, fast in India.

## Source

These audiograms are produced from the BSB × Learn in France webinar recording
(15 May 2026) by `/tmp/full_webinar_v4_no_slides.py` and `/tmp/batch_audiograms_v2.py`
in this repo's working scripts.
