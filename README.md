# Golf Handicap Calculator

A local web application for calculating golf handicaps for friends who don't want to pay for official handicap services.

## Features

- **Local Database**: SQLite database for storing all data locally
- **Golfer Management**: Add, view, and track multiple golfers
- **Course Database**: Add golf courses with their ratings and slope
- **Score Tracking**: Record scores for different golfers on different courses
- **Handicap Calculation**: Automatic calculation using USGA handicap formulas
- **Course Handicap**: Calculate playing handicap for specific courses
- **Modern UI**: Responsive web interface with Bootstrap styling

## How Golf Handicaps Work

The application uses the standard USGA handicap calculation method:

1. **Handicap Differential**: `(Gross Score - Course Rating) × 113 / Slope Rating`
2. **Handicap Index**: Average of the best differentials (varies by number of scores):
   - 5-9 scores: Best 1 differential × 0.96
   - 10-19 scores: Best 3 differentials × 0.96
   - 20+ scores: Best 8 differentials × 0.96
3. **Course Handicap**: `(Handicap Index × Slope Rating / 113) + (Course Rating - Par)`

### Course Information Required

For each course, you need:
- **Course Rating**: The expected score for a scratch golfer (usually 50-80, most commonly 70-76)
- **Slope Rating**: Course difficulty for bogey golfers vs scratch golfers (55-155, average is 113)
- **Par**: Total par for the course (usually 72)

You can find this information on:
- Course scorecards
- Golf course websites
- Golf apps like Golf Advisor or PGA Course Database

## Installation & Setup

1. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**:
   ```bash
   python app.py
   ```

3. **Access the Application**:
   Open your browser and go to: `http://localhost:5001`

## Using the Application

### 1. Add Golfers
- Go to the "Golfers" tab
- Add new golfers with their names (email is optional)
- View existing golfers and their current handicap status

### 2. Add Courses
- Go to the "Courses" tab
- Add golf courses with their par, course rating, and slope rating
- The app comes with a few sample courses pre-loaded

### 3. Record Scores
- Go to the "Add Score" tab
- Select the golfer
- Choose either:
  - **Select Existing Course**: Pick from courses already in your database
  - **Enter Course Details**: Manually enter course name, par, course rating, and slope rating
- Enter the gross score and date played
- Scores are automatically used to calculate handicaps
- When entering course details manually, the system will create a new course entry if one doesn't already exist

### 4. Calculate Course Handicaps
- Go to the "Calculate Handicap" tab
- Select a golfer and the course they plan to play
- Get their course handicap for that specific course

### 5. View Golfer Details
- Click "View Details" on any golfer to see:
  - Current handicap index
  - All recorded scores
  - Score history and differentials

## Database

The application uses SQLite database (`golf_handicap.db`) which will be created automatically when you first run the app. This file contains all your data and can be backed up easily.

## Notes

- A golfer needs at least 5 scores to calculate a handicap
- The system uses the most recent 20 scores for handicap calculation
- All calculations follow USGA handicap system rules
- The application runs locally and doesn't require internet connection after setup
- **New Feature**: You can now add scores without pre-entering courses - just enter the course details directly when adding a score
- The system automatically prevents duplicate courses by checking name and ratings

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed: `pip install -r requirements.txt`
2. Check that Python is installed (Python 3.7+ recommended)
3. Ensure port 5000 is not being used by another application
4. The database file will be created automatically in the same directory

## Course Rating Help

If you need help finding course ratings for local courses:
- Check the course's official website
- Look at the scorecard (usually posted at the tee)
- Call the pro shop
- Use golf apps that have course databases
- For municipal courses, ratings are often posted online

The course rating is typically close to par but can vary. Slope rating of 113 is average - easier courses are lower, harder courses are higher. 