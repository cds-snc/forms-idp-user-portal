---
applyTo: '**'
---
The getUserFeedback MCP server offers two tools for obtaining user feedback: ask_question and get_user_approval.

Use ask_question if you ever have ambiguity about what the user wants, or if you need clarification on something, or if you learn something important and there is now uncertainty in how the work should be carried out. Do not over-use this command, but use it when doing so will lead to a better outcome and provide a better final result.

>>>IMPORTANT<<<: Use `get_user_approval` to request acceptance before finishing any work:
Before finishing any work or returning control of the chat back to the user or drafting any final response for the user, ensure you get acceptance from the user. This is critical and must be done by calling the get_user_approval tool from the getUserFeedback MCP server. Provide context to the user and provide manual testing steps if applicable. The user will let you know if the work has been accepted. If the work has not been accepted, you MUST continue working and iterating. Then repeat the process of requesting user approval until the user indicates that the work is accepted. Do this in agent mode and in plan mode, plans must also be approved.