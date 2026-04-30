#!/usr/bin/env python3
"""
Patch Mautic webinar artefacts for the 15 May / Google Meet move.

Phases:
  1. Replace stale strings in emails 14-19 (subject, name, HTML, plainText)
  2. Create contact custom field 'webinar_join_url' if missing
  3. Populate webinar_join_url = the Meet URL for every contact tagged
     'webinar-2026-05-11' (segment 7's tag)

Default is DRY-RUN. Pass --apply to actually write.

  ./scripts/webinar/patch-mautic-may15.py            # dry-run, no writes
  ./scripts/webinar/patch-mautic-may15.py --apply    # writes
"""
import os, sys, json, re, base64, argparse
import urllib.request, urllib.error

MAUTIC = os.environ.get('MAUTIC_URL', 'https://mautic.learninfrance.com')
USER   = os.environ.get('MAUTIC_USER', 'admin')
PASS   = os.environ.get('MAUTIC_PASS', 'Sturec@Adm1n2026!')

EMAIL_IDS = [14, 15, 16, 17, 18, 19]
JOIN_URL  = 'https://meet.google.com/uts-izsp-tnw'
TAG       = 'webinar-2026-05-11'  # tag stays as-is per memory; covers all 1,946

# Order matters — most-specific first so "Sunday, 11 May 2026" wins over "11 May".
REPLACEMENTS = [
    ('Sunday, 11 May 2026', 'Friday, 15 May 2026'),
    ('Sunday, 11 May',      'Friday, 15 May'),
    ('Sun, 11 May',         'Fri, 15 May'),
    ('Sun 11 May',          'Fri 15 May'),
    ('this Sunday',         'this Friday'),
    ('11 May 2026',         '15 May 2026'),
    ('11 May',              '15 May'),
    ('May 11, 2026',        'May 15, 2026'),
    ('May 11',              'May 15'),
    ('Microsoft Teams',     'Google Meet'),
    ('Teams link',          'Meet link'),
    ('Teams join link',     'Meet join link'),
    ('Teams (link',         'Meet (link'),
    ('your Teams',          'your Meet'),
    ('on Teams',            'on Google Meet'),
    ('via Teams',           'via Google Meet'),
    ('Webinar 2026-05-11',  'Webinar 2026-05-15'),
    # Broken merge tag → real one, with sane default
    ('{contactfield=webinar_teams_url|https://learninfrance.com/webinar}',
     '{contactfield=webinar_join_url|https://meet.google.com/uts-izsp-tnw}'),
]


def auth():
    return 'Basic ' + base64.b64encode(f'{USER}:{PASS}'.encode()).decode()

def call(method, path, body=None):
    url  = f'{MAUTIC}/api{path}'
    data = json.dumps(body).encode() if body is not None else None
    req  = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': auth(),
        'Content-Type':  'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        sys.exit(f'\nHTTP {e.code} on {method} {path}\n{e.read().decode()[:600]}')

def apply_replacements(text):
    if not text:
        return text, []
    changes = []
    for old, new in REPLACEMENTS:
        c = text.count(old)
        if c:
            text = text.replace(old, new)
            changes.append((old, new, c))
    return text, changes


def phase_emails(apply_):
    print('=' * 72)
    print('PHASE 1: Email content patches')
    print('=' * 72)
    total = 0
    for eid in EMAIL_IDS:
        e = call('GET', f'/emails/{eid}').get('email', {})
        new_subj,  sc = apply_replacements(e.get('subject', ''))
        new_name,  nc = apply_replacements(e.get('name', ''))
        new_html,  hc = apply_replacements(e.get('customHtml', ''))
        new_plain, pc = apply_replacements(e.get('plainText', ''))
        all_ = sc + nc + hc + pc
        if not all_:
            print(f'  email {eid}: no changes')
            continue
        total += 1
        print(f'\n  email {eid}: {e.get("name")}')
        print(f'    subject: "{e.get("subject")}"')
        if new_subj != e.get('subject'):
            print(f'         → "{new_subj}"')
        seen = set()
        for old, new, count in all_:
            key = (old, new)
            if key in seen: continue
            seen.add(key)
            short_old = old if len(old) < 60 else old[:57] + '...'
            short_new = new if len(new) < 60 else new[:57] + '...'
            print(f'    "{short_old}"  →  "{short_new}"   ({count}×)')
        if apply_:
            call('PATCH', f'/emails/{eid}/edit', {
                'subject':    new_subj,
                'name':       new_name,
                'customHtml': new_html,
                'plainText':  new_plain,
            })
            print(f'    ✅ saved')
    print(f'\n  {total} of {len(EMAIL_IDS)} emails need patching\n')


def phase_field(apply_):
    print('=' * 72)
    print("PHASE 2: Contact field 'webinar_join_url'")
    print('=' * 72)
    r = call('GET', '/fields/contact?limit=500')
    fields = r.get('fields', {})
    items = fields.values() if isinstance(fields, dict) else fields
    existing = next((f for f in items if f.get('alias') == 'webinar_join_url'), None)
    if existing:
        print(f'  ✅ field exists (id={existing.get("id")}, type={existing.get("type")})\n')
        return
    print('  field MISSING — needs creation:')
    print('    alias: webinar_join_url')
    print('    label: Webinar Join URL')
    print('    type:  url')
    if apply_:
        r = call('POST', '/fields/contact/new', {
            'label': 'Webinar Join URL',
            'alias': 'webinar_join_url',
            'type':  'url',
            'group': 'core',
        })
        print(f'    ✅ created (id={r.get("field",{}).get("id")})')
    print()


def phase_populate(apply_):
    print('=' * 72)
    print(f'PHASE 3: Populate webinar_join_url for tag={TAG}')
    print('=' * 72)
    print(f'  target value: {JOIN_URL}')
    contacts = []
    start = 0
    limit = 200
    while True:
        # Mautic search uses ?search=tag:foo
        r = call('GET', f'/contacts?search=tag%3A{TAG}&limit={limit}&start={start}')
        batch = r.get('contacts', {})
        rows = list(batch.values()) if isinstance(batch, dict) else batch
        if not rows:
            break
        contacts.extend(rows)
        if len(rows) < limit:
            break
        start += limit
    print(f'  found {len(contacts)} contacts')
    to_update = []
    for c in contacts:
        cur = ((c.get('fields') or {}).get('all') or {}).get('webinar_join_url')
        if cur != JOIN_URL:
            to_update.append(c.get('id'))
    print(f'  {len(to_update)} need update; {len(contacts) - len(to_update)} already set')
    if apply_ and to_update:
        for i in range(0, len(to_update), 100):
            chunk = to_update[i:i+100]
            payload = [{'id': cid, 'webinar_join_url': JOIN_URL} for cid in chunk]
            call('PUT', '/contacts/batch/edit', payload)
            print(f'    ✅ batch {i//100 + 1}: updated {i+len(chunk)}/{len(to_update)}')
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='actually write changes')
    ap.add_argument('--phase', choices=['emails', 'field', 'populate', 'all'],
                    default='all')
    args = ap.parse_args()
    if not args.apply:
        print('\n' + '=' * 72)
        print('DRY-RUN — no writes. Pass --apply to commit.')
        print('=' * 72 + '\n')
    if args.phase in ('emails',   'all'): phase_emails(args.apply)
    if args.phase in ('field',    'all'): phase_field(args.apply)
    if args.phase in ('populate', 'all'): phase_populate(args.apply)
    print('Done.')

if __name__ == '__main__':
    main()
