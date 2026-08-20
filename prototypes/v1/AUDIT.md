# Chat workflow UX audit

## Scope

This audit reviews the completed chat implementation stored in the `v1` repository at `HEAD`. The current worktree has those source files deleted, so the review used the committed files without restoring or changing the original app.

The redesign mode is preserve. The existing monochrome portfolio identity, Geist typography, compact panel, AI question answering, and two contact intents remain recognizable.

Design dials for the prototype:

- Design variance: 4. Predictable placement is more valuable than novelty in a utility.
- Motion intensity: 3. Motion is limited to feedback and state transitions.
- Visual density: 6. The panel keeps useful context visible without crowding the workflow.

## Highest-impact problems

### 1. Two different products share one ambiguous surface

The initial panel mixes four AI prompts with two lead-capture triggers. All six look like suggestion chips, so users must infer that some buttons ask a question while others begin a required multi-question form.

Prototype correction: the opening screen has two labeled groups, "Explore his background" and "Contact Montasim." Contact actions explain that they open a short guided inquiry.

### 2. Lead capture hides workflow state

The current flow provides no progress, Back, Cancel, review, or edit controls. Once a user selects an answer, the only obvious path is forward.

Prototype correction: each inquiry shows its name, current question, total question count, progress, Back, Cancel, and a review of earlier answers. Every reviewed answer has a named Change action. Editing preserves later answers and returns the user to the question they were answering. Input errors are inline and associated with the field.

### 3. Contact details enter the AI conversation

After lead capture completes, the current implementation copies every flow message into AI chat state. The next AI request can include the visitor's name and email in model history. This is unnecessary for answering portfolio questions and conflicts with reasonable privacy expectations.

Prototype correction: contact data remains in the inquiry workflow and is cleared before returning to AI chat. The UI explains this boundary at the email step and after submission.

### 4. Submission failure is invisible

The current interface switches to a success-like AI state immediately. The lead request runs in the background and ignores any failure, so a visitor can be told that Montasim will follow up even when the inquiry was never saved.

Prototype correction: submission has visible loading, confirmed success, and recoverable error states. Failure preserves answers and offers Retry, Change email, and Email directly.

## Accessibility and interaction problems

- The chat panel has no dialog semantics, focus trap, Escape behavior, or focus restoration.
- The close and send icon buttons do not have accessible names in their component markup.
- The message field relies on placeholder text instead of a persistent visible label.
- The lead email step still renders a plain text input, so native email behavior is not used.
- The automatic nudge uses an animated decorative status dot and offers no separate dismiss control.
- A loading spinner communicates activity visually but does not expose a useful live status.
- Chat errors are rendered as normal assistant messages, which makes system failure easy to mistake for content.
- The input is disabled during a request, but no retry path or preserved error state is provided.

Prototype correction: the panel uses dialog labeling, keyboard containment, Escape close, focus restore, named controls, visible field labels, semantic input types, polite live announcements, skeleton loading, and contextual errors.

## Workflow implemented in the prototype

1. Open the assistant from a descriptive launcher.
2. Ask a free-form portfolio question or choose a common topic.
3. Read a concise answer with its portfolio source and an optional next action.
4. Start a role or project inquiry in a clearly separate guided flow.
5. Review progress, change an earlier answer without losing later answers, move back, cancel safely, and validate contact details.
6. See honest loading, success, or failure feedback.
7. Continue AI questions without sending personal details into chat history.

## Prototype test paths

- Choose any suggested question to see loading, an answer, source context, copy, and follow-up behavior.
- Type `error` as a chat question to see the recoverable answer error state.
- Complete either contact flow to see confirmation.
- Open "Review earlier answers," choose Change, and verify the flow returns to the current question after saving.
- Use `fail@example.com` at the email step to see the recoverable submission failure state.
- Resize below 640 px to see the full-screen mobile assistant.
- Use Tab, Shift+Tab, and Escape to test keyboard behavior.
- Toggle light and dark themes from the page header.
