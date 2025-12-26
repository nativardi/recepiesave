# Description: Legacy synchronous download endpoint kept for internal testing and compatibility.
# Provides a Flask blueprint that can be removed once embedded SDK users rely exclusively on the async job API.

import io
import logging

from flask import Blueprint, request, jsonify, send_file

from utils.audio_processor import process_video_to_audio
from utils.platform_detector import detect_platform, Platform

logger = logging.getLogger(__name__)


def create_legacy_blueprint(platform_router) -> Blueprint:
    """
    Build the legacy blueprint using the shared platform router.
    """
    legacy_bp = Blueprint('legacy', __name__)

    @legacy_bp.route('/download', methods=['POST'])
    def legacy_download():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Request body must be JSON'}), 400

            url = data.get('url')
            if not url:
                return jsonify({'error': 'URL is required'}), 400

            client_ip = request.remote_addr
            logger.info(f"Download request from {client_ip} for URL: {url}")

            try:
                metadata = platform_router.fetch_metadata(url)
                video_url = metadata['video_url']
                title = metadata.get('title', 'Video')

                platform = detect_platform(url)
                platform_name = platform.value if platform != Platform.UNKNOWN else 'video'
                logger.info(f"Fetched metadata from {platform_name}. Title: {title}")
            except ValueError as exc:
                logger.warning(f"Invalid URL provided: {url} - {exc}")
                return jsonify({'error': str(exc)}), 400
            except RuntimeError as exc:
                logger.error(f"Failed to fetch metadata: {exc}")
                return jsonify({'error': str(exc)}), 400

            try:
                use_ytdlp = (platform == Platform.TIKTOK)
                source_url = url if use_ytdlp else video_url
                audio_bytes, filename, thumbnail_bytes = process_video_to_audio(source_url, use_ytdlp=use_ytdlp)
                filename = filename.replace('video_audio_', f'{platform_name}_audio_')
                logger.info(f"Audio processing complete. Size: {len(audio_bytes)} bytes")
            except RuntimeError as exc:
                logger.error(f"Failed to process audio: {exc}")
                return jsonify({'error': str(exc)}), 500

            audio_file = io.BytesIO(audio_bytes)
            audio_file.seek(0)

            return send_file(
                audio_file,
                mimetype='audio/mpeg',
                as_attachment=True,
                download_name=filename
            )
        except Exception as exc:
            logger.error(f"Unexpected error: {exc}", exc_info=True)
            return jsonify({'error': 'An unexpected error occurred. Please try again.'}), 500

    return legacy_bp

