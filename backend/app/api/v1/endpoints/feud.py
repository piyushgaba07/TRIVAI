import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
import os
import sys
import re
import yaml
from typing import Optional
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import the FeudGame class
from trivai_feud import FeudGame

logger = logging.getLogger(__name__)
router = APIRouter()

from pydantic import Field

script_path = Path(__file__).parent.parent.parent.parent.parent / "trivai_feud.py"

class FeudRequest(BaseModel):
    theme: str
    num_questions: int = Field(default=4, ge=1, le=10, description="Number of questions to generate (1-10)")
    

@router.post("/generate", response_model=Dict[str, Any])
async def generate_feud_game(request: FeudRequest):
    save_to_file = True
    """
    Generate a Family Feud style game with the given theme.
    """
    try:
        # Create and configure the game
        game = FeudGame(
            theme=request.theme,
            num_questions=request.num_questions,
        )
        
        # Generate the game data
        game_data = game.generate_game()
        
        # Transform the data to match the frontend format
        transformed_data = transform_feud_data(game_data)

        output_dir = f"{script_path.parent}/game_outputs"

        if save_to_file:
            try:
                # Create safe filename from theme
                safe_theme = re.sub(r'[^a-zA-Z0-9_]', '_', request.theme.lower())
                filename = f"{safe_theme}_feud.yaml"
                
                # Ensure output directory exists
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, filename)
                
                # Save to file
                with open(output_path, 'w') as f:
                    yaml.dump(transformed_data, f, default_flow_style=False)
                
                logger.info(f"Game saved to {output_path}")
                # Include the file path in the response
                
            except Exception as e:
                logger.error(f"Error saving to file: {str(e)}")
                # Don't fail the request if file save fails
                transformed_data['save_error'] = str(e)
        
        
        return transformed_data
        
    except Exception as e:
        error_msg = f"Error generating Feud game: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def transform_feud_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform Feud data to match frontend format."""
    questions = []
    for i, q in enumerate(data.get('questions', [])):
        answers = []
        points = []
        for j, ans in enumerate(q.get('answers', [])):
            answers.append(ans.get('answer', '').title())  # Title case for consistency
            # Calculate points based on count (higher points for more common answers)
            points.append(ans.get('count', 0) * 10)  # Scale points for better game balance
        
        questions.append({
            'id': q.get('id', i + 1),
            'question': q.get('question', ''),
            'answers': answers,
            'points': points
        })
    
    return {
        'theme': data.get('theme', 'General Knowledge'),
        'questions': questions
    }