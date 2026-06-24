

In the DeliverablesStep component, add functionality to generate a shot list using AI based on the shoot details. Use the `generateShotList` service and display the results in a new UI section.

In the CreativeDirectionStep component, enhance the display of AI mood board analysis. Show detected colors, keywords, and lighting styles more prominently using cards or a carousel.

In the AddOnsStep component, add tooltips to the 'Retouching Level' and 'Usage Rights' options to explain what each tier entails.

In the DeliverablesStep component, allow the user to adjust the priority (High, Medium, Low) of AI-generated shots in the shot list.

In the src/services/ai/shotList.ts file, implement mock data generation for the `generateShotList` function to simulate AI output when the API key is not available

In the DeliverablesStep component, integrate the AI-generated shot list data. Allow users to edit the shot names and descriptions and save these edits. Then, add a button to the ShotList page to load these AI-generated, user-edited shots..

In the CreativeDirectionStep component, improve the display of the AI analysis results. Ensure the color palette swatches are clearly visible, add icons to represent the detected keywords, and make the 'suggestion' text more prominent. Also, ensure that if similar brands are detected, they are displayed as clickable links to search results.

In the AddOnsStep component of the Shoot Wizard, add a new section for 'Turnaround Time' with three options: 'Rush' (1.3x multiplier), 'Standard' (1.0x multiplier), and 'Extended' (0.9x multiplier). Ensure the total price updates accordingly when the user selects a different turnaround time.

In the Shoot Wizard, refine the navigation between steps. Ensure the 'Back' button is consistently styled and functions correctly. Add visual indicators (e.g., step numbers or progress bar) to clearly show the user their current progress through the wizard.

For the Shoot Wizard, create an optional onboarding tutorial overlay. This overlay should briefly explain the purpose of each step and highlight the AI features, appearing the first time a user accesses the wizard.

n the DeliverablesStep component, add functionality to allow users to reorder shots in the AI-generated list by dragging and dropping.

In the DeliverablesStep component, add a button to trigger AI generation of a shot list based on the selected shoot details and moodboard analysis, pre-populating the list.

In the CreativeDirectionStep component, display the detected lighting style and composition style from the AI analysis in a more prominent way, perhaps with small descriptive icons.

In the CreativeDirectionStep component, improve the display of AI analysis results. Ensure color palette swatches are clearly visible, add icons for detected keywords, and make the suggestion text more prominent. Also, ensure similar brands are displayed as clickable links.

In the DeliverablesStep component, add functionality to generate a shot list using AI based on the shoot details. Use the `generateShotList` service and display the results in a new UI section.

In the CreativeDirectionStep component, enhance the display of AI mood board analysis. Show detected colors, keywords, and lighting styles more prominently using cards or a carousel.
In the DeliverablesStep component, allow the user to adjust the priority (High, Medium, Low) of AI-generated shots in the shot list.

create plan 04-aishot-list
ai features gemeni 3 features tools 
progreass tracker
tasks
success criteria 
check list production ready 
core advanced
mermaid diagrams

In the DeliverablesStep component, add functionality to generate a shot list using AI based on the shoot details. Use the `generateShotList` service and display the results in a new UI section.

In the src/services/ai/shotList.ts file, implement mock data generation for the `generateShotList` function to simulate AI output when the API key is not available.

In the DeliverablesStep component, allow the user to adjust the priority (High, Medium, Low) of AI-generated shots in the shot list.