#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <workspace_or_org_id> <event_type> <limit> <after>" >&2
  echo >&2
  echo 'Examples: ' >&2
  echo 'COMPLIANCE_API_KEY=<KEY> ./download_compliance_files.sh "<workspace_id>" AUTH_LOG 100 "<after>" > output.jsonl' >&2
  echo 'COMPLIANCE_API_KEY=<KEY> ./download_compliance_files.sh "<org_id>" AUTH_LOG 100 "<after>" > output.jsonl' >&2
}

if [[ $# -ne 4 ]]; then
  usage
  exit 2
fi

PRINCIPAL_ID="$1"
EVENT_TYPE="$2"
LIMIT="$3"
INITIAL_AFTER="$4"

# Require COMPLIANCE_API_KEY to be present and non-empty before using it
if [[ -z "${COMPLIANCE_API_KEY:-}" ]]; then
  echo "COMPLIANCE_API_KEY environment variable is required. e.g.:" >&2
  echo "COMPLIANCE_API_KEY=<KEY> $0 <workspace_or_org_id> <event_type> <limit> <after>" >&2
  exit 2
fi

API_BASE="https://api.chatgpt.com/v1/compliance"
AUTH_HEADER=("-H" "Authorization: Bearer ${COMPLIANCE_API_KEY}")

# Determine whether the first arg is a workspace ID or an org ID.
# If it starts with "org-" treat it as an organization ID and switch the path segment accordingly.
SCOPE_SEGMENT="workspaces"
if [[ "${PRINCIPAL_ID}" == org-* ]]; then
  SCOPE_SEGMENT="organizations"
fi

# Perform a curl request and fail fast on HTTP errors, logging context to stderr.
# Usage: perform_curl "description of action" <curl args...>
perform_curl() {
  local description="$1"
  shift
  # Capture body and HTTP status code, keeping body on stdout-like var
  # We append a newline before the status to reliably split even if body has no trailing newline.
  local combined
  if ! combined=$(curl -sS -w "\n%{http_code}" "$@"); then
    echo "Network/transport error while ${description}" >&2
    exit 1
  fi
  local http_code
  http_code="${combined##*$'\n'}"
  local body
  body="${combined%$'\n'*}"

  if [[ ! "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
    echo "HTTP error ${http_code} while ${description}:" >&2
    if [[ -n "${body}" ]]; then
      # Print the body to stderr so it doesn't corrupt stdout stream
      if ! echo "${body}" | jq . >&2; then
        printf '%s\n' "${body}" >&2
      fi
    fi
    exit 1
  fi

  # On success, emit body to stdout for callers to consume
  printf '%s' "${body}"
  [[ "${body}" == *$'\n' ]] || printf '\n'
}

list_logs() {
  local after="$1"
  perform_curl "listing logs (after=${after}, event_type=${EVENT_TYPE}, limit=${LIMIT})" \
    -G \
    "${API_BASE}/${SCOPE_SEGMENT}/${PRINCIPAL_ID}/logs" \
    "${AUTH_HEADER[@]}" \
    --data-urlencode "limit=${LIMIT}" \
    --data-urlencode "event_type=${EVENT_TYPE}" \
    --data-urlencode "after=${after}"
}

download_log() {
  local id="$1"
  echo "Fetching logs for ID: ${id}" >&2
  perform_curl "downloading log id=${id}" \
    -G -L \
    "${API_BASE}/${SCOPE_SEGMENT}/${PRINCIPAL_ID}/logs/${id}" \
    "${AUTH_HEADER[@]}"
}

current_after="${INITIAL_AFTER}"
page=1
total_downloaded=0
while true; do
  echo "Fetching page ${page} with after='${current_after}'" >&2
  response_json="$(list_logs "${current_after}")"

  # Count and download each ID from the current page (if any)
  page_count="$(echo "${response_json}" | jq '.data | length')"
  if [[ "${page_count}" -gt 0 ]]; then
    echo "${response_json}" | jq -r '.data[].id' | while read -r id; do
      download_log "${id}"
    done
    total_downloaded=$((total_downloaded + page_count))
  fi

  has_more="$(echo "${response_json}" | jq -r '.has_more')"
  current_after="$(echo "${response_json}" | jq -r '.last_end_time')"
  if [[ "${has_more}" == "true" ]]; then
    page=$((page + 1))
  else
    break
  fi
done

if [[ "${total_downloaded}" -eq 0 && ( -z "${current_after}" || "${current_after}" == "null" ) ]]; then
  echo "No results found for event_type ${EVENT_TYPE} after ${INITIAL_AFTER}" >&2
else
  echo "Completed downloading ${total_downloaded} log files up to ${current_after}" >&2
fi
