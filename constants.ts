import { ScoringCriteria, ScoreRange, RiskLevel } from './types';

export const NCI_CRITERIA: ScoringCriteria[] = [
  { id: 1, category: "Timing", question: "Does the timing feel suspicious or coincidental with other events?", example: "A story about water contamination surfaces during a corporate scandal." },
  { id: 2, category: "Emotional Manipulation", question: "Does it provoke fear, outrage, or guilt without solid evidence?", example: "Reports show crying children and dying wildlife but avoid causes." },
  { id: 3, category: "Uniform Messaging", question: "Are key phrases or ideas repeated across media?", example: "All outlets use terms like “unprecedented” and “avoidable tragedy.”" },
  { id: 4, category: "Missing Information", question: "Are alternative views or critical details excluded?", example: "Few sources discuss the timeline or other possible contributors." },
  { id: 5, category: "Simplistic Narratives", question: "Is the story reduced to “good vs. evil” frameworks?", example: "Blames one company entirely while ignoring systemic issues." },
  { id: 6, category: "Tribal Division", question: "Does it create an “us vs. them” dynamic?", example: "Locals are victims, while outsiders are blamed." },
  { id: 7, category: "Authority Overload", question: "Are questionable “experts” driving the narrative?", example: "Non-environmental experts dominate airtime to support policies." },
  { id: 8, category: "Call for Urgent Action", question: "Does it demand immediate decisions without reflection?", example: "Campaigns push for immediate donations and rapid policy changes." },
  { id: 9, category: "Overuse of Novelty", question: "Is the event framed as shocking or unprecedented?", example: "Media emphasizes how “shocking” and “once-in-a-lifetime” the crisis is." },
  { id: 10, category: "Financial/Political Gain", question: "Do powerful groups benefit disproportionately?", example: "A company offering cleanup services lobbies for government contracts." },
  { id: 11, category: "Suppression of Dissent", question: "Are critics silenced or labeled negatively?", example: "Opponents dismissed as “deniers” or ignored." },
  { id: 12, category: "False Dilemmas", question: "Are only two extreme options presented?", example: "“Either you support this policy, or you don’t care about the environment.”" },
  { id: 13, category: "Bandwagon Effect", question: "Is there pressure to conform because “everyone is doing it”?", example: "Social media influencers post identical hashtags, urging followers to join in." },
  { id: 14, category: "Emotional Repetition", question: "Are the same emotional triggers repeated excessively?", example: "Destruction and suffering imagery looped endlessly on TV and online." },
  { id: 15, category: "Cherry-Picked Data", question: "Are statistics presented selectively or out of context?", example: "Dramatic figures shared without explaining how they were calculated." },
  { id: 16, category: "Logical Fallacies", question: "Are flawed arguments used to dismiss critics?", example: "Critics labeled “out-of-touch elites” without addressing their points." },
  { id: 17, category: "Manufactured Outrage", question: "Does outrage seem sudden or disconnected from facts?", example: "Viral memes escalate anger quickly with little context provided." },
  { id: 18, category: "Framing Techniques", question: "Is the story shaped to control how you perceive it?", example: "The crisis is framed as entirely preventable, ignoring systemic factors." },
  { id: 19, category: "Rapid Behavior Shifts", question: "Are groups adopting symbols or actions without clear reasoning?", example: "Social media suddenly fills with users adding water droplet emojis to their profiles." },
  { id: 20, category: "Historical Parallels", question: "Does the story mirror manipulative past events?", example: "Past environmental crises were similarly used to pass sweeping, controversial legislation." },
];

export const SCORE_RANGES: ScoreRange[] = [
  { min: 0, max: 25, level: RiskLevel.LOW, color: "#10B981" }, // Emerald
  { min: 26, max: 50, level: RiskLevel.MODERATE, color: "#F59E0B" }, // Amber
  { min: 51, max: 75, level: RiskLevel.HIGH, color: "#F97316" }, // Orange
  { min: 76, max: 100, level: RiskLevel.EXTREME, color: "#EF4444" }, // Red
];