export const requestHandlerTemplate = `{{flavor}}

## Example Messages
json\`\`\`
{{actionExamples}}
\`\`\`

# Scene Facts
{{recentSummarizations}}
{{relevantSummarizations}}

# Goals for {{agentName}}
{{goals}}

# Actors
{{actors}}

# Available actions for {{agentName}}
{{actionNames}}
{{actions}}

# INSTRUCTIONS:
- Generate the next message in the scene for {{agentName}}
- Include content and action in the response
- Content is the text of the message
- Action is an enum from the available actions, if any
- Available actions are {{actionNames}}

Current Scene Dialog:
{{recentMessages}}

Response format should be formatted in a JSON block like this:
\`\`\`json
{ "user": "{{agentName}}", "content": string, "action": string }
\`\`\``;
