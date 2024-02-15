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

# Available actions for {{agentName}}
{{actionNames}}
{{actions}}

# Actors
{{actors}}

Current Scene Dialog:
{{recentMessages}}

# INSTRUCTIONS:
- Generate the next message in the scene for {{agentName}}
- Include content and action in the response
- Content is the text of the message
- Action is an enum from the available actions, if any
- Available actions are {{actionNames}}

Response format should be formatted in a JSON block like this:
\`\`\`json
{ "user": {{agentName}}, "content": string, "action": string }
\`\`\``;
