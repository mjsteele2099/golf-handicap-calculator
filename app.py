from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import os
import math
from werkzeug.utils import secure_filename
import uuid
import shutil

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///golf_handicap.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/profile_pics'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
db = SQLAlchemy(app)

# Database Models
class Golfer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True)
    profile_picture = db.Column(db.String(255), nullable=True)  # Store filename
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    scores = db.relationship('Score', backref='golfer', lazy=True, cascade='all, delete-orphan')

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    par = db.Column(db.Integer, nullable=False, default=72)
    course_rating = db.Column(db.Float, nullable=False)
    slope_rating = db.Column(db.Integer, nullable=False, default=113)
    scores = db.relationship('Score', backref='course', lazy=True)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    golfer_id = db.Column(db.Integer, db.ForeignKey('golfer.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    gross_score = db.Column(db.Integer, nullable=False)
    date_played = db.Column(db.Date, nullable=False)
    differential = db.Column(db.Float)  # Calculated handicap differential
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Handicap Calculation Functions
def calculate_differential(gross_score, course_rating, slope_rating):
    """Calculate handicap differential using USGA formula"""
    return (gross_score - course_rating) * 113 / slope_rating

def calculate_handicap_index(golfer_id):
    """Calculate handicap index based on 2024 USGA rules"""
    scores = Score.query.filter_by(golfer_id=golfer_id)\
                       .order_by(Score.date_played.desc())\
                       .limit(20).all()
    
    if len(scores) < 3:
        return None  # Need at least 3 scores for handicap per 2024 USGA rules
    
    # Calculate differentials for all scores
    differentials = []
    for score in scores:
        diff = calculate_differential(
            score.gross_score, 
            score.course.course_rating, 
            score.course.slope_rating
        )
        differentials.append(diff)
    
    # Sort differentials (best to worst)
    differentials.sort()
    
    num_scores = len(differentials)
    
    # Apply 2024 USGA rules for fewer than 20 scores
    if num_scores == 20:
        # Average of lowest 8
        best_scores = differentials[:8]
        adjustment = 0
    elif num_scores == 19:
        # Average of lowest 7
        best_scores = differentials[:7]
        adjustment = 0
    elif num_scores >= 17:
        # Average of lowest 6
        best_scores = differentials[:6]
        adjustment = 0
    elif num_scores >= 15:
        # Average of lowest 5
        best_scores = differentials[:5]
        adjustment = 0
    elif num_scores >= 12:
        # Average of lowest 4
        best_scores = differentials[:4]
        adjustment = 0
    elif num_scores >= 9:
        # Average of lowest 3
        best_scores = differentials[:3]
        adjustment = 0
    elif num_scores >= 7:
        # Average of lowest 2
        best_scores = differentials[:2]
        adjustment = 0
    elif num_scores == 6:
        # Average of lowest 2 with -1.0 adjustment
        best_scores = differentials[:2]
        adjustment = -1.0
    elif num_scores == 5:
        # Lowest 1 with no adjustment
        best_scores = differentials[:1]
        adjustment = 0
    elif num_scores == 4:
        # Lowest 1 with -1.0 adjustment
        best_scores = differentials[:1]
        adjustment = -1.0
    elif num_scores == 3:
        # Lowest 1 with -2.0 adjustment
        best_scores = differentials[:1]
        adjustment = -2.0
    else:
        return None  # Should not happen with the >= 3 check above
    
    # Calculate average of selected scores
    average_differential = sum(best_scores) / len(best_scores)
    
    # Apply adjustment
    handicap_index = average_differential + adjustment
    
    # Round to nearest tenth
    return round(handicap_index, 1)

def calculate_course_handicap(handicap_index, slope_rating, course_rating, par):
    """Calculate course handicap for a specific course"""
    if handicap_index is None:
        return None
    return round((handicap_index * slope_rating / 113) + (course_rating - par))

# File Upload Utilities
def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_profile_picture(file):
    """Save uploaded profile picture and return filename"""
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = str(uuid.uuid4()) + '_' + filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        return unique_filename
    return None

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/golfers', methods=['GET', 'POST'])
def handle_golfers():
    if request.method == 'POST':
        data = request.get_json()
        golfer = Golfer(name=data['name'], email=data.get('email'))
        db.session.add(golfer)
        db.session.commit()
        return jsonify({'id': golfer.id, 'name': golfer.name, 'email': golfer.email})
    
    golfers = Golfer.query.all()
    return jsonify([{
        'id': g.id, 
        'name': g.name, 
        'email': g.email,
        'profile_picture': g.profile_picture,
        'handicap_index': calculate_handicap_index(g.id),
        'score_count': len(g.scores)
    } for g in golfers])

@app.route('/api/golfers/<int:golfer_id>')
def get_golfer(golfer_id):
    golfer = Golfer.query.get_or_404(golfer_id)
    handicap_index = calculate_handicap_index(golfer_id)
    
    return jsonify({
        'id': golfer.id,
        'name': golfer.name,
        'email': golfer.email,
        'profile_picture': golfer.profile_picture,
        'handicap_index': handicap_index,
        'scores': [{
            'id': s.id,
            'course_name': s.course.name,
            'gross_score': s.gross_score,
            'date_played': s.date_played.isoformat(),
            'differential': calculate_differential(s.gross_score, s.course.course_rating, s.course.slope_rating)
        } for s in sorted(golfer.scores, key=lambda x: x.date_played, reverse=True)]
    })

@app.route('/api/golfers/<int:golfer_id>/profile-picture', methods=['POST'])
def upload_profile_picture(golfer_id):
    """Upload profile picture for a golfer"""
    golfer = Golfer.query.get_or_404(golfer_id)
    
    if 'profile_picture' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Remove old profile picture if exists
    if golfer.profile_picture:
        old_file_path = os.path.join(app.config['UPLOAD_FOLDER'], golfer.profile_picture)
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
    
    # Save new profile picture
    filename = save_profile_picture(file)
    if filename:
        golfer.profile_picture = filename
        db.session.commit()
        return jsonify({'message': 'Profile picture uploaded successfully', 'filename': filename})
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/golfers/<int:golfer_id>/profile-picture', methods=['DELETE'])
def delete_profile_picture(golfer_id):
    """Delete profile picture for a golfer"""
    golfer = Golfer.query.get_or_404(golfer_id)
    
    if golfer.profile_picture:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], golfer.profile_picture)
        if os.path.exists(file_path):
            os.remove(file_path)
        golfer.profile_picture = None
        db.session.commit()
        return jsonify({'message': 'Profile picture deleted successfully'})
    else:
        return jsonify({'error': 'No profile picture to delete'}), 404

@app.route('/static/profile_pics/<filename>')
def uploaded_file(filename):
    """Serve uploaded profile pictures"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/courses', methods=['GET', 'POST'])
def handle_courses():
    if request.method == 'POST':
        data = request.get_json()
        course = Course(
            name=data['name'],
            par=data.get('par', 72),
            course_rating=data['course_rating'],
            slope_rating=data.get('slope_rating', 113)
        )
        db.session.add(course)
        db.session.commit()
        return jsonify({
            'id': course.id,
            'name': course.name,
            'par': course.par,
            'course_rating': course.course_rating,
            'slope_rating': course.slope_rating
        })
    
    courses = Course.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'par': c.par,
        'course_rating': c.course_rating,
        'slope_rating': c.slope_rating
    } for c in courses])

@app.route('/api/scores', methods=['POST'])
def add_score():
    data = request.get_json()
    
    # Determine course_id based on input type
    if 'course_id' in data and data['course_id']:
        # Existing course selected
        course_id = data['course_id']
    elif 'manual_course' in data:
        # Manual course entry - find existing or create new
        manual_course = data['manual_course']
        
        # Check if course with same name and ratings already exists
        existing_course = Course.query.filter_by(
            name=manual_course['name'],
            course_rating=manual_course['course_rating'],
            slope_rating=manual_course['slope_rating']
        ).first()
        
        if existing_course:
            course_id = existing_course.id
        else:
            # Create new course
            new_course = Course(
                name=manual_course['name'],
                par=manual_course.get('par', 72),
                course_rating=manual_course['course_rating'],
                slope_rating=manual_course['slope_rating']
            )
            db.session.add(new_course)
            db.session.flush()  # Flush to get the ID
            course_id = new_course.id
    else:
        return jsonify({'error': 'Either course_id or manual_course data must be provided'}), 400
    
    # Create the score record
    score = Score(
        golfer_id=data['golfer_id'],
        course_id=course_id,
        gross_score=data['gross_score'],
        date_played=datetime.strptime(data['date_played'], '%Y-%m-%d').date()
    )
    db.session.add(score)
    db.session.commit()
    
    return jsonify({
        'id': score.id,
        'gross_score': score.gross_score,
        'date_played': score.date_played.isoformat(),
        'course_name': score.course.name
    })

@app.route('/api/scores/<int:score_id>', methods=['PUT', 'DELETE'])
def handle_score(score_id):
    score = Score.query.get_or_404(score_id)
    
    if request.method == 'DELETE':
        db.session.delete(score)
        db.session.commit()
        return jsonify({'message': 'Score deleted'})
    
    elif request.method == 'PUT':
        data = request.get_json()
        score.gross_score = data.get('gross_score', score.gross_score)
        score.date_played = datetime.strptime(data['date_played'], '%Y-%m-%d').date()
        
        # Handle course update if provided
        if 'course_id' in data and data['course_id']:
            score.course_id = data['course_id']
        elif 'manual_course' in data:
            # Manual course entry - find existing or create new
            manual_course = data['manual_course']
            
            # Check if course with same name and ratings already exists
            existing_course = Course.query.filter_by(
                name=manual_course['name'],
                course_rating=manual_course['course_rating'],
                slope_rating=manual_course['slope_rating']
            ).first()
            
            if existing_course:
                score.course_id = existing_course.id
            else:
                # Create new course
                new_course = Course(
                    name=manual_course['name'],
                    par=manual_course.get('par', 72),
                    course_rating=manual_course['course_rating'],
                    slope_rating=manual_course['slope_rating']
                )
                db.session.add(new_course)
                db.session.flush()  # Flush to get the ID
                score.course_id = new_course.id
        
        db.session.commit()
        return jsonify({
            'id': score.id,
            'gross_score': score.gross_score,
            'date_played': score.date_played.isoformat(),
            'course_name': score.course.name
        })

@app.route('/api/handicap/<int:golfer_id>/<int:course_id>')
def get_course_handicap(golfer_id, course_id):
    golfer = Golfer.query.get_or_404(golfer_id)
    course = Course.query.get_or_404(course_id)
    
    handicap_index = calculate_handicap_index(golfer_id)
    course_handicap = calculate_course_handicap(
        handicap_index, 
        course.slope_rating, 
        course.course_rating, 
        course.par
    )
    
    return jsonify({
        'golfer_name': golfer.name,
        'course_name': course.name,
        'handicap_index': handicap_index,
        'course_handicap': course_handicap
    })

@app.route('/golfer/<int:golfer_id>')
def golfer_details(golfer_id):
    """Render golfer details page"""
    golfer = Golfer.query.get_or_404(golfer_id)
    handicap_index = calculate_handicap_index(golfer_id)
    
    # Get scores with calculated differentials
    scores_with_diffs = []
    for score in sorted(golfer.scores, key=lambda x: x.date_played, reverse=True):
        differential = calculate_differential(
            score.gross_score, 
            score.course.course_rating, 
            score.course.slope_rating
        )
        scores_with_diffs.append({
            'id': score.id,
            'course_name': score.course.name,
            'gross_score': score.gross_score,
            'date_played': score.date_played,
            'differential': differential
        })
    
    return render_template('golfer_details.html', 
                         golfer=golfer, 
                         handicap_index=handicap_index,
                         scores=scores_with_diffs)

@app.route('/api/backup', methods=['POST'])
def create_backup():
    """Manual backup endpoint"""
    try:
        backup_database()
        return jsonify({'message': 'Database backup created successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def backup_database():
    """Create a backup of the database"""
    try:
        db_path = 'golf_handicap.db'
        if os.path.exists(db_path):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = f'golf_handicap_backup_{timestamp}.db'
            shutil.copy2(db_path, backup_path)
            print(f"✅ Database backed up to: {backup_path}")
            
            # Keep only last 5 backups to save space
            backup_files = [f for f in os.listdir('.') if f.startswith('golf_handicap_backup_')]
            backup_files.sort(reverse=True)
            for old_backup in backup_files[5:]:
                os.remove(old_backup)
                print(f"🗑️  Removed old backup: {old_backup}")
                
    except Exception as e:
        print(f"❌ Backup failed: {e}")

def ensure_sample_data():
    """Ensure sample courses and golfers exist - only add if missing"""
    try:
        # Add sample courses if none exist
        if Course.query.count() == 0:
            sample_courses = [
                Course(name="Pebble Beach Golf Links", par=72, course_rating=74.8, slope_rating=142),
                Course(name="Augusta National Golf Club", par=72, course_rating=76.2, slope_rating=137),
                Course(name="St. Andrews Old Course", par=72, course_rating=74.3, slope_rating=129),
                Course(name="Local Municipal Course", par=72, course_rating=70.5, slope_rating=118),
                Course(name="The Continental", par=72, course_rating=71.8, slope_rating=125)
            ]
            for course in sample_courses:
                db.session.add(course)
            db.session.commit()
            print("🏌️ Sample courses added")
            
        # Ensure The Continental exists (in case it was lost)
        if not Course.query.filter_by(name="The Continental").first():
            continental = Course(name="The Continental", par=72, course_rating=71.8, slope_rating=125)
            db.session.add(continental)
            db.session.commit()
            print("🏌️ The Continental course restored")
            
    except Exception as e:
        print(f"❌ Error ensuring sample data: {e}")

if __name__ == '__main__':
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Ensure sample data exists
        ensure_sample_data()
    
    app.run(debug=True, host='0.0.0.0', port=5001) 