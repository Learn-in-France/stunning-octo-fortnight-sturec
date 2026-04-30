#!/usr/bin/env python3
"""
Populate webinar_url + webinar_join_url for every Mautic contact tagged
webinar-2026-05-11 that has a real email. Direct SQL — Mautic stores
custom fields as columns on the `leads` table.

Default = DRY-RUN. Pass --apply to write.
"""
import os, sys, json, base64, argparse
import pymysql

DB_HOST = os.environ.get('MAUTIC_DB_HOST', 'autorack.proxy.rlwy.net')
DB_PORT = int(os.environ.get('MAUTIC_DB_PORT', '46324'))
DB_USER = os.environ.get('MAUTIC_DB_USER', 'root')
DB_PASS = os.environ.get('MAUTIC_DB_PASS', 'BeOPYUyyOBKkzeTxpSWqmBYVfgzXABhw')
DB_NAME = os.environ.get('MAUTIC_DB_NAME', 'railway')

TAG          = 'webinar-2026-05-11'
JOIN_URL     = 'https://meet.google.com/uts-izsp-tnw'
WEBINAR_BASE = 'https://learninfrance.com/webinar'
COL_LIMIT    = 191


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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    conn = pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS,
                           db=DB_NAME, charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
    cur = conn.cursor()

    # 1. Pull every tagged contact with a real email
    cur.execute("""
        SELECT l.id, l.email, l.firstname, l.webinar_url, l.webinar_join_url
        FROM leads l
        JOIN lead_tags_xref x ON x.lead_id = l.id
        JOIN lead_tags t      ON t.id = x.tag_id
        WHERE t.tag = %s AND l.email IS NOT NULL AND l.email <> ''
    """, (TAG,))
    rows = cur.fetchall()
    print(f'Tagged contacts with email: {len(rows)}')

    plan = []      # (cid, new_url, new_join)
    already = 0
    too_long = 0
    for r in rows:
        wu = build_token_url(r['id'], r['email'], r['firstname'])
        if not wu:
            too_long += 1
            continue
        if r['webinar_url'] == wu and r['webinar_join_url'] == JOIN_URL:
            already += 1
            continue
        plan.append((r['id'], wu, JOIN_URL))

    print(f'  already correct:       {already}')
    print(f'  to update:             {len(plan)}')
    print(f'  skipped (too long):    {too_long}')

    if plan[:3]:
        print('\nSample plan:')
        for cid, wu, wj in plan[:3]:
            print(f'  {cid}: webinar_url = {wu[:90]}...')

    # Empty rows (the 1,397 ghosts)
    cur.execute("""
        SELECT COUNT(*) AS n
        FROM leads l
        JOIN lead_tags_xref x ON x.lead_id = l.id
        JOIN lead_tags t      ON t.id = x.tag_id
        WHERE t.tag = %s AND (l.email IS NULL OR l.email = '')
    """, (TAG,))
    print(f"\nNote: {cur.fetchone()['n']} tagged contacts have no email — skipped (undeliverable)")

    if not args.apply:
        print('\nDry-run. Pass --apply to write.')
        return

    if not plan:
        print('\nNothing to do.')
        return

    print(f'\nWriting {len(plan)} updates...')
    cur.executemany(
        'UPDATE leads SET webinar_url = %s, webinar_join_url = %s, date_modified = NOW() WHERE id = %s',
        [(wu, wj, cid) for cid, wu, wj in plan],
    )
    conn.commit()
    print(f'  ✅ {cur.rowcount} rows affected')

    # Sanity check
    cur.execute("""
        SELECT
          SUM(CASE WHEN l.webinar_url IS NOT NULL AND l.webinar_url <> '' THEN 1 ELSE 0 END) AS with_token,
          SUM(CASE WHEN l.webinar_join_url IS NOT NULL AND l.webinar_join_url <> '' THEN 1 ELSE 0 END) AS with_join
        FROM leads l
        JOIN lead_tags_xref x ON x.lead_id = l.id
        JOIN lead_tags t      ON t.id = x.tag_id
        WHERE t.tag = %s AND l.email IS NOT NULL AND l.email <> ''
    """, (TAG,))
    s = cur.fetchone()
    print(f'\nFinal state: {s["with_token"]}/{len(rows)} have webinar_url, {s["with_join"]}/{len(rows)} have webinar_join_url')


if __name__ == '__main__':
    main()
