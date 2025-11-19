#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import random
import logging
import yaml
import datetime
from typing import Dict, List, Any, Optional
from crewai import Agent, Task, Crew
from crewai_tools import SerperDevTool, ScrapeWebsiteTool
from serpapi.google_search import GoogleSearch
from crewai.tools import BaseTool
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('jeopardy_game')

# Constants
QUESTION_VALUES = [200, 400, 600, 800, 1000]
DEFAULT_CATEGORIES = 5
QUESTIONS_PER_CATEGORY = 5

# Initialize tools
search_tool = SerperDevTool()
ddg_search_tool = ScrapeWebsiteTool()

class GoogleImageSearch(BaseTool):
    name: str = "Google Image Search Tool"
    description: str = "Searches Google Images and returns a list of image URLs based on a query."

    def _run(self, query: str, per_page: int = 5) -> List[str]:
        params = {
            "engine": "google_images",
            "q": query,
            "api_key": os.getenv("SERPER_API_KEY"),
            "google_domain": "google.com",
            "hl": "en",
            "gl": "us",
            "num": per_page
        }

        try:
            search = GoogleSearch(params)
            results = search.get_dict()
            image_results = results.get("images_results", [])
            image_urls = [img.get("original") for img in image_results if img.get("original")]
            return image_urls[:per_page]
        except Exception as e:
            print(f"Image search error: {str(e)}")
            return []

image_tool = GoogleImageSearch()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('jeopardy_agents')

class JeopardyGame:
    """Main class for generating Jeopardy game data."""
    
    def __init__(self, theme: str, num_boards: int = 1):
        """Initialize the Jeopardy game generator.
        
        Args:
            theme: The theme for the Jeopardy game
            num_boards: Number of game boards to generate (default: 1)
        """
        self.theme = theme
        self.num_boards = num_boards
        self.boards = []
        self.setup_agents()
        logger.info(f"Initialized Jeopardy game with theme: {theme}")

    def setup_agents(self):
        # Define YAML structure for category generation
        category_yaml_example = """categories:
  - "CATEGORY 1"
  - "CATEGORY 2"
  - "CATEGORY 3"
  - "CATEGORY 4"
  - "CATEGORY 5"
"""

        # Define YAML structure for question generation
        question_yaml_example = """questions:
  - clue: "This is a sample clue for a 200-point question?"
    response: "What is the sample answer?"
    value: 200
    image: null
  - clue: "This is a sample clue for a 400-point question?"
    response: "What is the sample answer?"
    value: 400
    image: null
  - clue: "This is a sample clue for a 600-point question?"
    response: "What is the sample answer?"
    value: 600
    image: null
  - clue: "This is a sample clue for an 800-point question?"
    response: "What is the sample answer?"
    value: 800
    image: "https://example.com/sample.jpg"
  - clue: "This is a sample clue for a 1000-point question?"
    response: "What is the sample answer?"
    value: 1000
    image: "https://example.com/sample2.jpg"
"""

        # Category Planner Agent
        self.category_planner = Agent(
            role="Category Planner",
            goal="Create engaging Jeopardy categories",
            backstory=(
                "You are an expert at creating fun, challenging Jeopardy categories that cover a wide range of topics. "
                "Your categories are creative, diverse, and cover different aspects of the given theme. "
                "You always return exactly 5 categories in the specified JSON format."
            ),
            verbose=True,
            allow_delegation=False,
            tools=[search_tool],
            logger=logger,
            response_format={
                "type": "yaml",
                "example": category_yaml_example,
                "description": "YAML format with a 'categories' key containing a list of 5 category names in ALL CAPS"
            }
        )

        # Question Crafter Agent
        self.question_crafter = Agent(
            role="Question Crafter",
            goal="Create accurate and challenging Jeopardy questions",
            backstory=(
                "You are an expert at creating high-quality Jeopardy-style questions with clear, factual answers. "
                "Your questions are engaging, well-researched, and increase in difficulty from 200 to 1000 points. "
                "You always return exactly 5 questions per category in the specified JSON format."
            ),
            verbose=True,
            allow_delegation=False,
            tools=[search_tool, ddg_search_tool, image_tool],
            logger=logger,
            response_format={
                "type": "yaml",
                "example": question_yaml_example,
                "description": "YAML format with a 'questions' key containing a list of 5 question objects with 'clue', 'response', 'value', and optional 'image' fields"
            }
        )

        # Game Assembler Agent
        self.game_assembler = Agent(
            role="Game Assembler",
            goal="Format game data into proper structure",
            backstory=(
                "You organize Jeopardy games into the proper format for the game board. "
                "You ensure all required fields are present and properly formatted."
            ),
            verbose=True,
            allow_delegation=False,
            logger=logger
        )

    def generate_game(self) -> Dict[str, Any]:
        """Generate a complete Jeopardy game."""
        for board_num in range(self.num_boards):
            print(f"Generating board {board_num + 1} of {self.num_boards}...")
            
            # Generate categories
            categories = self.generate_categories(board_num)
            
            # Generate questions for each category
            category_questions = self.generate_questions(categories)
            
            # Assemble the game board
            game_board = self.assemble_game(categories, category_questions, board_num)
            
            # Select Daily Doubles
            game_board = self.select_daily_double(game_board)
            
            self.boards.append(game_board)

        return {
            "theme": self.theme,
            "boards": self.boards
        }

    def generate_categories(self, board_num: int) -> List[str]:
        """Generate themed categories with structured output and fallback."""
        categories_task = Task(
            description=(
                f"Create 5 Jeopardy categories for the theme: '{self.theme}' (Board #{board_num + 1}).\n"
                "## CRITICAL INSTRUCTIONS FOR YAML FORMATTING:\n"
                "1. You MUST respond with ONLY valid YAML, starting with 'categories:' on the first line\n"
                "2. The YAML must be properly indented with 2 spaces\n"
                "3. Category names must be in double quotes\n"
                "4. Do not include any markdown formatting like ```yaml or ```\n\n"
                "## Requirements:\n"
                "1. Create exactly 5 distinct categories that are broad enough for 5 questions each\n"
                "2. Categories should be diverse and cover different aspects of the theme\n"
                "3. Each category should be 1-3 words long, in ALL CAPS, and clearly indicate the topic\n"
                "4. Categories should be ordered from most general to most specific\n\n"
                "## Example Output (for theme 'HISTORY'):\n"
                'categories:\n'
                '  - "ANCIENT CIVILIZATIONS"\n'
                '  - "MEDIEVAL TIMES"\n'
                '  - "WORLD WARS"\n'
                '  - "AMERICAN PRESIDENTS"\n'
                '  - "SCIENTIFIC DISCOVERIES"'
            ),
            agent=self.category_planner,
            expected_output=(
                "A YAML document with a 'categories' key containing a list of 5 category names. "
                "Each category should be 1-3 words, in ALL CAPS, and clearly indicate the topic. "
                "Use the exact YAML format shown in the example."
            )
        )

        try:
            logger.info(f"Generating categories for board {board_num + 1}...")
            categories_result = self.category_planner.execute_task(categories_task)
            
            # Parse the response
            try:
                # First try direct YAML parse
                try:
                    result = yaml.safe_load(categories_result)
                    if result is None:
                        raise ValueError("Empty YAML content")
                    
                    # If we got a string, try to extract YAML from markdown
                    if isinstance(result, str):
                        yaml_str = self._extract_yaml_from_markdown(categories_result)
                        result = yaml.safe_load(yaml_str)
                        if result is None:
                            raise ValueError("No valid YAML content found after extraction")
                except Exception as e:
                    logger.error(f"Error parsing YAML: {e}")
                    raise ValueError(f"Failed to parse YAML: {str(e)}")
                
                # Extract categories from the structured response
                categories = result.get("categories", [])
                
                # Validate the categories
                if not isinstance(categories, list) or len(categories) != 5:
                    raise ValueError(f"Expected 5 categories, got {len(categories) if isinstance(categories, list) else 'non-list'}")
                
                # Clean and validate each category
                cleaned_categories = []
                for i, category in enumerate(categories, 1):
                    if not isinstance(category, str):
                        category = str(category)
                    # Clean up the category name
                    category = category.strip().upper()
                    if not category:
                        raise ValueError(f"Empty category at position {i}")
                    cleaned_categories.append(category)
                
                logger.info(f"Successfully generated categories: {cleaned_categories}")
                return cleaned_categories
                
            except (ValueError, AttributeError) as e:
                logger.error(f"Error parsing categories: {e}\nRaw response: {categories_result}")
                raise ValueError(f"Failed to parse categories: {str(e)}")
                
        except Exception as e:
            logger.exception(f"Unexpected error generating categories: {str(e)}")
            # Fallback to default categories if generation fails
            fallback = [f"{self.theme.upper()} {i+1}" for i in range(5)]
            logger.warning(f"Using fallback categories: {fallback}")
            return fallback

    def _extract_yaml_from_markdown(self, text: str) -> str:
        """Extract YAML content from markdown code blocks.
        
        Args:
            text: Raw text potentially containing YAML in markdown code blocks
            
        Returns:
            Extracted YAML content as a string
        """
        if not text or not isinstance(text, str):
            return ""
            
        # Remove markdown code block markers
        text = re.sub(r'^```(?:yaml)?\s*', '', text, flags=re.IGNORECASE | re.MULTILINE)
        text = re.sub(r'```$', '', text, flags=re.IGNORECASE | re.MULTILINE)
        text = text.strip()
        
        # Try to extract YAML content between backticks
        if '```' in text:
            parts = [p.strip() for p in text.split('```') if p.strip()]
            if parts:
                parts.sort(key=len, reverse=True)
                for part in parts:
                    if re.search(r'^(categories|questions):', part, re.MULTILINE):
                        return part.strip()
        
        # Return text if it looks like YAML, otherwise clean it up
        if re.search(r'^(categories|questions):', text, re.MULTILINE):
            return text.strip()
            
        # Clean up remaining text
        lines = [
            re.sub(r'`', '', line).strip()
            for line in text.split('\n')
            if line.strip() and not line.startswith(('```', '---', '...'))
        ]
        
        return '\n'.join(lines) if lines else text.strip()

    def _parse_questions_response(self, response_text: str, category: str) -> List[Dict[str, Any]]:
        """Parse and validate the questions response from the agent.
        
        Args:
            response_text: Raw response text from the agent
            category: Category name for error messages
            
        Returns:
            List of validated question dictionaries
            
        Raises:
            ValueError: If the response cannot be parsed or is invalid
        """
        try:
            if not response_text or not isinstance(response_text, str):
                raise ValueError("Empty or invalid response text")
                
            logger.debug(f"Processing response for category: {category}")
            
            # Extract and clean YAML content
            yaml_content = self._extract_yaml_from_markdown(response_text)
            if '```' in yaml_content:
                yaml_content = re.sub(r'```[^`]*```', '', yaml_content, flags=re.DOTALL)
                yaml_content = yaml_content.replace('```', '').strip()
            
            # Parse YAML with fallback to raw text
            result = None
            for attempt in [yaml_content, response_text]:
                try:
                    result = yaml.safe_load(attempt)
                    if result is not None:
                        break
                except yaml.YAMLError:
                    continue
                    
            if result is None:
                yaml_blocks = re.findall(
                    r'(?:^|\n)(categories|questions):[\s\S]*?(?=\n\w+:|\Z)',
                    response_text,
                    re.MULTILINE
                )
                if yaml_blocks:
                    result = yaml.safe_load('\n'.join(yaml_blocks))
            
            if result is None:
                raise ValueError("Could not extract valid YAML from response")
                
            # Extract questions from the response
            questions = []
            if isinstance(result, dict):
                questions = result.get("questions", [])
            elif isinstance(result, list):
                questions = result
                
            if not isinstance(questions, list):
                raise ValueError(f"Expected 'questions' to be a list, got {type(questions).__name__}")
                
            # Validate and clean each question
            validated_questions = []
            seen_values = set()
            
            for q in questions:
                if not isinstance(q, dict):
                    logger.warning(f"Skipping invalid question (not a dict): {q}")
                    continue
                    
                if not all(field in q for field in ["clue", "response", "value"]):
                    logger.warning(f"Skipping incomplete question: {q}")
                    continue
                    
                if q["value"] in seen_values:
                    logger.warning(f"Skipping duplicate value {q['value']} in category {category}")
                    continue
                    
                if q["value"] not in QUESTION_VALUES:
                    logger.warning(f"Skipping invalid value {q['value']} in category {category}")
                    continue
                    
                # Clean up the question
                q["clue"] = q["clue"].strip()
                if not q["clue"].endswith('?'):
                    q["clue"] += "?"
                    
                q["response"] = q["response"].strip()
                if not q["response"].lower().startswith(('what is ', 'what are ')):
                    q["response"] = f"What is {q['response'].strip(' .?')}?"
                    
                q["image"] = q.get("image")
                q["isDailyDouble"] = False
                
                seen_values.add(q["value"])
                validated_questions.append(q)
                
            if not validated_questions:
                raise ValueError("No valid questions found in response")
                
            # Sort questions by value
            validated_questions.sort(key=lambda x: x["value"])
            return validated_questions
                
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error parsing questions for {category}: {e}\nRaw response: {response_text}")
            raise ValueError(f"Failed to parse questions: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error parsing questions: {e}")
            raise

    def generate_questions(self, categories: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """Generate questions for each category with structured output and validation."""
        all_questions = {}
        
        for category in categories:
            try:
                logger.info(f"Generating questions for category: {category}")
                questions_task = Task(
                    description=(
                        f"Create 5 Jeopardy questions for the category: '{category}'\n"
                        f"Theme: {self.theme}\n\n"
                        "## CRITICAL INSTRUCTIONS FOR YAML FORMATTING:\n"
                        "1. You MUST respond with ONLY valid YAML, starting with 'questions:' on the first line\n"
                        "2. The YAML must be properly indented with 2 spaces\n"
                        "3. All strings MUST be in double quotes ("") not single quotes (')\n"
                        "4. Use 'null' (without quotes) for empty image fields\n"
                        "5. Do NOT include any markdown formatting like ```yaml or ```\n\n"
                        "## Requirements:\n"
                        f"1. Questions should relate to both the category '{category}' and the overall theme '{self.theme}'\n"
                        "2. Create exactly 5 questions with increasing difficulty (200, 400, 600, 800, 1000 points)\n"
                        "3. Questions must be in ascending order of value (200, 400, 600, 800, 1000)\n"
                        "4. Each question must have these exact fields:\n"
                        "   - `clue`: The question text (must end with a question mark)\n"
                        "   - `response`: The answer (must start with 'What is' or 'What are')\n"
                        "   - `value`: The point value (must be one of: 200, 400, 600, 800, 1000)\n"
                        "   - `image`: Must be a valid URL or 'null'\n\n"
                        '## Example Output (for category \'WORLD CAPITALS\' and theme \'EUROPEAN GEOGRAPHY\'):\n'
                        'questions:\n'
                        '  - clue: "This European capital is home to the Eiffel Tower."\n'
                        '    response: "What is Paris?"\n'
                        '    value: 200\n'
                        '    image: null\n'
                        '  - clue: "This city on the Tiber River is the capital of Italy and home to the Colosseum."\n'
                        '    response: "What is Rome?"\n'
                        '    value: 400\n'
                        '    image: null\n'
                        '  - clue: "This German city, once divided by a wall, became the capital of a reunified Germany in 1990."\n'
                        '    response: "What is Berlin?"\n'
                        '    value: 600\n'
                        '    image: null\n'
                        '  - clue: "This city, the capital of Spain, is home to the Prado Museum and the Royal Palace."\n'
                        '    response: "What is Madrid?"\n'
                        '    value: 800\n'
                        '    image: "https://example.com/madrid.jpg"\n'
                        '  - clue: "This capital city, located on the Bosphorus Strait, serves as a bridge between Europe and Asia."\n'
                        '    response: "What is Istanbul?"\n'
                        '    value: 1000\n'
                        '    image: "https://example.com/istanbul.jpg"'
                    ),
                    agent=self.question_crafter,
                    expected_output=(
                        "A YAML document with a 'questions' key containing a list of 5 question objects. "
                        "Each question must have 'clue', 'response', and 'value' fields, and an optional 'image' field. "
                        "Values must be 200, 400, 600, 800, or 1000 points in ascending order. "
                        "Use the exact YAML format shown in the example."
                    )
                )

                # Execute the task
                questions_result = self.question_crafter.execute_task(questions_task)
                
                # Parse and validate the response
                try:
                    questions = self._parse_questions_response(questions_result, category)
                    all_questions[category] = questions
                    logger.info(f"Successfully generated {len(questions)} questions for {category}")
                    
                except Exception as e:
                    logger.error(f"Error parsing questions for {category}: {e}")
                    raise
                
            except Exception as e:
                logger.exception(f"Error generating questions for {category}")
                # Generate fallback questions
                fallback_questions = [
                    {
                        "clue": f"This is a sample question for {category} (${value})?",
                        "response": f"What is the sample answer for the ${value} question in {category}?",
                        "value": value,
                        "image": None,
                        "isDailyDouble": False
                    } for value in [200, 400, 600, 800, 1000]
                ]
                all_questions[category] = fallback_questions
                logger.warning(f"Using fallback questions for {category}")

        return all_questions

    def select_daily_double(self, game_board: Dict[str, Any]) -> Dict[str, Any]:
        """Randomly select one question to be a daily double.
        
        Args:
            game_board: The current game board state
            
        Returns:
            Updated game board with a daily double selected
        """
        try:
            all_questions = [
                q for category in game_board.get("questions", {}).values()
                for q in category
                if not q.get("isDailyDouble", False)
            ]
            
            if not all_questions:
                logger.warning("No eligible questions found for Daily Double")
                return game_board
                
            # Weight selection by question value (higher values more likely)
            selected = random.choices(
                all_questions,
                weights=[q["value"] for q in all_questions],
                k=1
            )[0]
            
            selected["isDailyDouble"] = True
            selected["dailyDouble"] = True
            game_board["metadata"]["has_daily_double"] = True
            
            logger.info(f"Selected Daily Double: {selected['question']} (${selected['value']})")
            
        except Exception as e:
            logger.error(f"Error selecting Daily Double: {e}")
        
        return game_board

    def assemble_game(self, categories: List[str], questions: Dict[str, List[Dict[str, Any]]], board_num: int) -> Dict[str, Any]:
        """Assemble the game board with categories and questions.
        
        Args:
            categories: List of category names
            questions: Dictionary mapping categories to lists of questions
            board_num: The board number (0-based)
            
        Returns:
            A dictionary containing the formatted game board
        """
        logger.info(f"Assembling game board {board_num + 1} with {len(categories)} categories")
        
        game_board = {
            "board_number": board_num + 1,
            "theme": self.theme,
            "categories": categories,
            "questions": {},
            "metadata": {
                "generated_at": datetime.datetime.utcnow().isoformat(),
                "total_questions": 0,
                "total_value": 0,
                "has_daily_double": False
            }
        }
        
        formatted_questions = {category: [] for category in categories}
        total_questions = 0
        total_value = 0
        
        for category in categories:
            if category in questions and questions[category]:
                for q in questions[category]:
                    question_obj = {
                        "question": q["clue"],
                        "answer": q["response"],
                        "value": q["value"],
                        "dailyDouble": q.get("isDailyDouble", False),
                        "image": q.get("image")
                    }
                    
                    formatted_questions[category].append(question_obj)
                    total_questions += 1
                    total_value += q["value"]
                    
                    if q.get("isDailyDouble", False):
                        game_board["metadata"]["has_daily_double"] = True
            else:
                # Generate fallback questions for missing categories
                logger.warning(f"No questions generated for category: {category}")
                for value in QUESTION_VALUES:
                    formatted_questions[category].append({
                        "question": f"Sample question for {category} (${value})?",
                        "answer": f"This is a sample answer for the ${value} question in {category}.",
                        "value": value,
                        "dailyDouble": False,
                        "image": None
                    })
                    total_questions += 1
                    total_value += value
        
        # Update game board with results
        game_board["questions"] = formatted_questions
        game_board["metadata"].update({
            "total_questions": total_questions,
            "total_value": total_value
        })
        
        # Add daily double if none exists
        if not game_board["metadata"]["has_daily_double"] and total_questions > 0:
            game_board = self.select_daily_double(game_board)
        
        logger.info(f"Assembled game board with {total_questions} questions (total value: ${total_value})")
        if game_board["metadata"]["has_daily_double"]:
            logger.info("Daily Double is set on this board")
            
        return game_board

    # Removed duplicate select_daily_double method

def create_jeopardy_game(theme: str, num_boards: int = 1, save_to_file: bool = True) -> Dict[str, Any]:
    """Create a Jeopardy game with the given theme and number of boards.
    
    Args:
        theme: The theme for the Jeopardy game
        num_boards: Number of game boards to generate (default: 1)
        save_to_file: Whether to save the game data to a file (default: True)
        
    Returns:
        A dictionary containing the game data or error information
    """
    try:
        # Initialize game with the theme
        game = JeopardyGame(theme, num_boards)
        game_data = game.generate_game()
        
        if save_to_file:
            os.makedirs('game_outputs', exist_ok=True)
            safe_theme = "".join(c if c.isalnum() else "_" for c in theme.lower())
            filename = f"game_outputs/jeopardy_{safe_theme}.yaml"
            
            with open(filename, 'w') as f:
                yaml.dump(game_data, f, default_flow_style=False, sort_keys=False)
            
            logger.info(f"Game data saved to: {os.path.abspath(filename)}")
            
        return game_data
        
    except Exception as e:
        error_msg = f"Error creating game: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "error": error_msg,
            "theme": theme,
            "boards": []
        }

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate Jeopardy game data')
    parser.add_argument('--theme', type=str, required=True, help='Theme for the Jeopardy game')
    parser.add_argument('--num-boards', type=int, default=1, help='Number of game boards to generate')
    
    args = parser.parse_args()
    
    try:
        game = create_jeopardy_game(args.theme, args.num_boards, save_to_file=True)
        print(yaml.dump(game, default_flow_style=False, sort_keys=False))
        print(f"Generated Jeopardy game with theme: {game['theme']}")
        print(f"Number of boards: {len(game['boards'])}")
    except Exception as e:
        logger.exception("Error generating game")
        print(yaml.dump({"error": str(e)}, default_flow_style=False))
        exit(1)