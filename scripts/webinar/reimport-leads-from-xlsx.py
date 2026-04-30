#!/usr/bin/env python3
"""
Re-import the BSB master leads from
LIF_15_Day_Lead_Action_Plan.xlsx → sheet 'Master Leads' (2,140 rows)
into Mautic, fixing the 1,397 ghost rows that came from the broken first
import.

For each row:
  - Look up existing Mautic contact by email
  - UPDATE (if found) or INSERT (if not) — fills all profile fields
  - Sets webinar_url (tokenized RSVP URL) + webinar_join_url (Google Meet)
  - Ensures tags: webinar-2026-05-11, bsb-eu-pavilion-2026, masters-target,
    and a tier tag matching Priority (HOT/HIGH/MEDIUM/LOW)

DOES NOT delete the 1,397 existing ghost rows. Run a separate script for
that once you've verified the upsert.

Default = DRY-RUN. Pass --apply to write.
"""
import os, sys, json, base64, argparse
import pymysql, openpyxl

DB = dict(host='autorack.proxy.rlwy.net', port=46324, user='root',
          password='BeOPYUyyOBKkzeTxpSWqmBYVfgzXABhw',
          db='railway', charset='utf8mb4',
          cursorclass=pymysql.cursors.DictCursor)
XLSX = '/home/ews/sturec/LIF_15_Day_Lead_Action_Plan.xlsx'
SHEET = 'Master Leads'

WEBINAR_BASE = 'https://learninfrance.com/webinar'
JOIN_URL     = 'https://meet.google.com/uts-izsp-tnw'
COL_LIMIT    = 191

TAG_IDS = {
    'webinar': 3,         # webinar-2026-05-11
    'bsb':     6,         # bsb-eu-pavilion-2026
    'masters': 4,         # masters-target
    'HOT':     7,
    'HIGH':    8,
    'MEDIUM':  5,
    'LOW':     9,
}


def build_token_url(cid, email, firstname):
    payload = {'mauticId': cid, 'email': email}
    if firstname:
        payload['firstName'] = firstname[:40]
    b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
    url = f'{WEBINAR_BASE}?t={b64}.x'
    if len(url) > COL_LIMIT:
        payload.pop('firstName', None)
        b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b'=').decode()
        url = f'{WEBINAR_BASE}?t={b64}.x'
    return url if len(url) <= COL_LIMIT else None


def load_xlsx():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb[SHEET]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(c).strip() if c else '' for c in rows[0]]

    def col(name):
        for i, h in enumerate(header):
            if h.lower() == name.lower(): return i
        return None
    ix = {n: col(n) for n in ('Email','First name','Last name','Phone','City','Programme','Priority','Type','Notes')}

    leads = []
    for r in rows[1:]:
        if not any(r): continue
        email = (r[ix['Email']] or '').strip().lower() if ix['Email'] is not None else ''
        if not email or '@' not in email:
            continue
        leads.append({
            'email':     email,
            'firstname': (r[ix['First name']] or '').strip() if ix['First name'] is not None else '',
            'lastname':  (r[ix['Last name']]  or '').strip() if ix['Last name']  is not None else '',
            'phone':     str(r[ix['Phone']] or '').strip() if ix['Phone'] is not None else '',
            'city':      (r[ix['City']]     or '').strip() if ix['City']     is not None else '',
            'priority':  (r[ix['Priority']] or '').strip().upper() if ix['Priority'] is not None else '',
        })
    return leads


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    leads = load_xlsx()
    print(f'XLSX leads with email: {len(leads)}')

    conn = pymysql.connect(**DB)
    cur = conn.cursor()

    # Map email → existing Mautic id
    cur.execute("SELECT id, email, firstname, lastname, phone, city FROM leads WHERE email IS NOT NULL AND email<>''")
    by_email = {r['email'].lower(): r for r in cur.fetchall() if r.get('email')}
    print(f'Mautic contacts with email: {len(by_email)}')

    updates = []   # (id, email, firstname, lastname, phone, city, webinar_url, priority)
    inserts = []   # (email, firstname, lastname, phone, city, priority)

    for lead in leads:
        em = lead['email']
        existing = by_email.get(em)
        if existing:
            updates.append((existing['id'], lead))
        else:
            inserts.append(lead)

    print(f'\n  to UPDATE (existing email match): {len(updates)}')
    print(f'  to INSERT (new contacts):         {len(inserts)}')
    print(f'  Mautic ghost rows (no email):     1,397 (untouched by this script)')

    if not args.apply:
        if updates[:2]:
            print('\nSample UPDATE:')
            for cid, lead in updates[:2]:
                tok = build_token_url(cid, lead['email'], lead['firstname'])
                print(f'  id={cid}  email={lead["email"]}  fn={lead["firstname"]}  ln={lead["lastname"]}  tok={tok[:80]}...')
        if inserts[:2]:
            print('\nSample INSERT:')
            for lead in inserts[:2]:
                print(f'  email={lead["email"]}  fn={lead["firstname"]}  ln={lead["lastname"]}  city={lead["city"]}  pri={lead["priority"]}')
        print('\nDry-run. Pass --apply to write.')
        return

    # ---- APPLY ----
    print('\nApplying...')

    # 1) UPDATEs in batches
    for cid, lead in updates:
        tok = build_token_url(cid, lead['email'], lead['firstname']) or ''
        cur.execute("""
            UPDATE leads SET
              firstname=%s, lastname=%s, phone=%s, city=%s,
              webinar_url=%s, webinar_join_url=%s,
              date_modified=NOW()
            WHERE id=%s
        """, (lead['firstname'], lead['lastname'], lead['phone'], lead['city'],
              tok, JOIN_URL, cid))
    print(f'  ✅ updated {len(updates)} existing contacts')

    # 2) INSERT new contacts
    new_ids = []
    for lead in inserts:
        cur.execute("""
            INSERT INTO leads
              (date_added, date_modified, date_identified,
               firstname, lastname, email, phone, city,
               is_published, points, webinar_join_url)
            VALUES (NOW(), NOW(), NOW(), %s, %s, %s, %s, %s, 1, 0, %s)
        """, (lead['firstname'], lead['lastname'], lead['email'],
              lead['phone'], lead['city'], JOIN_URL))
        new_id = cur.lastrowid
        new_ids.append((new_id, lead))
        # Set webinar_url now that we have an id
        tok = build_token_url(new_id, lead['email'], lead['firstname']) or ''
        cur.execute("UPDATE leads SET webinar_url=%s WHERE id=%s", (tok, new_id))
    print(f'  ✅ inserted {len(inserts)} new contacts')

    # 3) Ensure tags for ALL leads (existing + new)
    print('  ensuring tags...')
    all_with_lead = [(cid, lead) for cid, lead in updates] + new_ids
    tag_pairs = []
    for cid, lead in all_with_lead:
        tag_pairs.append((cid, TAG_IDS['webinar']))
        tag_pairs.append((cid, TAG_IDS['bsb']))
        tag_pairs.append((cid, TAG_IDS['masters']))
        if lead['priority'] in TAG_IDS:
            tag_pairs.append((cid, TAG_IDS[lead['priority']]))
    cur.executemany(
        "INSERT IGNORE INTO lead_tags_xref (lead_id, tag_id) VALUES (%s, %s)",
        tag_pairs,
    )
    print(f'  ✅ tag bindings ensured ({len(tag_pairs)} pairs, dupes ignored)')

    conn.commit()
    print('\nCommitted.')

    # 4) Final tally
    cur.execute("""
        SELECT COUNT(*) AS n FROM leads l
        JOIN lead_tags_xref x ON x.lead_id=l.id JOIN lead_tags t ON t.id=x.tag_id
        WHERE t.tag='webinar-2026-05-11' AND l.email IS NOT NULL AND l.email<>''
    """)
    print(f'Tagged + has email: {cur.fetchone()["n"]}')


if __name__ == '__main__':
    main()
