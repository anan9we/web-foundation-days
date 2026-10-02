// Starting notes data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const validCategories = ["personal", "work", "study"];

// 1. Search notes without case sensitivity
function searchNotes(word) {
  return notes.filter((note) =>
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

console.log(searchNotes("JAVASCRIPT"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("pizza"));
// Expected: []

// 2. Find the longest note
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  return notes.reduce((longest, current) =>
    current.text.length > longest.text.length ? current : longest
  );
}

console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

const savedNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = savedNotes;

// 3. Count notes by category
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }

  return counts;
}

console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotes;

// 4. Generate a summary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";

  return `${total} ${word}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

notes = [savedNotes[0]];

console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."

notes = savedNotes;

// 5. Check for duplicate notes
function isDuplicate(text) {
  const normalize = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  return notes.some((note) => normalize(note.text) === normalize(text));
}

console.log(isDuplicate("  BUY   MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Study Python"));
// Expected: false

// 6. Add a note after validation
function addNote(text, category) {
  const cleanText = text.trim();

  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Note must contain between 1 and 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category. Use personal, work, or study.");
    return false;
  }

  if (isDuplicate(cleanText)) {
    console.log("This note already exists.");
    return false;
  }

  const newId = Math.max(0, ...notes.map((note) => note.id)) + 1;

  notes.push({
    id: newId,
    text: cleanText,
    category: category,
  });

  console.log("Note added successfully.");
  return true;
}

console.log(addNote("Complete Python exercises", "study"));
// Expected: true

console.log(addNote("   ", "personal"));
// Expected: false (invalid length)

console.log(addNote("Complete Python exercises", "study"));
// Expected: false (duplicate)

console.log(addNote("Buy a laptop", "shopping"));
// Expected: false (invalid category)

console.log(addNote("A".repeat(201), "work"));
// Expected: false (exceeds 200 characters)

console.log(getSummary());
// Expected: "6 notes: 2 personal, 1 work, 3 study."
