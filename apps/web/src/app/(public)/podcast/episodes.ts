/**
 * From India to France — the podcast.
 * Eight episodes from the BSB × Learn in France live session (15 May 2026).
 *
 * EP 1 is free (ungated hook).
 * EP 2-8 require an email — captured via Mautic form.
 */

export interface Episode {
  /** Slug used in URL: /podcast/<slug> */
  slug: string
  /** Display number (1-8). */
  number: number
  /** Episode title. */
  title: string
  /** Speaker name (or co-hosts joined with " · "). */
  speaker: string
  /** Speaker role / one-line credential. */
  speakerRole: string
  /** Duration in mm:ss form. */
  length: string
  /** Duration in seconds (used for player progress thresholds). */
  durationSec: number
  /** 30-word teaser shown on listing card. */
  teaser: string
  /** Longer 1-2 paragraph description on the episode page. */
  description: string
  /** Path to MP4, served from /clips/* on the same origin. */
  videoUrl: string
  /** Whether the episode is free (no email gate). */
  free: boolean
  /** Speaker photo (relative to /images/webinar-panelists/). */
  speakerPhoto: string
}

const CLIP_BASE = '/clips'

export const EPISODES: Episode[] = [
  {
    slug: 'why-france-beats-obvious-choices',
    number: 1,
    title: 'Why France quietly beats the obvious choices for an Indian Master’s',
    speaker: 'Ankit Pandey',
    speakerRole: 'India → France · 15 years · Senior Industry Professional',
    length: '3:20',
    durationSec: 200,
    teaser:
      'After 15 years living and working in France, Ankit explains the math that actually decides ROI for Indian families — and why most shortlists miss it.',
    description:
      'Ankit Pandey moved from India to France 15 years ago and has worked in the French market ever since. He explains the two numbers most Indian families never weigh when choosing a Master’s abroad — post-study work-visa odds and cost of living — and why those two together change the ROI conclusion entirely.\n\nIf France isn’t yet on your shortlist, this is the 3 minutes that will put it there.',
    videoUrl: `${CLIP_BASE}/01_why_france_roi_ankit_AUDIOGRAM.mp4`,
    free: true,
    speakerPhoto: 'ankit-pandey.webp',
  },
  {
    slug: 'do-you-need-french',
    number: 2,
    title: 'Do you actually need French to work in France?',
    speaker: 'Ankit Pandey',
    speakerRole: 'India → France · 15 years · Senior Industry Professional',
    length: '2:30',
    durationSec: 150,
    teaser:
      'The question every Indian student asks. Honest answer from someone who got the job without speaking French for years — and when learning it does start to matter.',
    description:
      'The fear of the language barrier is the single most common reason Indian students rule France out. Ankit — who didn’t speak French when he arrived — explains how the international Master’s tracks at French business schools are taught and recruited in English, and when you actually do need to start learning French to get the most out of your decade there.',
    videoUrl: `${CLIP_BASE}/02_no_french_needed_ankit_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'ankit-pandey.webp',
  },
  {
    slug: 'french-job-market-open',
    number: 3,
    title: 'Why the French job market is open while UK / US / Canada close',
    speaker: 'Rudy Hallou',
    speakerRole: 'International Operations Director · Burgundy School of Business',
    length: '3:00',
    durationSec: 180,
    teaser:
      'While the UK, US and Canada pull up the drawbridge, France is actively recruiting Indian talent. The sectors that are hiring, and why.',
    description:
      'Rudy Hallou is the International Operations Director at Burgundy School of Business and watches the European labour market closely. He explains why the French government has explicitly opened the door for more Indian students — sectors with a structural shortage of skilled workers — while comparable destinations are tightening visa caps and turning candidates away.',
    videoUrl: `${CLIP_BASE}/05_french_market_open_rudi_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'rudy.webp',
  },
  {
    slug: 'post-study-work-visa',
    number: 4,
    title: 'The 2-year post-study work visa most Indians don’t know about',
    speaker: 'Rudy Hallou',
    speakerRole: 'International Operations Director · Burgundy School of Business',
    length: '4:20',
    durationSec: 260,
    teaser:
      'Internship → full-time contract → long-term status — the visa pathway most Indian families never get explained, and why French companies prefer it.',
    description:
      'Most Indian students think a Master’s abroad ends at graduation. In France it doesn’t. Rudy walks through the actual post-study work-visa pathway used by recent BSB graduates: how the mandatory internship feeds the full-time contract, how the 2-year visa bridges your first job, and why French employers prefer hiring graduates already on this visa over sponsoring new ones from outside.',
    videoUrl: `${CLIP_BASE}/06_visa_schengen_rudi_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'rudy.webp',
  },
  {
    slug: 'start-company-france',
    number: 5,
    title: 'Starting a company in France for €70 (and 5 minutes online)',
    speaker: 'Rudy Hallou',
    speakerRole: 'International Operations Director · Burgundy School of Business',
    length: '2:15',
    durationSec: 135,
    teaser:
      'Five minutes online, €70, you’re a founder. France’s entrepreneur-friendly setup explained — plus the on-campus incubator that funds student businesses.',
    description:
      'A lesser-told story about France: it is one of the easiest places in the developed world to register a company. Rudy explains the mechanics — €70 and five minutes to incorporate — and walks through the BSB on-campus incubator that funds student entrepreneurship projects at year-end. If you have a business idea you want to test alongside the degree, this is the relevant episode.',
    videoUrl: `${CLIP_BASE}/07_company_5min_70eur_rudi_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'rudy.webp',
  },
  {
    slug: 'employability-94-percent',
    number: 6,
    title: 'The 94 % employability number — and what BSB grads earn',
    speaker: 'Moumita Biswas',
    speakerRole: 'Regional Representative — South Asia · Burgundy School of Business',
    length: '0:40',
    durationSec: 40,
    teaser:
      'Forty seconds. The employability data from BSB, and what graduates earn one year after the degree. No spin, just the numbers.',
    description:
      'The shortest episode in the series. Moumita Biswas — BSB’s Regional Representative for South Asia — reads off the placement and salary data: 94 % graduate employability, 90 % placed within 4-6 months, and the salary ranges for both the 2-year and 3-year degree programmes. If you want the numbers on a slide, this is it.',
    videoUrl: `${CLIP_BASE}/09_employability_94pct_mamita_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'moumita.webp',
  },
  {
    slug: 'scholarship-breakdown',
    number: 7,
    title: 'How the scholarship money actually works',
    speaker: 'Rudy Hallou · Moumita Biswas',
    speakerRole: 'Burgundy School of Business',
    length: '2:00',
    durationSec: 130,
    teaser:
      'The €2,000 – €10,000 scholarship structure for Indian students. Plus the Campus France options — Eiffel and Charpentier — and who qualifies.',
    description:
      'Scholarships are usually the last thing families look at when they should be the first. Rudy and Moumita break down the structure: BSB merit awards (€2,000 – €10,000 depending on programme), the Campus France Eiffel scholarship, the Charpentier scholarship, and BSB’s own early-bird and excellence scholarships. They cover both eligibility and how to actually apply.',
    videoUrl: `${CLIP_BASE}/10_scholarships_money_rudi_mamita_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'moumita.webp',
  },
  {
    slug: 'full-session',
    number: 8,
    title: 'From India to France — the full live session',
    speaker: 'BSB × Learn in France',
    speakerRole: 'The complete one-hour panel · 15 May 2026',
    length: '62:00',
    durationSec: 3722,
    teaser:
      'The complete one-hour panel. BSB’s international team + an Indian industry veteran answer everything — ROI, visa, jobs, scholarships, language, application.',
    description:
      'The full unedited live session from 15 May 2026. The BSB international team (Rudy Hallou, Moumita Biswas) and Indian industry veteran Ankit Pandey, moderated by Puneet Kumar from the Learn in France team. Sixty-two minutes covering everything in episodes 1–7 plus the live audience Q&A, the application process walkthrough, and the BSB campus tour.\n\nThe episode to send to a family member who wants the complete picture.',
    videoUrl: `${CLIP_BASE}/webinar-2026-05-15_full_AUDIOGRAM.mp4`,
    free: false,
    speakerPhoto: 'rudy.webp',
  },
]

export function getEpisode(slug: string): Episode | undefined {
  return EPISODES.find((e) => e.slug === slug)
}

export function getEpisodeIndex(slug: string): number {
  return EPISODES.findIndex((e) => e.slug === slug)
}
