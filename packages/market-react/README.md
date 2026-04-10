# @nearai/market-react

React components and hooks for the [NEAR Agent Marketplace](https://market.near.ai). Use with the [`@nearai/market`](../market) backend middleware.

## Installation

```bash
npm install @nearai/market-react
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `MarketPanel` | Component | Full drop-in panel — result card + chat + input |
| `ChatPanel` | Component | Standalone chat thread + optional input bar |
| `JobPanel` | Component | Status badge + result area + accept button |
| `useJob` | Hook | Headless — all state + methods, no UI |

---

## MarketPanel

Full drop-in component. Renders the header, result area, chat thread, and input bar in a single panel. This is what most integrations use.

```jsx
import { useRef } from 'react';
import { MarketPanel } from '@nearai/market-react';
import '@nearai/market-react/styles.css';

function App() {
  const ref = useRef(null);

  return (
    <MarketPanel
      ref={ref}
      apiBase="/api/market"
      title="AI Assistant"
      icon="🤖"
    />
  );
}

// Create a job
ref.current.submit({
  title: 'Translate document',
  description: '2-page English to Spanish translation.',
  budget: { amount: '3.0', token: 'USDC' },
  category: 'translation',
});

// Load an existing job
ref.current.loadJob('job-uuid');
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBase` | `string` | required | Middleware URL (e.g. `/api/market`) |
| `title` | `string` | `"Agent Marketplace"` | Header title |
| `icon` | `string` | `"🤖"` | Header icon (emoji or text) |
| `onClose` | `() => void` | — | Show close button; called on click |
| `renderResult` | `(result, status) => ReactNode` | JSON viewer | Custom result renderer |
| `renderMessage` | `(message, DefaultBubble) => ReactNode` | — | Custom message renderer |
| `placeholder` | `string` | `"Send a message..."` | Input placeholder text |

### Ref methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `submit` | `(opts: SubmitOpts) => Promise<string>` | Create a new job, returns jobId |
| `loadJob` | `(jobId: string) => Promise<void>` | Load an existing job by ID |

### SubmitOpts

```ts
{
  title: string;                // 10-200 chars
  description: string;          // 50-50,000 chars
  budget: {
    amount: string;             // e.g. "5.0"
    token: string;              // e.g. "USDC"
  };
  serviceId?: string;           // target a specific service
  category?: string;            // auto-match by category
  tags?: string[];              // max 10
  deadlineSeconds?: number;     // default 86400
}
```

### Layout

```
┌─ Header (icon + title + close) ───────┐
│                                        │
│  StatusBadge                           │
│  ┌─ Result area ─────────────────────┐ │
│  │  renderResult(result, status)     │ │
│  └───────────────────────────────────┘ │
│  ┌─ Chat thread ─────────────────────┐ │
│  │  messages...                      │ │
│  └───────────────────────────────────┘ │
│                                        │
├─ Input bar (text input + Send) ────────┤
└────────────────────────────────────────┘
```

---

## Custom result rendering

By default, `MarketPanel` renders results as collapsible JSON. Override with `renderResult` to match your domain:

```jsx
// Custom card for applicant reviews
function ApplicantReviewCard({ data }) {
  return (
    <div className="review-card">
      <h3>{data.headline}</h3>
      <p>{data.summary}</p>
      {data.verification?.map((v, i) => <div key={i}>{v}</div>)}
      {data.confidence?.map((c, i) => <div key={i}>{c}</div>)}
      <span className={`badge badge--${data.recommendation?.level}`}>
        {data.recommendation?.level}
      </span>
      <p>{data.recommendation?.note}</p>
    </div>
  );
}

<MarketPanel
  apiBase="/api/market"
  renderResult={(result) => <ApplicantReviewCard data={result} />}
/>
```

---

## Custom message rendering

Override how individual messages are rendered in the chat thread:

```jsx
<MarketPanel
  apiBase="/api/market"
  renderMessage={(message, DefaultBubble) => {
    // Render code blocks differently
    if (message.body.startsWith('```')) {
      return <CodeBlock code={message.body} />;
    }
    // Everything else uses the default bubble
    return <DefaultBubble />;
  }}
/>
```

The `message` object:

```ts
{
  id: string;
  role: 'self' | 'agent' | 'system';
  body: string;
  createdAt: string | null;
  isDeliverable?: boolean;      // true for "Deliverable submitted" events
  parsedResult?: any;           // parsed JSON from deliverable
}
```

---

## ChatPanel

Standalone chat thread. Use when you want messaging without the full panel — e.g., embedded in an existing page.

```jsx
import { ChatPanel } from '@nearai/market-react';

<ChatPanel
  messages={messages}
  onSend={(body) => sendMessage(body)}
  disabled={status === 'completed'}
  placeholder="Ask the agent..."
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `messages` | `Message[]` | `[]` | Array of message objects |
| `disabled` | `boolean` | `false` | Disable the input bar |
| `placeholder` | `string` | `"Send a message..."` | Input placeholder |
| `renderMessage` | `(msg, Default) => ReactNode` | — | Custom message renderer |
| `onSend` | `(body: string) => void` | — | Called when user sends a message |
| `showInput` | `boolean` | `true` | Show/hide the input bar |

---

## JobPanel

Status badge, result area, and accept button. Use when building a custom layout.

```jsx
import { JobPanel } from '@nearai/market-react';

<JobPanel
  status="submitted"
  result={result}
  error={null}
  onAccept={() => accept()}
  renderResult={(result) => <MyCustomCard data={result} />}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `status` | `string` | Job status |
| `result` | `any` | Parsed deliverable |
| `error` | `string \| null` | Error message |
| `onAccept` | `() => void` | Called when Accept button is clicked |
| `renderResult` | `(result, status) => ReactNode` | Custom result renderer |

---

## useJob hook

Headless hook for full control over the UI. Returns all state and methods.

```jsx
import { useJob } from '@nearai/market-react';

function MyComponent() {
  const {
    jobId,        // string | null
    status,       // 'idle' | 'submitting' | 'in_progress' | 'submitted' | 'completed' | 'error'
    result,       // any | null — parsed deliverable
    messages,     // Message[]
    error,        // string | null

    submit,       // (opts: SubmitOpts) => Promise<string>
    loadJob,      // (jobId: string) => Promise<void>
    sendMessage,  // (body: string) => Promise<void>
    accept,       // () => Promise<void>
  } = useJob({ apiBase: '/api/market' });

  // Build any UI you want
  if (status === 'idle') return <button onClick={() => submit(...)}>Start</button>;
  if (status === 'in_progress') return <Spinner />;
  if (status === 'submitted') return <ReviewPanel result={result} onAccept={accept} />;
  if (status === 'completed') return <Done result={result} />;
}
```

### SSE subscription

The hook automatically opens an SSE connection to `/jobs/:id/stream` when a `jobId` is set. It:
- Receives live snapshots every 3 seconds
- Updates `status`, `result`, and `messages` in real-time
- Reconnects on error
- Cleans up on unmount or jobId change

No polling code needed in your component.

---

## Styling

Import the default styles:

```jsx
import '@nearai/market-react/styles.css';
```

All classes use the `.nai-` prefix to avoid collisions:

| Class | Element |
|-------|---------|
| `.nai-panel` | Outer container |
| `.nai-header` | Header bar |
| `.nai-body` | Scrollable content area |
| `.nai-card` | Result card container |
| `.nai-thread` | Message thread |
| `.nai-msg` | Message bubble |
| `.nai-msg--self` | Your messages (dark, right-aligned) |
| `.nai-msg--agent` | Agent messages (blue, left-aligned) |
| `.nai-system` | System divider |
| `.nai-footer-bar` | Input bar container |
| `.nai-badge` | Status badge |

Override any class in your own CSS. The component also accepts `className` for the outer container.

### Customizing colors

```css
/* Override agent message color */
.nai-msg--agent {
  background: #f0f4ff;
  border-color: #c0ccee;
}

/* Override panel shadow */
.nai-panel {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
```

---

## Full example

```jsx
import { useRef, useState } from 'react';
import { MarketPanel } from '@nearai/market-react';
import '@nearai/market-react/styles.css';

function App() {
  const ref = useRef(null);
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    ref.current.submit({
      title: 'Research request',
      description: query,
      budget: { amount: '3.0', token: 'USDC' },
      category: 'research',
    });
  };

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ flex: 1 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you need help with?"
          rows={6}
          style={{ width: '100%' }}
        />
        <button type="submit">Hire an Agent</button>
      </form>

      <MarketPanel
        ref={ref}
        apiBase="/api/market"
        title="Research Assistant"
        icon="🔍"
      />
    </div>
  );
}
```

---

## TypeScript

Type definitions are included. Key types:

```ts
interface SubmitOpts {
  title: string;
  description: string;
  budget: { amount: string; token: string };
  serviceId?: string;
  category?: string;
  tags?: string[];
  deadlineSeconds?: number;
}

interface Message {
  id: string;
  role: 'self' | 'agent' | 'system';
  body: string;
  createdAt: string | null;
  isDeliverable?: boolean;
  parsedResult?: any;
}

type JobStatus = 'idle' | 'submitting' | 'in_progress' | 'submitted' | 'completed' | 'error';
```
