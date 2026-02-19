# Physical Examination Data Structure

This document explains how the physical examination JSON structure works and how to add/modify questions.

## Overview

The physical examination system dynamically renders questions based on a JSON configuration file ([physical-exam.data.json](./physical-exam.data.json)). This allows for easy modification and extension of the examination flow without changing code.

## JSON Structure

### Root Level
```json
{
  "id": "unique-id",
  "text": "Physical Exam",
  "engineVersion": "3.0",
  "options": []  // Array of categories
}
```

### Categories
Categories group related examinations (e.g., "General exams", "Head", "Ear").

```json
{
  "id": "category-id",
  "text": "Category Name",
  "display-or": "Translation in Odia",
  "display-hi": "Translation in Hindi",
  // ... other language translations
  "options": []  // Array of sub-categories or questions
}
```

### Questions
Questions are the actual examination items that require answers.

```json
{
  "id": "question-id",
  "text": "Question text?*",
  "isRequired": "true",  // or boolean true
  "multi-choice": true,  // allows multiple answers
  "enable-exclusive-option": "true",  // some options exclude others
  "job-aid-type": "image",  // or "video" - shows reference material
  "job-aid-file": "filename",  // reference file name
  "options": []  // Array of answer options
}
```

### Answer Options
Individual answer choices for questions.

```json
{
  "id": "option-id",
  "text": "Answer text",
  "language": "response text for records",
  "display-or": "Translation",
  "input-type": "camera",  // special type for photo capture
  "is-exclusive-option": "true",  // selecting this clears other selections
  "exclude-from-multi-choice": true,  // this option excludes others in multi-choice
  "havingNestedQuestion": "true",  // this option reveals follow-up questions
  "options": []  // nested questions (only if havingNestedQuestion is true)
}
```

## Key Features

### 1. Multi-Choice Questions
Set `"multi-choice": true` on a question to allow multiple selections.

### 2. Exclusive Options
Use `"is-exclusive-option": "true"` on an option (like "Take a picture") to clear other selections when chosen.

### 3. Nested Questions
Set `"havingNestedQuestion": "true"` on an answer option and add `"options"` array to show follow-up questions when that answer is selected.

Example:
```json
{
  "id": "question-1",
  "text": "Is there swelling?*",
  "options": [
    {
      "id": "no-swelling",
      "text": "No"
    },
    {
      "id": "yes-swelling",
      "text": "Yes",
      "havingNestedQuestion": "true",
      "options": [
        {
          "id": "nested-question",
          "text": "Does the swelling move?",
          "options": [
            { "id": "moves", "text": "Moves" },
            { "id": "doesnt-move", "text": "Does not move" }
          ]
        }
      ]
    }
  ]
}
```

### 4. Camera Capture
Add `"input-type": "camera"` to an option to enable photo capture.

### 5. Job Aids
Add reference materials to help with examination:
```json
{
  "job-aid-type": "image",  // or "video"
  "job-aid-file": "jaundiceexample"
}
```

### 6. Required Questions
Mark questions as required by adding:
```json
{
  "isRequired": "true"  // or boolean true
}
```

### 7. Multi-Language Support
Add translations for each display language:
- `display-or`: Odia
- `display-hi`: Hindi
- `display-gu`: Gujarati
- `display-as`: Assamese
- `display-bn`: Bengali
- `display-kn`: Kannada
- `display-mr`: Marathi

## Adding New Questions

1. **Simple Question**: Add to a category's options array:
```json
{
  "id": "new-question-id",
  "text": "Your question?*",
  "isRequired": "true",
  "options": [
    { "id": "opt-1", "text": "Yes", "language": "yes response" },
    { "id": "opt-2", "text": "No", "language": "no response" }
  ]
}
```

2. **With Photo Option**: Add camera input:
```json
{
  "options": [
    { "id": "opt-1", "text": "Normal" },
    {
      "id": "opt-camera",
      "text": "Take a picture",
      "input-type": "camera",
      "is-exclusive-option": "true"
    }
  ]
}
```

3. **With Nested Questions**: Add follow-up questions:
```json
{
  "options": [
    { "id": "opt-no", "text": "No" },
    {
      "id": "opt-yes",
      "text": "Yes",
      "havingNestedQuestion": "true",
      "options": [
        {
          "id": "follow-up",
          "text": "Follow-up question?",
          "options": [...]
        }
      ]
    }
  ]
}
```

## Question Flow

1. Questions are flattened from the nested structure
2. Only visible questions are shown (based on previous answers)
3. Nested questions appear only when their parent answer is selected
4. Users navigate through questions sequentially
5. Required questions are validated before submission

## Data Storage

Answers are stored as:
```typescript
{
  "question-id": "answer-id",  // single choice
  "question-id": ["answer-1", "answer-2"],  // multi-choice
  "question-id_image": "base64-image-data"  // camera capture
}
```

## Tips

- Use descriptive IDs for easier debugging
- Always provide translations for multi-language support
- Test nested question flows thoroughly
- Mark important questions as required
- Use job aids for complex examinations
- Keep question text concise and clear
