# backend/app/api/v1/endpoints/jeopardy.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any, Optional
import yaml
import json
import logging
import tempfile
import os
import datetime
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('jeopardy_game')
logger.setLevel(logging.INFO)


router = APIRouter()

def transform_jeopardy_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform Jeopardy data into frontend-compatible format.
    
    Args:
        data: Dictionary containing the game data with 'boards' key
        
    Returns:
        Dictionary with the transformed data
    """
    # Initialize the result structure
    result = {
        'categories': [],
        'questions': {}
    }
    
    # Process each board (though typically there's only one)
    for board in data.get('boards', []):
        categories = board.get('categories', [])
        questions = board.get('questions', {})
        
        # Add categories to the result
        result['categories'] = categories
        
        # Process questions for each category
        for category in categories:
            if category in questions:
                result['questions'][category] = []
                for q in questions[category]:
                    # Transform question format to match frontend expectations
                    transformed_q = {
                        'question': q.get('question', q.get('clue', '')),
                        'answer': q.get('answer', q.get('response', '')),
                        'value': q.get('value', 200),  # Default to 200 if not specified
                        'dailyDouble': q.get('dailyDouble', q.get('isDailyDouble', False)),
                        'image': q.get('image'),
                        'isRevealed': False,
                        'isAnswered': False
                    }
                    # Remove None values
                    transformed_q = {k: v for k, v in transformed_q.items() if v is not None}
                    result['questions'][category].append(transformed_q)
    
    return result

class JeopardyRequest(BaseModel):
    theme: str
    num_boards: int = 1

@router.post("/generate")
async def generate_jeopardy(request: JeopardyRequest):
    """
    Generate a new Jeopardy game with the specified theme.
    
    Args:
        request: JeopardyRequest containing theme and number of boards
        
    Returns:
        Dictionary with categories and questions in frontend-compatible format
    """
    try:
        script_path = Path(__file__).parent.parent.parent.parent.parent / "trivai_jeopardy.py"
        
        if not script_path.exists():
            error_msg = f"Script not found at {script_path}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        logger.info(f"Starting game generation with theme: {request.theme}")
        
        # Set up output directory
        output_dir = script_path.parent / "game_outputs"
        output_dir.mkdir(exist_ok=True)
        safe_theme = "".join(c if c.isalnum() else "_" for c in request.theme.lower())
        output_file = output_dir / f"jeopardy_{safe_theme}.yaml"
        
        try:
            # Run the jeopardy generation script
            cmd = [
                str(script_path),
                "--theme", request.theme,
                "--num-boards", "1",
            ]
            
            logger.info(f"Executing command: {' '.join(cmd)}")
            
            # Run the command and capture output
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(script_path.parent)
            )
            
            stdout, stderr = process.communicate()
            
            logger.info(f"Process completed with return code: {process.returncode}")
            logger.debug(f"=== STDOUT ===\n{stdout}")
            
            if stderr:
                logger.error(f"=== STDERR ===\n{stderr}")
            
            if process.returncode != 0:
                error_msg = f"Script failed with error: {stderr or 'Unknown error'}"
                logger.error(error_msg)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate questions: {error_msg}"
                )
            
            # Read the generated YAML file
            with open(output_file, 'r') as f:
                game_data = yaml.safe_load(f)
            
            # Transform the data to frontend-compatible format
            transformed_data = transform_jeopardy_data(game_data)
            
            logger.info(f"Successfully generated game with {len(transformed_data['categories'])} categories")
            return transformed_data
            
        except yaml.YAMLError as e:
            logger.error(f"Failed to parse YAML output: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse game data: {str(e)}"
            )
            
        except Exception as e:
            logger.error(f"Error generating game: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while generating the game: {str(e)}"
            )
            
        except Exception as e:
            logger.error(f"Error generating game: {str(e)}", exc_info=True)
            # Don't delete the output file if there was an error, as it might be useful for debugging
            if output_file.exists():
                logger.info(f"Game data saved to {output_file} for debugging")
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while generating the game: {str(e)}"
            )
                
    except Exception as e:
        logger.exception("Unexpected error in generate_jeopardy")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}. Check server logs for details."
        )