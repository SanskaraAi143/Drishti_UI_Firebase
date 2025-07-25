# **App Name**: Drishti Commander

## Core Features:

- Real-time Map View: Display a Google Maps view with real-time crowd heatmaps, staff locations, incident flags, and predictive bottlenecks.
- Live Alerts Feed: Show a sidebar with scrolling real-time alerts (e.g., 'Fight detected in Zone C') with timestamps, fetched from Firestore.
- Incident Details Modal: Open a modal with incident details when an alert is clicked, including location, time, description, and an AI anomaly source.
- AI Query Interface: Provide a text input for commanders to ask natural language questions and display the AI's response in a chat-like bubble, using the AI tool to determine if information on incident anomalies should be displayed in its reply.
- Heatmap Controls: Implement toggle buttons to show/hide overlays (real-time heatmap, predictive bottlenecks, staff GPS).
- Staff and Resource View: List available staff with GPS locations, updated in real-time via Firestore, and a button to zoom the map to selected staff.
- Real-time Notifications: Handle browser push notifications for high-priority alerts (e.g., 'Medical emergency dispatched') using FCM.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to evoke trust and authority, reflecting the seriousness of emergency management.
- Background color: Dark gray (#263238) for a high-contrast dark mode theme suitable for field operations.
- Accent color: Vibrant orange (#FF9800) to highlight critical alerts and CTAs, ensuring they stand out against the dark background.
- Body font: 'PT Sans', a humanist sans-serif offering a balance of modernity and readability suitable for information-dense dashboards.
- Headline font: 'Space Grotesk' for a computerized, techy feel, contrasting with the body to focus the user's attention on critical data and actionable items.
- Use a set of consistent, clear icons to represent different types of incidents, staff roles, and resources. The icons should be easily recognizable, even in stressful situations.
- A responsive layout using Bootstrap grid system to adapt to various screen sizes. Prioritize key information (e.g., alerts, map) on mobile devices.
- Subtle animations, such as smooth transitions and loading spinners, to provide feedback during data updates and API calls, ensuring a seamless user experience.