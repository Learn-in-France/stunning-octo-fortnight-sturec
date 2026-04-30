#!/usr/bin/env bash
# Upload "Meet the panel" email as a Mautic asset.
#
# Outputs the new email asset id on success — record it in
# docs/webinar-2026-05-11-status.md and the Mautic campaign.
#
# Usage:
#   ./scripts/webinar/upload-meet-the-panel-email.sh
#
# Prereqs:
#   - Mautic API enabled with basic auth (re-toggle in UI after every Railway redeploy)
#   - jq installed
set -euo pipefail

MAUTIC_URL="${MAUTIC_URL:-https://mautic.learninfrance.com}"
MAUTIC_USER="${MAUTIC_USER:-admin}"
MAUTIC_PASS="${MAUTIC_PASS:-Sturec@Adm1n2026!}"

HTML_FILE="$(cd "$(dirname "$0")/.." && pwd)/webinar/emails/meet-the-panel.html"
[[ -f "$HTML_FILE" ]] || { echo "ERROR: $HTML_FILE not found"; exit 1; }
command -v jq >/dev/null || { echo "ERROR: jq required"; exit 1; }

# Build JSON payload — Mautic expects customHtml + plainText
PAYLOAD=$(jq -n \
  --arg name "Webinar — Meet the panel (3 days before)" \
  --arg subject "Meet your panel — 3 days to Friday's webinar" \
  --arg fromName "Learn in France" \
  --arg fromAddress "info@learninfrance.com" \
  --arg replyToAddress "info@learninfrance.com" \
  --rawfile customHtml "$HTML_FILE" \
  --arg plainText $'Meet your panel — 3 days to Friday\'s webinar\n\nFriday, 15 May 2026 · 6:00 PM IST · Google Meet\n\nRudy Hallou — International Operations Director, Burgundy School of Business\nhttps://www.linkedin.com/in/rudyhallou/\n\nLilas Arquilliere — International Promotion Officer, Burgundy School of Business\nhttps://www.linkedin.com/in/lilasarquilliere/?locale=en\n\nMoumita Biswas — Regional Representative, South Asia, Burgundy School of Business\nhttps://www.linkedin.com/in/moumita-biswas-930364112/\n\nAnkit Pandey — Senior Industry Professional · India to France, 15+ years\nhttps://www.linkedin.com/in/ankitpandeyfr/\n\nBSB Student Ambassador — Burgundy School of Business (name & profile to follow)\n\nGot a question for the panel? Reply to this email — we\'ll line them up for the live Q&A.\n\nFull event details: https://learninfrance.com/webinar\n\nLearn in France · learninfrance.com' \
  '{
    name:           $name,
    subject:        $subject,
    fromName:       $fromName,
    fromAddress:    $fromAddress,
    replyToAddress: $replyToAddress,
    customHtml:     $customHtml,
    plainText:      $plainText,
    isPublished:    true,
    emailType:      "list",
    language:       "en"
  }')

echo "Uploading 'Meet the panel' email to $MAUTIC_URL/api/emails/new ..."
RESP=$(curl -sS -u "$MAUTIC_USER:$MAUTIC_PASS" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "$PAYLOAD" \
  "$MAUTIC_URL/api/emails/new")

ID=$(echo "$RESP" | jq -r '.email.id // empty')
if [[ -z "$ID" ]]; then
  echo "ERROR: failed to create email asset"
  echo "$RESP" | jq .
  exit 1
fi

echo ""
echo "✅ Created Mautic email asset id $ID"
echo ""
echo "Next steps in Mautic UI (mautic.learninfrance.com):"
echo "  1. Open the existing 'Webinar 2026-05-15 — RSVPers' campaign (Segment 8 trigger)"
echo "  2. Insert a new step BEFORE the 24h reminder (Email 18):"
echo "       - Wait until: 12 May 2026, 09:00 IST"
echo "       - Action: Send email → 'Webinar — Meet the panel (3 days before)' (id $ID)"
echo "  3. Save & publish the campaign"
echo ""
echo "Test send to puneetrinity@gmail.com first:"
echo "  curl -u $MAUTIC_USER:'***' -X POST $MAUTIC_URL/api/emails/$ID/contact/3219/send"
