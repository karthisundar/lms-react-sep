// scratch/test_homepage_courses.cjs
const assert = require('assert');
const path = require('path');

console.log("=== RUNNING HOME PAGE & COURSES DATA VERIFICATION ===");

// We can compile/import the ts data or read it
const fs = require('fs');
const tsContent = fs.readFileSync(path.join(__dirname, '../src/data/coursesData.ts'), 'utf8');

// Basic structure verification
assert.ok(tsContent.includes('Data Science and Artificial Intelligence'), 'Missing Data Science course');
assert.ok(tsContent.includes('Generative AI And Agentic AI Development'), 'Missing Gen AI course');
assert.ok(tsContent.includes('Full Stack Web Development'), 'Missing Full Stack course');
assert.ok(tsContent.includes('Cyber Security and Ethical Hacking'), 'Missing Cyber Security course');
assert.ok(tsContent.includes('Cloud Computing and DevOps'), 'Missing Cloud DevOps course');
assert.ok(tsContent.includes('Java and JavaScript Full Stack Development'), 'Missing Java course');
assert.ok(tsContent.includes('Big Data, AWS and Hadoop'), 'Missing Big Data course');

// Ensure no placeholder text
const forbiddenPlaceholders = ['lorem ipsum', 'course description here', 'sample content'];
for (const placeholder of forbiddenPlaceholders) {
  assert.ok(
    !tsContent.toLowerCase().includes(placeholder),
    `Found forbidden placeholder: "${placeholder}"`
  );
}
console.log("PASS: No forbidden placeholder text in course definitions.");

// Verify slug normalization
assert.ok(tsContent.includes('generative-ai-and-agentic-ai-development'), 'Missing alias normalization for generative AI');
console.log("PASS: Slug alias normalization present for generative AI.");

// Verify duration
const durationMatches = tsContent.match(/duration:\s*"4-10 Months"/g);
assert.ok(durationMatches && durationMatches.length === 7, `Expected 7 courses with duration "4-10 Months", found ${durationMatches ? durationMatches.length : 0}`);
console.log("PASS: All 7 courses have required duration '4-10 Months'.");

console.log("=== ALL HOME PAGE & COURSES DATA VERIFICATIONS PASSED! ===");
