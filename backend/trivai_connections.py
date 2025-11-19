import os
import json
from typing import List, Dict, Any
from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel
from dotenv import load_dotenv
from enum import Enum
import random

load_dotenv()

class Difficulty(str, Enum):
    COMMON = "common"
    TRICKY = "tricky"
    CONFUSING = "confusing"
    OBSCURE = "obscure"

class ConnectionsGroup(BaseModel):
    category: str
    items: List[str]
    difficulty: Difficulty

class ConnectionsGame:
    """A class to generate Connections style games using AI agents."""
    
    def __init__(self, theme: str):
        """Initialize the ConnectionsGame with theme and configuration."""
        self.theme = theme
        self.num_groups = 4
        self.items_per_group = 4
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

    def generate_groups(self) -> List[ConnectionsGroup]:
        """Generate groups of connected items for the game."""
        print("Generating connections groups...")
        
        # Generate the categories and items
        categories_agent = Agent(
            role="Category Generator",
            goal=f"Create {self.num_groups} interesting categories for a connections game about {self.theme}",
            backstory="You are a creative game designer who creates engaging categories for word games.",
            verbose=True
        )
        
        categories_task = Task(
            description=f"""Create {self.num_groups} unique and interesting categories for a connections game about {self.theme}.
            
            RULES:
            1. Each category must have exactly {self.items_per_group} items
            2. Categories should be of varying difficulty levels
            3. Categories should be related to the theme: {self.theme}
            4. For each category, provide:
               - A clear, concise category name
               - A difficulty level (common, tricky, confusing, or obscure)
               - Exactly {self.items_per_group} items that fit the category
            
            Return ONLY a valid JSON array of objects with this structure:
            [
                {{
                    "category": "Category Name",
                    "difficulty": "common|tricky|confusing|obscure",
                    "items": ["Item 1", "Item 2", "Item 3", "Item 4"]
                }}, ...
            ]""",
            agent=categories_agent,
            expected_output=f"A JSON array of {self.num_groups} category objects"
        )
        
        crew = Crew(
            agents=[categories_agent],
            tasks=[categories_task],
            process=Process.sequential,
            verbose=True
        )
        
        try:
            result = crew.kickoff()
            # Clean and parse the JSON response
            result = str(result).strip()
            if '```json' in result:
                result = result.split('```json')[1].split('```')[0].strip()
            elif '```' in result:
                result = result.split('```')[1].strip()
                if result.startswith('json'):
                    result = result[4:].strip()
            
            categories_data = json.loads(result)
            
            # Convert to ConnectionsGroup objects
            groups = []
            for cat_data in categories_data:
                # Take exactly the requested number of items
                items = cat_data['items'][:self.items_per_group]
                
                groups.append(ConnectionsGroup(
                    category=cat_data['category'],
                    items=items,
                    difficulty=Difficulty(cat_data.get('difficulty', 'common').lower())
                ))
            
            return groups
            
        except Exception as e:
            print(f"Error generating categories: {e}")
            # Return some default groups if generation fails
            return self._get_default_groups()
    
    def _get_default_groups(self) -> List[ConnectionsGroup]:
        """Return some default groups if AI generation fails."""
        return [
            ConnectionsGroup(
                category=f"{self.theme} Colors",
                items=["Red", "Blue", "Green", "Yellow"],
                difficulty=Difficulty.COMMON
            ),
            ConnectionsGroup(
                category=f"{self.theme} Animals",
                items=["Lion", "Tiger", "Bear", "Wolf"],
                difficulty=Difficulty.TRICKY
            ),
            ConnectionsGroup(
                category=f"{self.theme} Sports",
                items=["Soccer", "Basketball", "Tennis", "Golf"],
                difficulty=Difficulty.CONFUSING
            ),
            ConnectionsGroup(
                category=f"{self.theme} Professions",
                items=["Doctor", "Teacher", "Engineer", "Artist"],
                difficulty=Difficulty.OBSCURE
            )
        ][:self.num_groups]

def generate_connections_game(theme: str = "general", num_groups: int = 4, items_per_group: int = 4) -> dict:
    game = ConnectionsGame(theme)
    groups = game.generate_groups()
    
    # Convert to the format expected by the frontend
    return {
        "groups": [
            {
                "category": group.category,
                "items": group.items,
                "difficulty": group.difficulty.value
            }
            for group in groups
        ]
    }

if __name__ == "__main__":
    # Example usage
    game_data = generate_connections_game()
    print("\nGenerated Connections Game:")
    print(json.dumps(game_data, indent=2))