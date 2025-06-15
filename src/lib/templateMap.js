// src/lib/templateMap.js

export const templates = {
  journal: {
    title: "Journal",
    content: `
      <h1>📝 Journal Entry</h1>
      <p><strong>Date:</strong> ___________</p>
      <p><strong>Mood:</strong> 😊 😐 😞</p>
      <hr />
      <h2>Reflections</h2>
      <p>Today I feel...</p>
      <h2>Gratitude</h2>
      <ul>
        <li>I’m thankful for...</li>
        <li>I appreciate...</li>
      </ul>
      <h2>Goals for Tomorrow</h2>
      <ol>
        <li>...</li>
        <li>...</li>
      </ol>
    `,
  },

  "to-do list": {
    title: "To Do List",
    content: `
      <h1>✅ My To-Do List</h1>
      <ul>
        <li>[ ] Finish homework</li>
        <li>[ ] Grocery shopping</li>
        <li>[ ] Walk the dog</li>
        <li>[ ] Read a chapter of a book</li>
      </ul>
      <h2>Priorities</h2>
      <p>What must be done today?</p>
      <h2>Notes</h2>
      <p>...</p>
    `,
  },

  notes: {
    title: "Notes",
    content: `
      <h1>🗒️ Notes</h1>
      <h2>Meeting with Team</h2>
      <p><strong>Date:</strong> ___________</p>
      <ul>
        <li>Topic 1 - Summary</li>
        <li>Topic 2 - Decisions Made</li>
        <li>Action Items</li>
      </ul>
      <h2>Ideas</h2>
      <p>Note any random thoughts or ideas...</p>
    `,
  },

  data: {
    title: "Data Report",
    content: `
      <h1>📊 Data Report</h1>
      <p><strong>Author:</strong> ___________</p>
      <p><strong>Date:</strong> ___________</p>
      <h2>1. Summary</h2>
      <p>Brief summary of the data...</p>
      <h2>2. Data Table</h2>
      <table border="1" cellpadding="5">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Users</td><td>1234</td></tr>
        <tr><td>Sessions</td><td>5678</td></tr>
      </table>
      <h2>3. Observations</h2>
      <p>What trends do we see?</p>
    `,
  },

  calendar: {
    title: "Calendar",
    content: `
      <h1>📅 Weekly Planner</h1>
      <table border="1" cellpadding="5">
        <thead>
          <tr>
            <th>Time</th>
            <th>Mon</th>
            <th>Tue</th>
            <th>Wed</th>
            <th>Thu</th>
            <th>Fri</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>8:00 - 10:00</td>
            <td></td><td></td><td></td><td></td><td></td>
          </tr>
          <tr>
            <td>10:00 - 12:00</td>
            <td></td><td></td><td></td><td></td><td></td>
          </tr>
          <tr>
            <td>13:00 - 15:00</td>
            <td></td><td></td><td></td><td></td><td></td>
          </tr>
          <tr>
            <td>15:00 - 17:00</td>
            <td></td><td></td><td></td><td></td><td></td>
          </tr>
        </tbody>
      </table>
      <p>🖊️ Fill in your weekly schedule!</p>
    `,
  },
};
