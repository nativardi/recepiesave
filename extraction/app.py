# Description: Flask API server for multi-platform video audio downloader
# Supports Instagram Reels, TikTok, and YouTube Shorts
# Main application file with /download endpoint, error handling, and frontend serving

import os
import sys

# Fix for macOS fork() issue with RQ - MUST be set before any imports
# This prevents crashes when RQ forks worker processes on macOS
if sys.platform == 'darwin':  # macOS
    os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

import logging
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from utils.url_parser import extract_reel_id, validate_reel_url
from legacy_routes import create_legacy_blueprint
from utils.audio_processor import process_video_to_audio
from utils.platform_router import PlatformRouter
from utils.platform_detector import detect_platform, Platform
from utils.job_queue import enqueue_job, get_job_status as get_rq_job_status
from utils.job_models import create_job, get_job_result_data
from utils.job_processor import process_audio_job

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize platform router for multi-platform support
platform_router = PlatformRouter()

# Register legacy synchronous endpoints for testing
app.register_blueprint(create_legacy_blueprint(platform_router))


@app.route('/')
def index():
    """Serve the main frontend page."""
    return render_template('index.html')


def not_found_handler(e):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error_handler(e):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {e}", exc_info=True)
    return jsonify({'error': 'Internal server error. Please try again later.'}), 500


@app.route('/jobs/create', methods=['POST'])
def create_job_endpoint():
    """
    Create a new audio processing job.
    
    Accepts POST request with JSON body:
    {
        "url": "https://www.instagram.com/reel/ABC123/"
    }
    
    Returns:
        JSON with job_id
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Detect platform
        platform = detect_platform(url)
        platform_name = platform.value if platform != Platform.UNKNOWN else None
        
        # Create job in database
        job_id = create_job(url, platform_name)
        
        # Enqueue job for processing
        rq_job_id = enqueue_job(process_audio_job, job_id, url)
        
        logger.info(f"Created job {job_id} (RQ job: {rq_job_id}) for URL: {url}")
        
        return jsonify({
            'job_id': job_id,
            'rq_job_id': rq_job_id,
            'status': 'pending',
            'url': url
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create job: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/jobs/<job_id>/status', methods=['GET'])
def get_job_status(job_id: str):
    """
    Get job status.
    
    Returns:
        JSON with job status and progress information
    """
    try:
        job = get_job_result_data(job_id)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        return jsonify({
            'job_id': job_id,
            'status': job.get('status'),
            'url': job.get('url'),
            'platform': job.get('platform'),
            'error_message': job.get('error_message'),
            'created_at': job.get('created_at'),
            'updated_at': job.get('updated_at')
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to get job status: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/jobs/<job_id>/result', methods=['GET'])
def get_job_result(job_id: str):
    """
    Get complete job result including all processed data.
    
    Returns:
        JSON with complete job result (audio_url, transcript, analysis, etc.)
    """
    try:
        job_result = get_job_result_data(job_id)
        
        if not job_result:
            return jsonify({'error': 'Job not found'}), 404
        
        # Format response
        response = {
            'job_id': job_id,
            'status': job_result.get('status'),
            'platform': job_result.get('platform'),
            'result': {}
        }
        
        if job_result.get('audio_file'):
            response['result']['audio_url'] = job_result['audio_file'].get('url')
            response['result']['duration'] = job_result['audio_file'].get('duration')
            response['result']['size_bytes'] = job_result['audio_file'].get('size_bytes')
        
        if job_result.get('thumbnail'):
            response['result']['thumbnail_url'] = job_result['thumbnail'].get('url')
        
        if job_result.get('transcription'):
            response['result']['transcript'] = {
                'text': job_result['transcription'].get('text'),
                'language': job_result['transcription'].get('language'),
                'timestamps': job_result['transcription'].get('timestamps_json')
            }
        
        if job_result.get('analysis'):
            response['result']['analysis'] = {
                'summary': job_result['analysis'].get('summary'),
                'topics': job_result['analysis'].get('topics_json'),
                'sentiment': job_result['analysis'].get('sentiment'),
                'category': job_result['analysis'].get('category')
            }
        
        if job_result.get('embedding'):
            response['result']['embedding'] = {
                'id': job_result['embedding'].get('id'),
                'metadata': job_result['embedding'].get('metadata_json')
            }

        if job_result.get('metadata'):
            response['result']['metadata'] = job_result.get('metadata')
        
        if job_result.get('error_message'):
            response['error_message'] = job_result.get('error_message')
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Failed to get job result: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# SaveIt Integration API Endpoints
@app.route('/api/v1/process', methods=['POST'])
def saveit_process():
    """
    SaveIt integration endpoint: Submit a new audio processing job.
    
    Accepts POST request with JSON body:
    {
        "url": "https://www.instagram.com/reel/ABC123/"
    }
    
    Returns:
        JSON with job_id and status
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        url = data.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Detect platform
        platform = detect_platform(url)
        platform_name = platform.value if platform != Platform.UNKNOWN else None
        
        # Create job in database
        job_id = create_job(url, platform_name)
        
        # Enqueue job for processing
        rq_job_id = enqueue_job(process_audio_job, job_id, url)
        
        logger.info(f"SaveIt: Created job {job_id} (RQ job: {rq_job_id}) for URL: {url}")
        
        return jsonify({
            'job_id': job_id,
            'status': 'pending',
            'url': url
        }), 201
        
    except Exception as e:
        logger.error(f"SaveIt: Failed to create job: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/jobs/<job_id>', methods=['GET'])
def saveit_get_job(job_id: str):
    """
    SaveIt integration endpoint: Get complete job details including status and results.
    
    Returns:
        JSON with standardized format:
        {
            "job_id": "uuid",
            "status": "completed",
            "result": {
                "audio_url": "...",
                "thumbnail_url": "...",
                "transcript": {...},
                "analysis": {...},
                "metadata": {...}
            }
        }
    """
    try:
        job_result = get_job_result_data(job_id)
        
        if not job_result:
            return jsonify({'error': 'Job not found'}), 404
        
        # Format response in standardized SaveIt format
        response = {
            'job_id': job_id,
            'status': job_result.get('status'),
            'result': {}
        }
        
        # Add metadata
        response['result']['metadata'] = {
            'url': job_result.get('url'),
            'platform': job_result.get('platform'),
            'created_at': job_result.get('created_at'),
            'updated_at': job_result.get('updated_at')
        }
        
        # Add audio file info
        if job_result.get('audio_file'):
            response['result']['audio_url'] = job_result['audio_file'].get('url')
            response['result']['duration'] = job_result['audio_file'].get('duration')
            response['result']['size_bytes'] = job_result['audio_file'].get('size_bytes')
        
        # Add thumbnail
        if job_result.get('thumbnail'):
            response['result']['thumbnail_url'] = job_result['thumbnail'].get('url')
        
        # Add transcript
        if job_result.get('transcription'):
            response['result']['transcript'] = {
                'text': job_result['transcription'].get('text'),
                'language': job_result['transcription'].get('language'),
                'timestamps': job_result['transcription'].get('timestamps_json')
            }
        
        # Add analysis
        if job_result.get('analysis'):
            response['result']['analysis'] = {
                'summary': job_result['analysis'].get('summary'),
                'topics': job_result['analysis'].get('topics_json'),
                'sentiment': job_result['analysis'].get('sentiment'),
                'category': job_result['analysis'].get('category')
            }
        
        # Add embedding info (without full vector)
        if job_result.get('embedding'):
            response['result']['embedding'] = {
                'id': job_result['embedding'].get('id'),
                'metadata': job_result['embedding'].get('metadata_json')
            }
        
        # Add error if present
        if job_result.get('error_message'):
            response['error_message'] = job_result.get('error_message')
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"SaveIt: Failed to get job: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Run Flask development server
    # Using port 5001 because macOS AirPlay Receiver uses port 5000
    app.run(debug=True, host='0.0.0.0', port=5001)

