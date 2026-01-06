/**
 * Sample essays for development testing.
 * This module is only used in development mode and will be tree-shaken in production.
 */

import { Env } from '@/libs/Env';

import type { AcademicLevel } from '../../../convex/schema';

export type SampleEssay = {
  id: string;
  name: string;
  title: string;
  subject: string;
  academicLevel: AcademicLevel;
  instructions: string;
  customRubric: string;
  focusAreas: string[];
  content: string;
};

// Only import sample data in development or when dev tools are explicitly enabled
const devToolsEnabled
  = Env.NODE_ENV === 'development'
  || Env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

const sampleEssays: SampleEssay[] = devToolsEnabled
  ? [
      {
        id: 'law-portfolio',
        name: 'Law Portfolio - Employment Tribunal',
        title: 'Employment Tribunal Advice – Harassment and Unfair Dismissal Claims',
        subject: 'Law and Business',
        academicLevel: 'undergraduate',
        instructions: `Summary of submissions due for the Portfolio of Spring term work

Note that this is a list of all the tasks for the Portfolio of Spring Term work in LAW1024C Legal Foundations 2. All word limits are exclusive of references, the bibliography, and any headings.

Submission Date: Due before 12:00 midday on Wednesday 30th April 2025

Assessment: The Portfolio of spring term work comprises of the following pieces of work:
- Task 1: a letter of advice to your client that advises on the relevant law and remedies, the advantages and disadvantages of a negotiated settlement instead of proceeding to trial, and what Employment Tribunals are and what to expect at the final Hearing.
- Task 2: a teamwork and legal skills reflective essay, with the completed action plans attached as appendices.

Max length: 2,500 words (for guidance the letter should be around 1,500 words and the reflective essay around 1,000 words)

The word limits for the Portfolio are strict and exclude (1) the Action Plans (2) headings and (3) the bibliography, as well as all citation information in footnotes.

Task 1: Letter of advice
Word limit: 1,500 words (suggested).

You are required to write a letter of advice to your client in the Employment Tribunal case. Using the correct template letter, you are required to:
- Advise on the relevant law and remedies
- Advise on the advantages and disadvantages of a negotiated settlement instead of proceeding to trial
- Explain the purpose of employment tribunals and what to expect at the final Hearing

Note: The letter should be written as if the employment tribunal hearing has not yet taken place. References are required using OSCOLA.

Task 2: Teamwork and Legal Skills Reflective Essay
Word limit: 1,000 words (suggested - not including the Skills Action plan which is an Appendix)

Part A: Reflect on the development of two or three of your teamwork skills over the course of the academic year.
Part B: Reflect on one core legal skill (client interviewing, negotiating, or advocacy) developed during the spring term.`,
        customRubric: `Law School Cornwall Assessment Criteria - Level 4 (Year 1)

The Four Criteria:
1. Analysis / argument – the ability to critically analyse and apply legal concepts and principles, develop and sustain reasoned and persuasive argument.
2. Knowledge / understanding – relevant and accurate knowledge and understanding of the subject area, ability to explain and apply primary and secondary sources.
3. Use of materials / research – ability to independently locate, draw upon and engage with a range of sources effectively, proper OSCOLA referencing.
4. Presentation – clear and cogent presentation, logical structure, avoiding errors, concise and precise language.

Marking Scale:
- First class (68-100): Cogent and thorough analysis, strong proficiency in application of law to facts, sustained logical development of argument
- Upper second class (58-67): Very good identification and analysis of key issues, beginning to show ability to distinguish and reason by analogy
- Lower second class (48-57): Good identification of most key issues, some evidence of reasoned argument but may deviate at times
- Third class (38-47): Satisfactory identification of most key issues, some attempt at reasoned argument
- Fail (0-37): Little to no meaningful analysis, frequent misapplication of law`,
        focusAreas: [
          'Legal analysis and application',
          'OSCOLA referencing',
          'Professional letter format',
          'Reflective writing quality',
        ],
        content: `Task 1: Letter of Advice

Firm 3
Campus, Glasney Lodge, Penryn TR10 9FE
Alex@firm3.com
+44 7426 839 217

To: Mr Duncan Goode
Date: 14 May 2025
Subject: Employment Tribunal Advice – Harassment and Unfair Dismissal Claims

Dear Mr Goode,

Thank you for contacting us in relation to your Employment Tribunal claim. This letter sets out our advice regarding the legal claims you are pursuing against Cann Abel Solicitors. As the hearing has not yet taken place, the purpose of this letter is to advise you on the relevant law and how it applies to your case. The remedies that may be available to you, the pros and cons of settling your claim and what to expect at the Tribunal hearing.

1. Summary of Key Facts

You were an employee of Cann Abel from 1 July 2022 to 16 September 2024. Originally as a trainee, you were then promoted to Assistant Solicitor on the 1st of July 2024. During your time in the Dispute Resolution team, you allege that your supervisor, Joanne Cann, engaged in unwanted physical contact and inappropriate comments.

Around the 21st of July and 27th of July 2024, Ms Cann touched you at work, rubbing your shoulders and neck, and referred to you as "Sweetie." On the 6th of August, she made another physical and suggestive comment, squeezing your arm and invited you to the pub, she said she wanted to "go out with a strong man." You made it clear you weren't interested and asked her to stop.

After this incident, you were on annual leave and so was Ms Cann. Upon her return on the 31st of August, she reviewed your cases and the next day you were suspended. You were later dismissed for alleged gross misconduct, including missing a limitation date and the failure to send client care letters. You believe this disciplinary action was due to your rejection of Ms Cann's behaviour and not genuine misconduct.

You are bringing claims for:
- Harassment related to sex
- Sexual harassment
- Less favourable treatment after rejecting sexual conduct
- Unfair dismissal

2. Harassment Related to Sex – Section 26(1) Equality Act 2010

Under section 26(1) of the Equality Act 2010, harassment occurs where a person engages in unwanted conduct related to sex, which has the purpose or effect of either violating your dignity or creating an intimidating, hostile, degrading, humiliating or offensive environment for you.

The touching of your shoulders and use of the name "Sweetie" could be reasonably viewed as unwanted conduct relating to sex. The law doesn't require the conduct to be sexual in nature and only that it is related to sex, which includes gendered language and assumptions.

It is important that the "effect" on you matters even if the intention was different. You've said how it made you feel uncomfortable and created an awkward and unwelcome environment, especially as it came from someone in a position of authority over you. This aligns with the approach taken in Driskel v Peninsula Business Services Ltd, where an overly familiar work environment became actionable harassment when it affected the claimant's dignity.

3. Sexual Harassment – Section 26(2) Equality Act 2010

This provision covers unwanted conduct of a sexual nature. Again, the effect of the behaviour is crucial. In your case, the physical contact, massaging, squeezing your biceps and suggestive comment about "going out with a strong man" all point clearly to sexualised conduct.

You made it clear you were uncomfortable, and the conduct continued. In Reed v Stedman, it was held that a single sexual comment could amount to harassment if it had the required effect. Here, the physical element combined with suggestive remarks is likely to be taken seriously by the Tribunal. The fact that Ms Cann was your supervisor strengthens the power imbalance and makes it more likely the conduct will be seen as unlawful.

4. Less Favourable Treatment – Section 26(3) Equality Act 2010

You also have a claim under section 26(3), which provides protection where someone is treated less favourably because they reject or submit to sexual conduct.

The key issue is whether your suspension and dismissal were influenced by your rejection of Ms Cann's advances. Although the employer may argue that you were dismissed for performance issues, the timing is highly suggestive: you were suspended the day after she returned from leave, following your rejection of her conduct.

In Hammond v International Network Services UK Ltd, the Tribunal accepted that post-rejection retaliation could be unlawful harassment if linked to the earlier sexual conduct. Similarly, in Moonsar v Fiveways Express Transport Ltd, the employer's actions following a rejection were held to be discriminatory.

5. Unfair Dismissal – Employment Rights Act 1996

Employees with two years' continuous service are protected from unfair dismissal under section 94 of the Employment Rights Act 1996. A dismissal will be fair if the employer had:
- A potentially fair reason (e.g., misconduct)
- Acted reasonably in treating that reason as sufficient (British Home Stores v Burchell test)

You admitted missing a deadline. But you were also denied the opportunity to explain the client care letters issue fully, and the process raises red flags:
- No clear particulars of the allegations
- You weren't allowed access to your files
- The presenter of the case was the very person whose conduct you had rejected

Tribunals expect impartial decision-making. Having Ms Cann lead the disciplinary case when she was the subject of your complaint is arguably a breach of natural justice.

You also mention a comparator who was not dismissed for similar mistakes. This could show inconsistency, and strengthen both your unfair dismissal and discrimination claims.

6. Remedies Available

If successful, you may be entitled to the following:

a. Discrimination Claims (Equality Act 2010)
- Injury to feelings (per Vento bands):
  - Band 1: £1,100 – £11,200 (less serious)
  - Band 2: £11,200 – £33,700 (mid-range)
  - Band 3: £33,700 – £56,200 (most serious)
- Financial losses (e.g. lost earnings since dismissal)
- Declaration of unlawful conduct
- Recommendation to prevent recurrence (e.g. training)

b. Unfair Dismissal (ERA 1996)
- Basic award (based on age and length of service)
- Compensatory award (lost income, future loss)
- Reinstatement or re-engagement – though rare

7. Settlement – Advantages and Disadvantages

A negotiated settlement (usually a COT3 agreement via ACAS) can be a practical alternative to a hearing.

Advantages:
- Faster and cheaper
- Less stressful than a public hearing
- Certainty over outcome
- Possibility of a neutral reference

Disadvantages:
- Usually a lower payout than a Tribunal award
- No public finding of fault
- You give up your right to pursue the claim

We can assist you in negotiating a fair figure, especially if you are open to a non-financial remedy like a reference.

8. What to Expect at the Tribunal

Employment Tribunals are less formal than courts but still structured. The panel usually includes:
- An Employment Judge
- Two lay members (employer/employee experience)

You'll give evidence, be cross-examined, and have a chance to put forward your case. The hearing is usually public, but in sensitive harassment cases, the Tribunal can make privacy directions.

Hearings typically last a few days. We'll support you in preparing your witness statement, evidence bundle, and submissions.

In our view, your claims are strong. The conduct complained of is serious and recent. The timing of the dismissal and procedural issues suggest your employer may not have acted fairly. Pursuing the claim is likely to result in either a successful Tribunal outcome or a reasonable settlement offer.

Please don't hesitate to get in touch if you'd like us to initiate settlement discussions or prepare for hearing.

---

Task 2: Reflective Essay

Part A

This year has marked a big change for me, I moved countries and started university. If you looked at my phase 1 action plan and compared it to my phase 2, you will probably see two different versions of me. At the start I struggled with almost every aspect of teamwork in an academic setting. This was not because I didn't care, it was because I didn't know how to show up properly in an academic environment.

My ADHD played a big part of that. It's not just about getting distracted and losing focus. I also get energy crashes that come out of nowhere, periods where I have no motivation to get tasks done, and missed tasks and bad results that lead to guilt which make it even harder to re-engage. There were times when I really did want to engage properly with my firm, but mentally it was very difficult to do. It is very exhausting trying to mask that in a group environment where you're expected to switched on and competent.

On top of that, ADHD often comes with mood and an emotional rollercoaster. Some days I would be able to contribute and on other days id feel very out of place. That inconsistency made me second guess whether I should speak in meetings, even when I had something to say. The academic setting has never really been biggest strength. I'm very confident socially and quite load, but in an academic environment, that confidence goes away. It feels like I'm stepping into another world and I feel behind even if no one said it out loud.

In Phase 1, my attendance was very inconsistent to both firm meetings and lectures. I barely spoke and I avoided harder tasks. I would only take on work on work I was comfortable with. It wasn't entirely due to laziness, it was mainly a fear of letting the group down. Communication and cooperation were low because I felt like I had little to add. All of my self-assessment scores were pretty low for good reason.

I came to learn that improvement doesn't necessarily mean becoming the loudest or most dominant voice in the room but it was more about turning up, making small changes and building momentum. In phase 2 I started to do a bit more preparation before meetings, it was small but it was more than what I did before. This meant that I could contribute one small point without panicking and that did help. I spoke more and tried to push myself and do harder tasks. I still haven't reached my full potential but it was progress that I was proud of.

In terms of specific teamwork skills, communication, co-operation and delivery of work are where I noticed the biggest shift. Communication was definitely the most difficult. I really had to push myself to speak up even when my brain told me it wasn't worth it. But the more I did the less intimidating it became. Co-operation followed, once I started to participate I felt more included. And in terms of delivery I actually completed task that I otherwise would've avoided.

I think a lot of the progress I made come from accepting that it did not need to be perfect. According to Belbin's team role theory, good teams need a mix of personalities and skills, not just extroverted leaders. Belbin talks about the value of people that are good listeners and those that quietly make sure things get done.

To be completely honest there were still challenges. I still had to fight the struggles that come with ADHD like low motivation. I still left things too late, but by the end of phase 2 I had made progress in managing some of these struggles, especially by using structure and preparation to my advantage and that is something I plan to carry on doing.

So, going forward I have created a plan to try and follow:
1. Keep preparing beforehand for meeting, not necessarily hours of work but enough to walk in with something to say.
2. I will set small personal goals for group tasks, whether its volunteering to do something or helping someone else out.
3. Use my support plan more actively I must use the tools I've got access to for ADHD, and I need to use them rather than just brushing them of.
4. I will track my energy and pace myself to avoid going into dips and avoiding work overflow.

Finally, teamwork this year has taught me that I don't have to change who I am to be useful in a group. I just need to bring the best version of what I already have. That means playing to my strengths, being honest about my weak esses and finding ways to stay consistent even when my brain starts get distracted.

Part B

Negotiation was the most practical skill I developed over this term. I always associated negotiation with being very sharp and confrontational which I did not think I would be capable of achieving in an academic context, especially one I hadn't practiced before.

Going into it I didn't feel confident, I was unsure how to strike the balance between being professional and standing firm. ADHD didn't help that either, I found it very hard to prepare because would focus would drift and I would second guess myself. But once the exercise started, I was surprised by how much it wasn't about being aggressive, it was more about reading the room, staying calm and knowing when to push and when to take a step back, these are things that I am good at.

Something I did struggle with however, was the idea of anchoring. I was to quick to accept the first offer that was made and in hindsight I could've pushed harder. I didn't really test the "zone of possible agreement" because I didn't set a clear boundary beforehand. That is something I'd do differently. I got to see the value of knowing your limits before you walk into a room.

Still, there were positives. I was able to keep things respectful and constructive, which made the other side more open. According to Embley et al, good negotiation relies on preparation and adaptability, being able to respond in the moment and not just sticking to a script. I saw I didn't need to dominate, I just needed to listen, think and respond clearly.

Moving forward, I would like to further develop my confidence in making offers and setting clear goals before negotiating. I would also like to practice responding in real time through moots, and mock negotiations. But this really showed me that negotiation isn't about winning, its more about getting a result that works without escalating conflict.`,
      },
      {
        id: 'history-industrial-revolution',
        name: 'History - Industrial Revolution',
        title: 'The Impact of the Industrial Revolution on 19th Century Britain',
        subject: 'History',
        academicLevel: 'undergraduate',
        instructions: `Write a 1500-word essay analyzing the social and economic impacts of the Industrial Revolution in 19th century Britain.

Your essay should:
- Provide a clear thesis statement in your introduction
- Analyze at least three major social impacts (e.g., urbanization, working conditions, family structure)
- Analyze at least three major economic impacts (e.g., rise of factories, changes in trade, emergence of new classes)
- Use primary sources where possible to support your arguments
- Include a conclusion that synthesizes your analysis

Assessment will focus on:
- Strength and clarity of your thesis
- Quality of evidence and source usage
- Logical structure and flow of argument
- Proper citation in Chicago style`,
        customRubric: `| Criterion | Excellent (A) | Good (B) | Satisfactory (C) | Needs Improvement (D) |
|-----------|---------------|----------|------------------|----------------------|
| Thesis | Clear, specific, arguable thesis that guides the essay | Clear thesis but could be more specific | Thesis present but vague | No clear thesis |
| Evidence | Extensive use of primary and secondary sources | Good use of sources with minor gaps | Adequate sources but relies heavily on secondary | Insufficient or inappropriate sources |
| Analysis | Deep analysis connecting evidence to thesis | Good analysis with occasional description | More description than analysis | Mostly summary, little analysis |
| Structure | Excellent organization with smooth transitions | Good structure with minor issues | Adequate structure but choppy | Disorganized or illogical flow |
| Citations | Perfect Chicago style formatting | Minor citation errors | Several citation errors | Major citation problems or missing citations |`,
        focusAreas: [
          'Thesis clarity and arguability',
          'Use of primary sources',
          'Balance of social vs economic analysis',
          'Argument structure',
        ],
        content: `The Industrial Revolution, which began in Britain in the late 18th century, marked one of the most significant turning points in human history. While historians have long debated its precise origins and timeline, there is little dispute about its profound and lasting effects on British society and economy. This essay argues that the Industrial Revolution fundamentally restructured British life, creating both unprecedented economic opportunities and severe social dislocations that would define the character of modern industrial society.

The economic transformation wrought by industrialization was nothing short of revolutionary. The factory system, pioneered in the textile industry, represented a complete departure from the cottage industry that had characterized British manufacturing for centuries. As historian Eric Hobsbawm noted, the cotton mill became "the symbol of the new industrial age." Production that had once taken weeks in scattered homes could now be completed in days within centralized factories. This dramatic increase in productivity drove down prices for consumers while generating enormous profits for factory owners.

The rise of factories necessitated and accelerated urbanization on an unprecedented scale. Manchester, which had been a modest market town of approximately 25,000 in 1772, exploded to over 300,000 by 1850. Birmingham, Leeds, and Sheffield experienced similar growth trajectories. This urban expansion created new economic ecosystems: banks, insurance companies, and merchant houses proliferated to service the needs of industrial enterprises. The development of canal networks and later railways—Britain had over 6,000 miles of track by 1850—further integrated these urban centers into a national economic system.

However, the economic benefits of industrialization were distributed highly unequally. A new class of industrial capitalists emerged, men like Richard Arkwright and Robert Owen who amassed fortunes unimaginable to previous generations. Meanwhile, a vast industrial proletariat labored for wages that, while often higher than agricultural earnings, barely provided subsistence. Friedrich Engels, observing Manchester in the 1840s, documented the stark contrast between the opulent homes of factory owners and the squalid cellars where workers' families lived.

The social impacts of industrialization were equally profound. The traditional family economy, in which household members worked together in agricultural or cottage industry, gave way to a new pattern where fathers, mothers, and children might work in different factories on different schedules. Women and children formed a significant portion of the early factory workforce, valued for their nimble fingers and their willingness to accept lower wages. Parliamentary investigations in the 1830s and 1840s revealed children as young as five working twelve-hour days in mines and mills.

Working conditions in early factories were often brutal. The demands of machine-paced production imposed a rigid discipline unknown in agricultural work. Factory bells regulated every aspect of the working day; fines and physical punishment enforced compliance. The health consequences were severe: respiratory diseases from cotton dust, accidents from unguarded machinery, and the general debilitation caused by long hours in poorly ventilated spaces. Life expectancy in industrial cities like Manchester and Liverpool was significantly lower than in rural areas.

Yet industrialization also created new forms of social organization and consciousness. Workers began to recognize their shared interests and organize accordingly. The early trade union movement, despite legal restrictions, established a tradition of collective action that would reshape British politics. The Chartist movement of the 1830s and 1840s, demanding political rights for working men, represented the first mass political movement of the industrial age. While Chartism ultimately failed in its immediate objectives, it demonstrated the political potential of an organized working class.

The Industrial Revolution also transformed ideas about time, work, and human potential. The factory clock replaced the natural rhythms of sun and season; punctuality became a virtue enforced by economic necessity. New ideologies emerged to explain and justify—or to critique—the new order. Political economy, as developed by Adam Smith, David Ricardo, and their followers, celebrated the wealth-creating potential of free markets and industrial enterprise. Socialist and radical critics like Robert Owen and later Karl Marx offered alternative visions of how industrial power might be organized for human benefit rather than private profit.

The physical landscape of Britain was permanently altered. The "dark Satanic mills" that William Blake lamented spread across the Midlands and the North. Coal mines scarred the Welsh valleys and the Northeast. New industrial towns sprang up where villages had stood; ancient forests gave way to factory complexes and workers' housing. The environmental consequences, from polluted rivers to smoke-darkened skies, would not be seriously addressed for more than a century.

In conclusion, the Industrial Revolution represented a fundamental rupture in British—and ultimately global—history. Its economic innovations created wealth on a scale previously unimaginable, but that wealth was concentrated in relatively few hands while millions labored in conditions of exploitation and deprivation. Its social consequences included the destruction of traditional ways of life, the emergence of new class structures and conflicts, and the creation of political movements that would eventually win significant reforms. The world we inhabit today, for better and worse, is in large measure a product of the transformations set in motion in late 18th century Britain. Understanding the Industrial Revolution is therefore essential not merely as historical knowledge, but as insight into the origins and character of modern industrial society.`,
      },
      {
        id: 'literature-hamlet',
        name: 'Literature - Hamlet Analysis',
        title: 'Character Analysis: Hamlet\'s Internal Conflicts',
        subject: 'English Literature',
        academicLevel: 'high_school',
        instructions: `Analyze the character development of Hamlet throughout Shakespeare's play, focusing on his internal conflicts and their resolution.

Your essay should:
- Be approximately 800-1000 words
- Include an introduction with a clear thesis about Hamlet's character
- Discuss at least two major internal conflicts Hamlet faces
- Analyze how these conflicts develop and (if applicable) resolve throughout the play
- Use at least 3-4 direct quotes from the play to support your analysis
- Include a conclusion that reflects on the significance of Hamlet's journey

Remember to use MLA format for all citations.`,
        customRubric: `Literary Analysis (40%)
- Demonstrates deep understanding of character psychology
- Identifies and analyzes relevant themes and motifs
- Makes insightful connections between character and broader meaning

Textual Evidence (30%)
- Selects appropriate and effective quotes
- Integrates quotes smoothly into analysis
- Explains how evidence supports claims

Organization & Writing (20%)
- Clear thesis and logical paragraph structure
- Smooth transitions between ideas
- Engaging introduction and conclusion

MLA Format (10%)
- Correct in-text citations
- Proper quote formatting
- Works Cited page (if required)`,
        focusAreas: [
          'Character psychology analysis',
          'Quote integration technique',
          'Thesis clarity',
        ],
        content: `In William Shakespeare's tragic play "Hamlet," the titular character undergoes a profound psychological journey that has fascinated audiences and scholars for over four centuries. Prince Hamlet of Denmark is not a simple hero seeking revenge; he is a deeply conflicted individual torn between action and contemplation, duty and morality, certainty and doubt. This essay argues that Hamlet's internal conflicts—particularly his struggle between the obligation to avenge his father and his philosophical questioning of that obligation—define his character and ultimately lead to his tragic fate.

From the moment the Ghost reveals that King Hamlet was murdered by his own brother Claudius, the young prince is thrust into an impossible position. He is commanded to "revenge his foul and most unnatural murder" (1.5.25), yet everything in Hamlet's nature resists the straightforward path of violent retribution. Unlike Laertes, who later rushes to avenge his own father's death without hesitation, Hamlet thinks—perhaps too much. As he himself acknowledges, "the native hue of resolution / Is sicklied o'er with the pale cast of thought" (3.1.84-85). This tendency toward over-analysis becomes both his defining characteristic and his fatal flaw.

The conflict between thought and action manifests most clearly in Hamlet's famous soliloquies. In "To be, or not to be," he contemplates not just suicide but the fundamental question of whether action is worthwhile in a world so full of suffering and injustice. The speech reveals a mind paralyzed by awareness of life's complexities. Hamlet recognizes that death might offer relief from "the heartache and the thousand natural shocks / That flesh is heir to" (3.1.62-63), yet he fears the unknown that lies beyond. This same fear of uncertainty extends to his revenge mission: how can he act decisively when he cannot be certain of anything, even the Ghost's truthfulness?

Shakespeare deepens this conflict through the play-within-a-play, where Hamlet attempts to use theatrical performance to confirm Claudius's guilt. This elaborate scheme reveals much about Hamlet's character. Rather than trusting the Ghost and acting immediately, he requires empirical proof. "The play's the thing / Wherein I'll catch the conscience of the King" (2.2.604-605), he declares, turning to art and intellect rather than the sword. When the scheme succeeds and Claudius reveals his guilt, Hamlet still hesitates—most notably in the prayer scene, where he has the perfect opportunity to kill his uncle but convinces himself to wait for a moment when Claudius's soul will be damned.

Hamlet's internal conflicts are further complicated by his relationships, particularly with his mother Gertrude and with Ophelia. His disgust at Gertrude's hasty remarriage—"O, most wicked speed, to post / With such dexterity to incestuous sheets!" (1.2.156-157)—colors his view of all women and human nature generally. His treatment of Ophelia, oscillating between genuine affection and cruel rejection, demonstrates how his psychological turmoil has corroded his capacity for love and trust. These personal conflicts interweave with his revenge mission, creating a complex web of competing emotions and obligations.

The resolution of Hamlet's conflicts, such as it is, comes only in the final act. After his journey to England and his encounter with the pirates, Hamlet seems to achieve a kind of peace. He speaks of "a divinity that shapes our ends, / Rough-hew them how we will" (5.2.10-11), suggesting an acceptance of fate that was previously foreign to his questioning nature. When the opportunity for revenge finally comes, in the chaos of the poisoned sword and cup, Hamlet acts swiftly and decisively. Yet this resolution is tragic precisely because it requires Hamlet's own death. He can only escape his paralysis by escaping life itself.

In conclusion, Hamlet's internal conflicts make him one of literature's most compelling and human characters. His struggle between the demands of revenge and the promptings of his philosophical nature speaks to universal questions about action, morality, and the difficulty of knowing anything with certainty. Shakespeare does not offer easy answers; instead, he presents a character whose very complexity prevents simple resolution. Hamlet's tragedy is that of the thinking person in a world that demands action, and his story continues to resonate because that conflict remains as relevant today as it was in Renaissance Denmark.

Works Cited

Shakespeare, William. Hamlet. Edited by Barbara A. Mowat and Paul Werstine, Simon & Schuster, 2012.`,
      },
    ]
  : [];

export function getSampleEssays(): SampleEssay[] {
  return sampleEssays;
}

export function getSampleEssayById(id: string): SampleEssay | undefined {
  return sampleEssays.find(essay => essay.id === id);
}
