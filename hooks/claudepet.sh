#!/bin/sh
# Claude Code hook -> state for the Stream Deck crab. Runs on every tool call, so it stays lean.
# Usage: claudepet.sh <HookEvent>, with the hook's JSON on stdin.
#   ~/.claudepet             the mood, one word (see the case below)
#   ~/.claudepet-agents/<id> one file per running subagent
#   ~/.claudepet-transcript  the session transcript's path (for Esc detection and "Baked for 1m 52s")
STATE="$HOME/.claudepet"
AGENTS="$HOME/.claudepet-agents"

# one jq call, one field per line (missing fields come out empty)
{ IFS= read -r agent; IFS= read -r tool; IFS= read -r path; } <<EOF
$(/usr/bin/jq -r '.agent_id, .tool_name, .transcript_path | . // "" | tostring | gsub("\n"; "")' 2>/dev/null)
EOF
case "$agent" in */* | .*) agent= ;; esac # it becomes a filename

case "$1" in
SubagentStart) [ -n "$agent" ] && mkdir -p "$AGENTS" && touch "$AGENTS/$agent"; exit 0 ;;
SubagentStop) [ -n "$agent" ] && rm -f "$AGENTS/$agent"; exit 0 ;;
esac

# Inside a subagent: only note it's alive. The main crab keeps showing the main conversation.
if [ -n "$agent" ]; then
	[ -f "$AGENTS/$agent" ] && touch "$AGENTS/$agent"
	exit 0
fi

case "$1" in
SessionStart) s=listening ;;
UserPromptSubmit | Stop)
	[ "$1" = Stop ] && s=done || s=thinking
	[ -n "$path" ] && printf '%s\n' "$path" >"$HOME/.claudepet-transcript"
	;;
PostToolUse) s=thinking ;;
PreToolUse)
	case "$tool" in
	Read) s=reading ;;
	Edit | MultiEdit | Write | NotebookEdit) s=writing ;;
	Grep | Glob) s=searching ;;
	WebFetch | WebSearch) s=browsing ;;
	Agent | Task) s=delegating ;;
	*) s=working ;;
	esac
	;;
PostToolUseFailure) s=oops ;;
Notification) s=attention ;;
PreCompact) s=compacting ;;
SessionEnd)
	s=sleeping
	rm -rf "$AGENTS" # a session closed mid-agent never sends SubagentStop
	;;
*) exit 0 ;;
esac

printf '%s\n' "$s" >"$STATE"
