General
- Add loading states or creative indicators on all expensive pages and interactions
- Improve speed and decrease latency

Security: 
    - seeing code on inspect in production
    - console output in production, is it safe?
    - 

Tech-Debt
1. Email resending not working, wrong token error, check forgot password
4. Create simple incremental onboarding flow for users if they havent visited a page before

Auth:
- Cookie error still present?
- Confirmation email is ugly ux
- Insonsistency for display name across db tables, need a function that updates regularly

Profile page    
- Reintroduce QR codes, on profile as sharable, on epk and rate card too.
- confirm socials links for different social in ui
- add click to expand dp on artist profile
- How do we handle alot of products -> maybe dedicated products page per artist 
- Need to provide customisation options

Export
- EPK 2 pages has a bug and needs design work
- Design rate card also needs work, 2 pages and 1, stats are missing
- Image and pdf are completely different. We can allow differnt styles of export


Packages:
AI chatbot
The "Package Wizard" for Artists: Many independent creatives struggle to write professional, marketing-focused descriptions for their services. You can build a tool where an artist inputs: "I sing acoustic songs at weddings for 1 hour," and Groq instantly expands it into a polished, high-converting package structure with bullet points, best-for scenarios, and clear deliverables.

Deployment
- Set up staging properly

Audience
- Add phonenumber to audience

Walkthrough tutorial
- Feature by feature

Wandia Feedback:
- On artist profile, change currency to auto?
- Adding payment details? Do we add them?
- Events Time: Make it a range? From 7am to 10pm. Add payment details
- What would draw the artist in? What features? -payment at the click of a button, how do i get paid?
- Font change the font to less calculatorly
- View artists link on dashboard
- Delete profile


AmaliTech
- Add AI chatbot or something that guides the users on packages, platform etc
Smart Pricing Assistant: Groq can parse an artist’s category, location, and experience level to suggest baseline competitive tiers. For example, it can advise: "Based on Spoken Word averages in Kampala, your standard 30-minute set is priced perfectly, but you could offer an Extended tier at UGX 250,000."

AI Social Caption Generator: You can add a button next to an artist's portfolio pieces or circle updates: "Generate Instagram Caption." Groq can read the package details and spit out ready-to-copy social media posts complete with relevant creative hashtags.