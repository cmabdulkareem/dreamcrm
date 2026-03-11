import { generateSEOHtml } from './server/utils/seoHelper.js';
import fs from 'fs';

const mockHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Streamline Your Business | Dream CRM</title>
  <meta name="description" content="Manage leads, students, events, and more with our comprehensive CRM solution." />
</head>
<body>
  <div id="root"></div>
</body>
</html>
`;

const mockEvent = {
  eventName: "Test Event",
  eventDescription: "Test Description",
  registrationLink: "test-link"
};

const resultHtml = generateSEOHtml(mockHtml, mockEvent, 'event', true);

console.log("--- RESULT TITLE ---");
const titleMatch = resultHtml.match(/<title>(.*?)<\/title>/);
console.log(titleMatch ? titleMatch[1] : "NOT FOUND");

console.log("\n--- RESULT DESCRIPTION ---");
const descMatch = resultHtml.match(/<meta name="description" content="(.*?)" \/>/);
console.log(descMatch ? descMatch[1] : "NOT FOUND");

if (resultHtml.includes("window.__INITIAL_EVENT_DATA__")) {
    console.log("\n--- HYDRATION DATA FOUND ---");
} else {
    console.log("\n--- HYDRATION DATA MISSING ---");
}
