import os
import re
import yaml
import json
import argparse
from typing import List, Dict, Any, Optional
from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class FeudGame:
    """A class to generate Family Feud style games using AI agents."""
    
    def __init__(self, theme: str, num_questions: int = 5, num_agents: int = 10):
        """Initialize the FeudGame with theme and configuration."""
        self.theme = theme
        self.num_questions = num_questions
        self.num_agents = num_agents
        self.agents = []
        self.personalities = []
        
        # Initialize OpenAI API key
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

    def generate_personalities(self) -> List[Dict[str, Any]]:
        """Generate diverse personalities for AI agents."""
        print("Generating personalities...")
        personality_agent = Agent(
            role="Personality Creator",
            goal="Create diverse and realistic personality profiles",
            backstory="You are an expert at creating diverse character profiles with unique backgrounds and perspectives.",
            verbose=True
        )
        
        task = Task(
            description=f"""Create {self.num_agents} diverse personality profiles for our survey respondents.
            Each profile should include:
            - name: Full name
            - age: Integer between 18-80
            - occupation: Job or role
            - background: 1-2 sentence background
            - traits: 2-3 personality traits
            - perspective: 1 sentence about their worldview
            
            Make sure the profiles are diverse in:
            - Age groups (young adults to seniors)
            - Professions
            - Backgrounds
            - Perspectives
            
            Return ONLY a valid JSON array of objects, no other text.
            """,
            agent=personality_agent,
            expected_output=f"A JSON array of {self.num_agents} personality profiles"
        )
        
        crew = Crew(
            agents=[personality_agent],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            # Clean and parse the JSON response
            result = str(result)
            result = result.strip()
            if '```json' in result:
                result = result.split('```json')[1].split('```')[0].strip()
            return json.loads(result)
        except Exception as e:
            print(f"Error generating personalities: {e}")
            return []

    def generate_questions_batch(self) -> List[str]:
        """Generate all survey questions in a single API call."""
        print("Generating questions...")
        question_agent = Agent(
            role="Survey Question Expert",
            goal=f"Create engaging Family Feud style questions about {self.theme}",
            backstory="You are a professional game show writer who creates fun, engaging questions.",
            verbose=True
        )
        
        task = Task(
            description=f"""Generate exactly {self.num_questions} unique, opinion-based survey questions about {self.theme}.
            
            RULES:
            1. Each question should be opinion-based, not factual
            2. Questions should have multiple possible valid answers
            3. Each answer should be 1-3 words
            4. Questions should be fun and engaging for a game show audience
            5. Each question must end with a question mark
            6. Avoid questions with single correct answers
            7. Return each question on a new line with no numbering
            
            GOOD EXAMPLES:
            What's your favorite type of music to dance to?
            What's the most overrated movie of all time?
            What's the best way to spend a rainy day?
            What's the most underrated food?
            
            BAD EXAMPLES (avoid these):
            What's the capital of France? (factual)
            Who won Best Picture in 2020? (factual)
            What's 2 + 2? (factual)
            
            YOUR {self.num_questions} OPINION-BASED QUESTIONS:
            """,
            agent=question_agent,
            expected_output=f"Exactly {self.num_questions} opinion-based questions, one per line"
        )
        
        crew = Crew(
            agents=[question_agent],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            result = str(result).strip()
            return [q.strip() for q in result.split('\n') if q.strip().endswith('?')]
        except Exception as e:
            print(f"Error generating questions: {e}")
            return []

    def _generate_additional_answers(self, question: str, existing_answers: List[str], count: int) -> List[str]:
        """Generate additional answers to ensure we have enough unique answers."""
        try:
            answer_agent = Agent(
                role="Answer Generator",
                goal="Generate unique and relevant answers for survey questions",
                backstory="You are an expert at coming up with diverse and relevant answers for survey questions.",
                verbose=True
            )
            
            existing_str = "\n".join([f"- {ans}" for ans in existing_answers])
            
            task = Task(
                description=f"""Generate {count} additional unique answers to this question:
                
                QUESTION: {question}
                
                EXISTING ANSWERS (do not repeat these):
                {existing_str}
                
                RULES:
                1. Each answer must be 1-3 words
                2. Must be different from all existing answers
                3. Should be plausible and relevant to the question
                4. Return only the answers, one per line
                """,
                agent=answer_agent,
                expected_output=f"{count} unique answers, one per line"
            )
            
            crew = Crew(
                agents=[answer_agent],
                tasks=[task],
                process=Process.sequential,
                verbose=False
            )
            
            result = crew.kickoff()
            new_answers = [a.strip() for a in str(result).split('\n') if a.strip()]
            return new_answers[:count]  # Return only the requested number of answers
            
        except Exception as e:
            print(f"Error generating additional answers: {e}")
            return []
    
    def _get_agent_answers(self, agent: Agent, questions: List[str]) -> List[str]:
        """Get answers from a single agent for all questions."""
        try:
            print(f"\n=== Getting answers from agent: {agent.role} ===")
            questions_text = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
            print(f"Questions:\n{questions_text}")
            
            task = Task(
                description=f"""You are participating in a Family Feud style game show.
    Answer each of the following questions with 1-3 words. 
    Return ONLY the answers, one per line, in order.

    {questions_text}

    YOUR ANSWERS (one per line, 1-3 words each):
    1. [Your answer to question 1]
    2. [Your answer to question 2]""",
                agent=agent,
                expected_output=f"{len(questions)} answers, one per line"
            )
            
            print("Creating crew...")
            crew = Crew(
                agents=[agent],
                tasks=[task],
                process=Process.sequential,
                verbose=True  # Set to True to see more detailed output
            )
            
            print("Kicking off crew...")
            result = crew.kickoff()
            print(f"Raw result: {result}")
            
            answers = [a.strip() for a in str(result).split('\n') if a.strip()][:len(questions)]
            print(f"Processed answers: {answers}")
            return answers
            
        except Exception as e:
            print(f"Error getting answers from {agent.role}: {str(e)}")
            import traceback
            traceback.print_exc()
            return [''] * len(questions)

    def collect_answers(self, questions: List[str]) -> List[Dict[str, Any]]:
        """Collect and process answers for all questions from all agents."""
        if not questions:
            return []
            
        questions_with_answers = []
        
        # Process each agent one at a time
        for agent in self.agents:
            try:
                answers = self._get_agent_answers(agent, questions)
                for i, answer in enumerate(answers):
                    if i >= len(questions_with_answers):
                        questions_with_answers.append({
                            'id': i + 1,
                            'question': questions[i],
                            'answers': []
                        })
                    if answer:
                        questions_with_answers[i]['answers'].append(answer.lower().strip())
            except Exception as e:
                print(f"Error processing answers from {agent.role}: {str(e)}")
        
        # Process answer counts and ensure we have 10 answers per question
        for q in questions_with_answers:
            answer_counts = {}
            for ans in q['answers']:
                if ans:
                    answer_counts[ans] = answer_counts.get(ans, 0) + 1
            
            # Sort by frequency and take top answers
            sorted_answers = sorted(
                answer_counts.items(),
                key=lambda x: (-x[1], x[0])
            )
            
            # Get the answers we have
            top_answers = [{'answer': ans, 'count': count} for ans, count in sorted_answers]
            
            # If we don't have enough answers, generate more
            if len(top_answers) < 10:
                existing_answers = [a['answer'] for a in top_answers]
                needed = 10 - len(top_answers)
                print(f"\n=== Generating {needed} additional answers for: {q['question']}")
                
                # Generate additional answers
                additional = self._generate_additional_answers(
                    q['question'],
                    existing_answers,
                    needed * 2  # Generate extra in case some are duplicates
                )
                
                # Add new answers with count=1
                for ans in additional:
                    if len(top_answers) >= 10:
                        break
                    if ans.lower() not in [a.lower() for a in existing_answers]:
                        top_answers.append({'answer': ans, 'count': 1})
                        existing_answers.append(ans)
            
            # Ensure we have exactly 10 answers
            q['answers'] = top_answers[:10]
        
        return questions_with_answers

    def generate_game(self) -> Dict[str, Any]:
        """Generate a complete Feud game."""
        print(f"Generating Family Feud game with theme: {self.theme}")
        
        # Generate personalities and create agents
        self.personalities = self.generate_personalities()
        if not self.personalities:
            raise ValueError("Failed to generate personalities")
        
        print(f"\n=== Creating {len(self.personalities)} agents ===")
        # Create agents from personalities
        self.agents = []
        for i, p in enumerate(self.personalities):
            print(f"Creating agent {i+1}: {p.get('name', 'Unknown')} ({p.get('occupation', 'No occupation')})")
            agent = Agent(
                name=p.get('name', f"Respondent_{i+1}"),
                role=f"Survey Respondent: {p.get('occupation', 'General')}",
                goal=f"Answer questions from the perspective of a {p.get('age', '30')} year old {p.get('occupation', 'person').lower()}",
                backstory=p.get('background', 'No background provided'),
                verbose=True  # Enable verbose for agent
            )
            self.agents.append(agent)
        
        # Generate questions
        print("\n=== Generating questions ===")
        questions = self.generate_questions_batch()
        if not questions:
            raise ValueError("Failed to generate questions")
        print(f"Generated questions: {questions}")
        
        # Collect and process answers
        print("\n=== Collecting answers ===")
        questions_with_answers = self.collect_answers(questions)
        print("\n=== Answer collection complete ===")
        
        return {
            'theme': self.theme,
            'questions': questions_with_answers
        }

def main():
    parser = argparse.ArgumentParser(description='Generate Family Feud style questions and answers.')
    parser.add_argument('--theme', type=str, required=True, help='Theme for the game')
    parser.add_argument('--num-questions', type=int, default=5, help='Number of questions to generate')
    parser.add_argument('--num-agents', type=int, default=10, help='Number of agents to survey')
    parser.add_argument('--output', type=str, help='Output YAML file path')
    
    args = parser.parse_args()
    
    try:
        game = FeudGame(
            theme=args.theme,
            num_questions=args.num_questions,
            num_agents=args.num_agents
        )
        
        result = game.generate_game()
        
        # Output to file or print to console
        if args.output:
            with open(args.output, 'w') as f:
                yaml.dump(result, f, default_flow_style=False)
            print(f"Game saved to {args.output}")
        else:
            print(yaml.dump(result, default_flow_style=False))
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())