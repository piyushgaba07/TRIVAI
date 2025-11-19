# app/api/v1/endpoints/connections.py
import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import the ConnectionsGame class
from trivai_connections import generate_connections_game

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionsRequest(BaseModel):
    theme: str
    num_groups: int = Field(default=4, ge=1, le=6, description="Number of groups to generate (1-6)")
    items_per_group: int = Field(default=4, ge=3, le=5, description="Number of items per group (3-5)")

@router.post("/generate", response_model=Dict[str, Any])
async def generate_connections_game_endpoint(request: ConnectionsRequest):
    """
    Generate a Connections style game with the given theme.
    """
    try:
        # Generate the game data
        game_data = generate_connections_game(
            theme=request.theme,
            num_groups=request.num_groups,
            items_per_group=request.items_per_group
        )
        
        return {
            "status": "success",
            "data": game_data
        }
        
    except Exception as e:
        logger.error(f"Error generating Connections game: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate Connections game: {str(e)}"
        )