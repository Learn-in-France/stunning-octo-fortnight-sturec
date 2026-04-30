#!/usr/bin/env python3
"""
Populate webinar_url (tokenized prefill URL) + webinar_join_url (Google Meet)
for every contact tagged 'webinar-2026-05-11' (the 1,946-contact list).

Uses individual PATCH /contacts/{id}/edit per contact. Mautic's batch-edit
endpoint silently drops field updates for newly-created custom fields, so
batch is unsafe here.

Threaded — ~2 min for 1,946 contacts.

Default: DRY-RUN (no writes). Pass --apply to actually write.

  ./scripts/webinar/populate-webinar-tokens.py             # dry-run
  ./scripts/webinar/populate-webinar-tokens.py --apply     # writes
"""
import os, sys, json, base64, argparse, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

MAUTIC = os.environ.get('MAUTIC_URL',  'https://mautic.learninfrance.com')
USER   = os.environ.get('MAUTIC_USER', 'admin')
PWD    = os.environ.get('MAUTIC_PASS', 'Sturec@Adm1n2026!')

TAG          = 'webinar-2026-05-11'
JOIN_URL     = 'https://meet.google.com/uts-izsp-tnw'
WEBINAR_BASE = 'https://learninfrance.com/webinar'
FIELD_LIMIT  = 191
WORKERS      = 12

AUTH = 'Basic ' + base64.b64encode(f'{USER}:{PWD}'.encode()).decode()

def call(method, path, body=None):
    url  = f'{MAUTIC}/api{path}'
    data = json.dumps(body).encode() if body is not None else None
    req  = urllib.request.Request(url, data=data, method=method,
        headers={'Authorization': AUTH, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return ('ok', json.loads(r.read().decode() or '{}'))
    except urllib.error.HTTPError as e:
        return ('err', {'code': e.code, 'body': e.read().decode()[:300]})
    except Exception as e:
        return ('err', {'code': 0, 'body': str(e)[:300]})


def build_token_url(c):
    """Build a tokenized /webinar URL that fits in FIELD_LIMIT chars."""
    f = (c.get('fields') or {}).get('all') or {}
    cid       = c.get('id')
    email     = (f.get('email') or '').strip().lower()
    firstName = (f.get('firstname') or '').strip()
    if not email:
        return None
    payload = {'mauticId': cid, 'email': email}
    if firstName:
        payload['firstName'] = firstName[:40]
    b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
    url = f'{WEBINAR_BASE}?t={b64}.x'
    if len(url) > FIELD_LIMIT:
        # drop firstName as last resort
        payload.pop('firstName', None)
        b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
        url = f'{WEBINAR_BASE}?t={b64}.x'
    return url if len(url) <= FIELD_LIMIT else None


def fetch_all_contact_ids():
    """Search by tag returns contacts with empty fields.all — just take ids."""
    ids = []
    start = 0; limit = 200
    while True:
        s, r = call('GET', f'/contacts?search=tag%3A{TAG}&limit={limit}&start={start}')
        if s != 'ok':
            sys.exit(f'GET contacts failed: {r}')
        rows = list((r.get('contacts') or {}).values()) if isinstance(r.get('contacts'), dict) else r.get('contacts', [])
        if not rows: break
        ids.extend(c.get('id') for c in rows)
        if len(rows) < limit: break
        start += limit
    return ids


def fetch_one(cid):
    """GET /contacts/{id} returns the full contact with fields.all populated."""
    s, r = call('GET', f'/contacts/{cid}')
    if s != 'ok':
        return None
    return r.get('contact')


def patch_one(cid, payload):
    s, r = call('PATCH', f'/contacts/{cid}/edit', payload)
    if s != 'ok':
        return cid, False, r
    f = (r.get('contact', {}).get('fields') or {}).get('all') or {}
    ok = (
        f.get('webinar_url')      == payload.get('webinar_url') and
        f.get('webinar_join_url') == payload.get('webinar_join_url')
    )
    return cid, ok, None if ok else f


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    if not args.apply:
        print('DRY-RUN — no writes. Pass --apply to commit.\n')

    print(f'Fetching contact ids tagged {TAG}...')
    ids = fetch_all_contact_ids()
    print(f'  {len(ids)} contacts\n')

    print(f'Fetching full contact records ({WORKERS} workers)...')
    t0 = time.time()
    contacts = []
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        for c in ex.map(fetch_one, ids):
            if c: contacts.append(c)
    print(f'  fetched {len(contacts)} in {time.time()-t0:.1f}s\n')

    plan = []
    skipped = []
    already = 0
    too_long = 0
    no_email = 0
    for c in contacts:
        f = (c.get('fields') or {}).get('all') or {}
        if not (f.get('email') or '').strip():
            no_email += 1
            skipped.append(c.get('id'))
            continue
        wu = build_token_url(c)
        wj = JOIN_URL
        if not wu:
            too_long += 1
            skipped.append(c.get('id'))
            continue
        cur_wu = f.get('webinar_url')
        cur_wj = f.get('webinar_join_url')
        if cur_wu == wu and cur_wj == wj:
            already += 1
            continue
        plan.append((c.get('id'), {'webinar_url': wu, 'webinar_join_url': wj}))

    print(f'  already correct: {already}')
    print(f'  to update:       {len(plan)}')
    print(f'  skipped — no email:        {no_email}')
    print(f'  skipped — token too long:  {too_long}')
    if skipped[:5]:
        print(f'  sample skipped ids: {skipped[:5]}')

    if not args.apply:
        if plan[:3]:
            print(f'\n  sample plan entries:')
            for cid, p in plan[:3]:
                print(f'    {cid}: webinar_url = {p["webinar_url"][:90]}...')
        print('\nDone (dry-run).')
        return

    print(f'\nApplying {len(plan)} updates with {WORKERS} workers...')
    succ = 0; fail = 0; lock = Lock()
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = [ex.submit(patch_one, cid, payload) for cid, payload in plan]
        for fut in as_completed(futs):
            cid, ok, info = fut.result()
            with lock:
                if ok: succ += 1
                else:  fail += 1
                if (succ + fail) % 200 == 0:
                    print(f'  ... {succ + fail}/{len(plan)} ({succ} ok, {fail} failed)')
                if not ok and fail < 5:
                    print(f'  FAIL contact {cid}: {info}')
    print(f'\n  done in {time.time()-t0:.1f}s — {succ} ok, {fail} failed')
    print('\nIf any failed, re-run --apply (idempotent).')

if __name__ == '__main__':
    main()
